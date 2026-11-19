import { BaseService } from './BaseService';
import { BaseRepository } from '../repositories/BaseRepository';
import { PagamentoRepository } from '../repositories/PagamentoRepository';
import { ProvedorPagamentoService } from './ProvedorPagamentoService';
import { CalculoPagamentoService } from './CalculoPagamentoService';
import { VariavelSistemaService } from './VariavelSistemaService';
import { NotificacaoService } from './NotificacaoService';
import { MercadoPagoProvider } from './MercadoPagoProvider';
import { EfiProvider } from './EfiProvider';
import { descriptografar } from '../utils/Criptografia';
// Pagamento: gatilho = aceitação da candidatura. Contratante paga até o fim do prazo de
// aceitação (prazo_resposta_ate da candidatura, ou data_inicio da vaga, ou 24h).
// Notificação 60 min antes de expirar (worker). Status da cobrança vem SEMPRE do provedor
// (webhook só dispara a consulta; nunca confiamos cegamente no corpo do webhook).
export class PagamentoService extends BaseService<any> {
  private repo = new PagamentoRepository();
  private provedorSvc = new ProvedorPagamentoService();
  private calculoSvc = new CalculoPagamentoService();
  private variavelSvc = new VariavelSistemaService();
  private notificacaoSvc = new NotificacaoService();
  constructor() { super(new PagamentoRepository()); }
  private provedorImpl(nome: string) { return nome === 'EFI' ? new EfiProvider() : new MercadoPagoProvider(); }
  private async segredos(provedor: any) {
    const accessToken = descriptografar(provedor.clientSecretCriptografado || provedor.client_secret_criptografado || '');
    const webhookSecret = (provedor.webhookSecretCriptografado || provedor.webhook_secret_criptografado) ? descriptografar(provedor.webhookSecretCriptografado || provedor.webhook_secret_criptografado) : '';
    const config = typeof provedor.configJson === 'string' ? JSON.parse(provedor.configJson) : (provedor.configJson || provedor.config_json || {});
    return { accessToken, webhookSecret, config, clientId: provedor.clientId || provedor.client_id };
  }
  private async carregarCandidatura(candidaturaId: number): Promise<any> {
    const pool = BaseRepository.getPool() as any;
    const r = await pool.query(`SELECT c.*, v.contratante_id, v.titulo as vaga_titulo, v.data_inicio, v.data_fim, u.email as contratante_email, u.nome_completo as contratante_nome FROM candidaturas c JOIN vagas v ON v.id = c.vaga_id JOIN usuarios u ON u.id = v.contratante_id WHERE c.id = $1`, [candidaturaId]);
    if (!r.rows[0]) throw new Error('Candidatura não encontrada');
    return r.rows[0];
  }
  private async expiracao(cand: any): Promise<Date> {
    if (cand.prazo_resposta_ate) return new Date(cand.prazo_resposta_ate);
    if (cand.data_inicio) return new Date(cand.data_inicio);
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  // Patch 22 — Checkout Bricks: dadosCartao agora é um objeto com o que o Brick devolve
  // (token, parcelas, bandeira, emissor, identificação). Aceita string no 4º arg por
  // compatibilidade com chamadas antigas (só token).
  async criarOuObter(candidaturaId: number, contratanteId: number, metodo = 'pix', dadosCartao?: string | { tokenCartao?: string; parcelas?: number; paymentMethodId?: string; issuerId?: string; identificationTipo?: string; identificationNumero?: string }): Promise<any> {
    const dc: any = typeof dadosCartao === 'string' ? { tokenCartao: dadosCartao } : (dadosCartao || {});
    const tokenCartao = dc.tokenCartao; const parcelas = dc.parcelas;
    try {
      const cand = await this.carregarCandidatura(candidaturaId);
      if (Number(cand.contratante_id) !== Number(contratanteId)) throw new Error('Só o contratante da vaga pode pagar');
      if (String(cand.status || '').toUpperCase() !== 'ACEITA') throw new Error('Pagamento só após a candidatura ser aceita');
      const existente = await this.repo.buscarPorCandidatura(candidaturaId);
      if (existente && ['AGUARDANDO_PAGAMENTO', 'EM_ESCROW'].includes(String((existente as any).status || ''))) return existente;
      const pool = BaseRepository.getPool() as any;
      const rt = await pool.query(`SELECT COALESCE(SUM(valor_servico),0) AS s, COALESCE(SUM(valor_transporte),0) AS t FROM vaga_turnos WHERE vaga_id = $1`, [cand.vaga_id]);
      const calculo: any = await this.calculoSvc.calcular({ valor_servico: Number(rt.rows[0]?.s || 0), valor_transporte: Number(rt.rows[0]?.t || 0), data_inicio_local: cand.data_inicio, data_fim_local: cand.data_fim }, true);
      const metodoFinal = metodo === 'cartao' ? 'cartao' : 'pix';
      const totalC = metodoFinal === 'cartao' ? Math.round(Number(calculo.total_cartao) * 100) : Math.round(Number(calculo.total_pix) * 100);
      const { provedor } = await this.provedorSvc.buscarAtivoComSegredos();
      const seg = await this.segredos(provedor);
      const chave = `pg-cand-${candidaturaId}`;
      const expira = await this.expiracao(cand);
      if (expira.getTime() <= Date.now()) throw new Error('Prazo de pagamento expirado');
      const cobranca = await this.provedorImpl(String(provedor.provedor)).criarCobranca({
        descricao: `UaiFrila — Vaga #${cand.vaga_id} ${cand.vaga_titulo || ''}`.slice(0, 140),
        valorCentavos: totalC, metodo: metodoFinal, pagadorEmail: cand.contratante_email, pagadorNome: cand.contratante_nome,
        expiraEm: expira, chaveIdempotencia: chave, tokenCartao, parcelas,
        paymentMethodId: dc.paymentMethodId, issuerId: dc.issuerId,
        identificationTipo: dc.identificationTipo, identificationNumero: dc.identificationNumero,
      }, { ...seg, accessToken: seg.accessToken });
      return await this.repo.criarGenerico({
        candidatura_id: candidaturaId, vaga_id: cand.vaga_id, contratante_id: contratanteId,
        freela_id: cand.freela_id || cand.usuario_id, provedor: provedor.provedor,
        provedor_pagamento_id: cobranca.provedorPagamentoId, metodo: metodoFinal, status: 'AGUARDANDO_PAGAMENTO',
        chave_idempotencia: chave,
        valor_servico_centavos: Math.round(Number(calculo.valor_servico) * 100),
        valor_transporte_centavos: Math.round(Number(calculo.valor_transporte) * 100),
        comissao_centavos: Math.round(Number(calculo.comissao) * 100),
        taxa_centavos: totalC - (Math.round(Number(calculo.valor_servico) * 100) + Math.round(Number(calculo.valor_transporte) * 100) + Math.round(Number(calculo.comissao) * 100)),
        total_centavos: totalC, qr_code: cobranca.qrCode, qr_code_url: cobranca.qrCodeUrl, checkout_url: cobranca.checkoutUrl, expira_em: expira,
      });
    } catch (e: any) { this.handleError(e, 'PagamentoService.criarOuObter'); }
  }
  // Patch 22 — Resumo para a tela de pagamento: totais por método SEM criar cobrança.
  // Retorno é o público do cálculo (NUNCA comissão/taxa — sigilo comercial).
  // Usado para exibir "Pix economiza R$ X" e o amount do Brick ANTES de pagar.
  async resumo(candidaturaId: number, usuarioId: number): Promise<any> {
    try {
      const cand = await this.carregarCandidatura(candidaturaId);
      const ehParticipante = Number(cand.contratante_id) === Number(usuarioId) || Number(cand.freela_id || cand.usuario_id) === Number(usuarioId);
      if (!ehParticipante) throw new Error('Você não participa deste pagamento');
      const pool = BaseRepository.getPool() as any;
      const rt = await pool.query(`SELECT COALESCE(SUM(valor_servico),0) AS s, COALESCE(SUM(valor_transporte),0) AS t FROM vaga_turnos WHERE vaga_id = $1`, [cand.vaga_id]);
      const calculo: any = await this.calculoSvc.calcular({ valor_servico: Number(rt.rows[0]?.s || 0), valor_transporte: Number(rt.rows[0]?.t || 0), data_inicio_local: cand.data_inicio, data_fim_local: cand.data_fim }, false);
      const { provedor } = await this.provedorSvc.buscarAtivoComSegredos();
      return {
        candidatura_id: candidaturaId, vaga_id: cand.vaga_id, status_candidatura: cand.status,
        valor_servico: calculo.valor_servico, valor_transporte: calculo.valor_transporte,
        total_pix: calculo.total_pix, total_cartao: calculo.total_cartao, economia_pix: calculo.economia_pix,
        provedor: provedor.provedor,
      };
    } catch (e: any) { this.handleError(e, 'PagamentoService.resumo'); }
  }
  // Patch 22 — Public Key do provedor ativo para o front inicializar o Checkout Bricks.
  // Public Key é pública por definição: pode ir para o front. Sem ela, o Brick não renderiza.
  async chavePublica(): Promise<any> {
    try {
      const { provedor } = await this.provedorSvc.buscarAtivoComSegredos();
      return { provedor: provedor.provedor, ambiente: provedor.ambiente, public_key: (provedor as any).publicKey ?? (provedor as any).public_key ?? null };
    } catch (e: any) { this.handleError(e, 'PagamentoService.chavePublica'); }
  }
  async buscarPorCandidatura(candidaturaId: number, usuarioId: number, isAdmin = false): Promise<any> {
    const p: any = await this.repo.buscarPorCandidatura(candidaturaId);
    if (!p) throw new Error('Pagamento não encontrado para esta candidatura');
    if (Number(p.contratanteId ?? p.contratante_id) !== Number(usuarioId) && Number(p.freelaId ?? p.freela_id) !== Number(usuarioId) && !isAdmin) throw new Error('Você não participa deste pagamento');
    return isAdmin ? (typeof p.toPublicAdmin === 'function' ? p.toPublicAdmin() : p) : (typeof p.toPublic === 'function' ? p.toPublic() : p);
  }
  async listarPorContratante(contratanteId: number, isAdmin = false): Promise<any[]> {
    const lista = await this.repo.listarPorContratante(contratanteId);
    return lista.map((p: any) => isAdmin ? p.toPublicAdmin() : p.toPublic());
  }
  async processarWebhook(provedorNome: string, headers: Record<string, string>, corpo: any, corpoBruto: string): Promise<any> {
    try {
      const { provedor } = await this.provedorSvc.buscarAtivoComSegredos();
      if (String(provedor.provedor).toUpperCase() !== String(provedorNome).toUpperCase()) throw new Error('Webhook de provedor diferente do ativo');
      const seg = await this.segredos(provedor);
      const ok = this.provedorImpl(String(provedor.provedor)).validarWebhook(headers, corpoBruto, { webhookSecret: seg.webhookSecret });
      if (!ok) throw new Error('Assinatura do webhook inválida');
      const provedorPagamentoId = String(corpo?.data?.id || corpo?.id || corpo?.payment_id || corpo?.txid || '');
      if (!provedorPagamentoId) throw new Error('Webhook sem id do pagamento');
      return await this.sincronizarPeloProvedor(provedorPagamentoId);
    } catch (e: any) { this.handleError(e, 'PagamentoService.processarWebhook'); }
  }
  async sincronizarPeloProvedor(provedorPagamentoId: string): Promise<any> {
    const pagamento: any = await this.repo.buscarPorProvedorPagamentoId(provedorPagamentoId);
    if (!pagamento) throw new Error('Pagamento não encontrado para este id do provedor');
    if (String(pagamento.status).toUpperCase() !== 'AGUARDANDO_PAGAMENTO') return pagamento;
    const { provedor } = await this.provedorSvc.buscarAtivoComSegredos();
    const seg = await this.segredos(provedor);
    const consulta = await this.provedorImpl(String(provedor.provedor)).consultarCobranca(provedorPagamentoId, seg as any);
    const statusProv = String(consulta.status || '').toLowerCase();
    const pool = BaseRepository.getPool() as any;
    if (['approved', 'approved_payment', 'concluida', 'paid', 'settled'].includes(statusProv)) {
      const atualizado = await this.repo.atualizarGenerico(Number(pagamento.id), { status: 'EM_ESCROW', pago_em: new Date() });
      try {
        const ex = await pool.query(`SELECT id FROM transacoes WHERE pagamento_id = $1 LIMIT 1`, [pagamento.id]);
        if (!ex.rows[0]) await pool.query(`INSERT INTO transacoes (codigo, pagamento_id, vaga_id, freela_id, contratante_id, valor_base, valor_total_contratante, valor_liquido_freela, status, metodo_pagamento, observacoes, expira_em, data_pagamento, criado_em) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'EM_ESCROW',$9,$10,$11,NOW(),NOW())`, [`PG-${pagamento.id}`, pagamento.id, pagamento.vaga_id, pagamento.freela_id, pagamento.contratante_id, pagamento.valor_servico_centavos / 100 + pagamento.valor_transporte_centavos / 100, pagamento.total_centavos / 100, (pagamento.valor_servico_centavos + pagamento.valor_transporte_centavos) / 100, pagamento.metodo, `Escrow — pagamento #${pagamento.id} — candidatura #${pagamento.candidatura_id}`, pagamento.expira_em]);
        else await pool.query(`UPDATE transacoes SET status = 'EM_ESCROW', data_pagamento = NOW() WHERE pagamento_id = $1`, [pagamento.id]);
      } catch (e: any) { console.error('[PagamentoService] Espelho transacao falhou:', e.message); }
      try { await this.notificacaoSvc.criarNotificacao({ usuario_id: pagamento.contratante_id, tipo: 'PAGAMENTO_CONFIRMADO', titulo: `Pagamento confirmado — Vaga #${pagamento.vaga_id}`, mensagem: 'Pagamento confirmado. O valor está em escrow até os turnos serem confirmados.', referencia_tipo: 'PAGAMENTO', referencia_id: pagamento.id }); } catch {}
      return atualizado;
    }
    if (['rejected', 'cancelled', 'canceled', 'failed', 'expired', 'cancelada'].includes(statusProv)) {
      return await this.repo.atualizarGenerico(Number(pagamento.id), { status: 'CANCELADO', erro: `Provedor: ${statusProv}` });
    }
    return pagamento;
  }
  // Reembolso: 100% se nenhum turno confirmado; parcial (só turnos restantes) se algum confirmado.
  async reembolsar(pagamentoId: number, usuarioId: number, motivo: string, isAdmin = false): Promise<any> {
    try {
      const pagamento: any = await this.repo.buscarPorId(pagamentoId);
      if (!pagamento) throw new Error('Pagamento não encontrado');
      if (Number(pagamento.contratante_id) !== Number(usuarioId) && !isAdmin) throw new Error('Só o contratante pode pedir o reembolso');
      const status = String(pagamento.status).toUpperCase();
      const pool = BaseRepository.getPool() as any;
      const rtt = await pool.query(`SELECT tt.valor_servico, tt.valor_transporte, tt.status FROM trampo_turnos tt JOIN trampos t ON t.id = tt.trampo_id WHERE t.vaga_id = $1 AND t.freela_id = $2`, [pagamento.vaga_id, pagamento.freela_id]);
      const confirmados = (rtt.rows || []).filter((x: any) => ['CONFIRMADO', 'CONCLUIDO', 'AGUARDANDO_CONFIRMACAO'].includes(String(x.status).toUpperCase()));
      if (status === 'AGUARDANDO_PAGAMENTO') {
        return await this.repo.atualizarGenerico(pagamentoId, { status: 'CANCELADO', erro: motivo || 'Cancelado antes do pagamento' });
      }
      if (status !== 'EM_ESCROW') throw new Error(`Pagamento com status ${status} não pode ser reembolsado`);
      let valorReembolsoC = Number(pagamento.total_centavos);
      if (confirmados.length) {
        let mantemC = 0;
        for (const t of confirmados) mantemC += await this.calculoSvc.grossUpTurno(Number(t.valor_servico || 0), Number(t.valor_transporte || 0), String(pagamento.metodo));
        valorReembolsoC = Math.max(0, Number(pagamento.total_centavos) - mantemC);
        if (valorReembolsoC <= 0) throw new Error('Não há valor restante para reembolsar — todos os turnos já foram confirmados');
      }
      const { provedor } = await this.provedorSvc.buscarAtivoComSegredos();
      const seg = await this.segredos(provedor);
      await this.provedorImpl(String(provedor.provedor)).reembolsar(String(pagamento.provedor_pagamento_id), valorReembolsoC, seg as any);
      const novoStatus = valorReembolsoC >= Number(pagamento.total_centavos) ? 'REEMBOLSADO' : 'EM_ESCROW';
      const atualizado = await this.repo.atualizarGenerico(pagamentoId, { status: novoStatus, reembolsado_em: new Date(), erro: `Reembolso ${valorReembolsoC >= Number(pagamento.total_centavos) ? 'total' : 'parcial'}: ${motivo || ''}` });
      try { await pool.query(`UPDATE transacoes SET status = $1 WHERE pagamento_id = $2`, [novoStatus, pagamentoId]); } catch {}
      try { await this.notificacaoSvc.criarNotificacao({ usuario_id: pagamento.freela_id, tipo: 'PAGAMENTO_REEMBOLSADO', titulo: `Reembolso — Vaga #${pagamento.vaga_id}`, mensagem: `O contratante cancelou. Reembolso ${valorReembolsoC >= Number(pagamento.total_centavos) ? 'total' : 'parcial'} de R$ ${(valorReembolsoC / 100).toFixed(2).replace('.', ',')}.`, referencia_tipo: 'PAGAMENTO', referencia_id: pagamentoId }); } catch {}
      return { ...atualizado, valor_reembolsado: valorReembolsoC / 100 };
    } catch (e: any) { this.handleError(e, 'PagamentoService.reembolsar'); }
  }
  async processarJobs(): Promise<{ notificacoes: number; sincronizados: number }> {
    const minutos = await this.variavelSvc.buscarNumeroObrigatorio('NOTIFICACAO_PAGAMENTO_ANTECEDENCIA_MINUTOS').catch(() => 60);
    let notificacoes = 0, sincronizados = 0;
    try {
      const pendentes = await this.repo.listarPendentesNotificacao(Number(minutos));
      for (const p of pendentes) {
        try {
          await this.notificacaoSvc.criarNotificacao({ usuario_id: (p as any).contratanteId ?? (p as any).contratante_id, tipo: 'PAGAMENTO_EXPIRANDO', titulo: `Pagamento expira em breve — Vaga #${(p as any).vagaId ?? (p as any).vaga_id}`, mensagem: 'Faltam 60 minutos ou menos para o prazo de pagamento. Pague para garantir o trampo.', referencia_tipo: 'PAGAMENTO', referencia_id: Number((p as any).id) });
          await this.repo.atualizarGenerico(Number((p as any).id), { notificacao_60min_enviada: true });
          notificacoes++;
        } catch (e: any) { console.error('[PagamentoJob] notificação falhou:', e.message); }
      }
    } catch (e: any) { console.error('[PagamentoJob] notificações falharam:', e.message); }
    try {
      const aguardando = await this.repo.listarAguardando();
      for (const p of aguardando) {
        const idProv = (p as any).provedorPagamentoId ?? (p as any).provedor_pagamento_id;
        if (!idProv) continue;
        try { await this.sincronizarPeloProvedor(String(idProv)); sincronizados++; } catch (e: any) { console.error('[PagamentoJob] sincronizar falhou:', e.message); }
      }
    } catch (e: any) { console.error('[PagamentoJob] polling falhou:', e.message); }
    try {
      const pool = BaseRepository.getPool() as any;
      await pool.query(`UPDATE pagamentos SET status = 'EXPIRADO', atualizado_em = NOW() WHERE status = 'AGUARDANDO_PAGAMENTO' AND expira_em < NOW()`);
    } catch (e: any) { console.error('[PagamentoJob] expirar falhou:', e.message); }
    return { notificacoes, sincronizados };
  }
}
