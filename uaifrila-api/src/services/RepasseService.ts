import { BaseService } from './BaseService';
import { BaseRepository } from '../repositories/BaseRepository';
import { RepasseRepository } from '../repositories/RepasseRepository';
import { ProvedorPagamentoService } from './ProvedorPagamentoService';
import { VariavelSistemaService } from './VariavelSistemaService';
import { NotificacaoService } from './NotificacaoService';
import { MercadoPagoProvider } from './MercadoPagoProvider';
import { EfiProvider } from './EfiProvider';
import { descriptografar } from '../utils/Criptografia';
// Repasse por turno: gatilho = confirmação do contratante. Paga 15 min depois (REPASSE_AGUARDAR_MINUTOS).
// Valor = serviço + transporte DO TURNO (sem comissão, sem taxa — já absorvidas no total).
// Idempotente por chave_idempotencia + UNIQUE em trampo_turno_id.
export class RepasseService extends BaseService<any> {
  private repo = new RepasseRepository();
  private provedorSvc = new ProvedorPagamentoService();
  private variavelSvc = new VariavelSistemaService();
  private notificacaoSvc = new NotificacaoService();
  constructor() { super(new RepasseRepository()); }
  async agendarParaTurno(trampoTurnoId: number): Promise<any> {
    try {
      const pool = BaseRepository.getPool() as any;
      const r = await pool.query(`SELECT tt.*, t.freela_id, t.contratante_id FROM trampo_turnos tt JOIN trampos t ON t.id = tt.trampo_id WHERE tt.id = $1`, [trampoTurnoId]);
      const turno = r.rows[0];
      if (!turno) throw new Error('Turno não encontrado');
      if (String(turno.status).toUpperCase() !== 'CONFIRMADO') throw new Error('Repasse só para turno CONFIRMADO pelo contratante');
      const ja = await this.repo.buscarPorTurno(trampoTurnoId);
      if (ja) return ja;
      const minutos = await this.variavelSvc.buscarNumeroObrigatorio('REPASSE_AGUARDAR_MINUTOS').catch(() => 15);
      const confirmadoEm = turno.confirmado_em ? new Date(turno.confirmado_em).getTime() : Date.now();
      const { provedor } = await this.provedorSvc.buscarAtivoComSegredos();
      const valorC = Math.round((Number(turno.valor_servico || 0) + Number(turno.valor_transporte || 0)) * 100);
      if (valorC <= 0) throw new Error('Turno sem valor para repassar');
      return await this.repo.criarGenerico({
        trampo_turno_id: trampoTurnoId, trampo_id: turno.trampo_id, freela_id: turno.freela_id,
        provedor: provedor.provedor, chave_idempotencia: `repasse-turno-${trampoTurnoId}`,
        status: 'AGENDADO', valor_centavos: valorC, agendar_para: new Date(confirmadoEm + Number(minutos) * 60 * 1000),
      });
    } catch (e: any) { this.handleError(e, 'RepasseService.agendarParaTurno'); }
  }
  // Agenda repasses que faltam (ex.: turno auto-confirmado pelo worker, que marca direto no SQL).
  async agendarFaltantes(): Promise<number> {
    const pool = BaseRepository.getPool() as any;
    const r = await pool.query(`SELECT tt.id FROM trampo_turnos tt WHERE tt.status = 'CONFIRMADO' AND NOT EXISTS (SELECT 1 FROM repasses rp WHERE rp.trampo_turno_id = tt.id) LIMIT 100`);
    let n = 0;
    for (const row of r.rows || []) { try { await this.agendarParaTurno(Number(row.id)); n++; } catch (e: any) { console.error('[Repasse] agendar faltante falhou:', e.message); } }
    return n;
  }
  async processarVencidos(): Promise<{ pagos: number; falhas: number }> {
    let pagos = 0, falhas = 0;
    try { await this.agendarFaltantes(); } catch (e: any) { console.error('[Repasse] agendar faltantes falhou:', e.message); }
    const pool = BaseRepository.getPool() as any;
    try {
      const vencidos = await this.repo.reivindicarVencidos(50);
      for (const rep of vencidos) {
        const id = Number((rep as any).id);
        try {
          const rp = await pool.query(`SELECT up.chave_pix, up.tipo_chave, u.nome_completo FROM usuario_pix up JOIN usuarios u ON u.id = up.usuario_id WHERE up.usuario_id = $1 AND up.ativo = true LIMIT 1`, [(rep as any).freelaId ?? (rep as any).freela_id]);
          const pix = rp.rows[0];
          if (!pix?.chave_pix) throw new Error('Freela sem chave Pix ativa — repasse não pode ser enviado');
          const { provedor } = await this.provedorSvc.buscarAtivoComSegredos();
          const seg: any = { accessToken: descriptografar((provedor as any).clientSecretCriptografado || (provedor as any).client_secret_criptografado || ''), config: typeof (provedor as any).configJson === 'string' ? JSON.parse((provedor as any).configJson) : ((provedor as any).configJson || (provedor as any).config_json || {}), clientId: (provedor as any).clientId || (provedor as any).client_id };
          const impl = String(provedor.provedor).toUpperCase() === 'EFI' ? new EfiProvider() : new MercadoPagoProvider();
          const r = await impl.transferirPix({ chavePix: pix.chave_pix, tipoChave: pix.tipo_chave, valorCentavos: Number((rep as any).valorCentavos ?? (rep as any).valor_centavos), descricao: `UaiFrila — repasse turno #${(rep as any).trampoTurnoId ?? (rep as any).trampo_turno_id}` }, seg);
          await pool.query(`UPDATE repasses SET status = 'PAGO', pago_em = NOW(), comprovante = $2, atualizado_em = NOW() WHERE id = $1`, [id, r.comprovante]);
          pagos++;
          try { await this.notificacaoSvc.criarNotificacao({ usuario_id: Number((rep as any).freelaId ?? (rep as any).freela_id), tipo: 'REPASSE_ENVIADO', titulo: 'Repasse enviado', mensagem: `Repasse de R$ ${(Number((rep as any).valorCentavos ?? (rep as any).valor_centavos) / 100).toFixed(2).replace('.', ',')} enviado para sua chave Pix.`, referencia_tipo: 'REPASSE', referencia_id: id }); } catch {}
        } catch (e: any) {
          const tentativas = Number((rep as any).tentativas || 0) + 1;
          const falhouFinal = tentativas >= 5;
          await pool.query(`UPDATE repasses SET status = $2, tentativas = $3, erro = $4, agendar_para = CASE WHEN $2 = 'FALHA' THEN NOW() + INTERVAL '30 minutes' ELSE agendar_para END, atualizado_em = NOW() WHERE id = $1`, [id, falhouFinal ? 'FALHA_FINAL' : 'FALHA', tentativas, String(e.message || e).slice(0, 500)]);
          falhas++;
          console.error('[RepasseJob] repasse falhou:', e.message);
        }
      }
    } catch (e: any) { console.error('[RepasseJob] lote falhou:', e.message); }
    return { pagos, falhas };
  }
}
