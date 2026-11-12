import { BaseService } from './BaseService';
import { CandidaturaRepository } from '../repositories/CandidaturaRepository';
import { VariavelSistemaService } from './VariavelSistemaService';
import { NotificacaoService } from './NotificacaoService';
import { BaseRepository } from '../repositories/BaseRepository';

export class CandidaturaService extends BaseService<any> {
  private variavelSvc = new VariavelSistemaService();
  private notificacaoService = new NotificacaoService();
  constructor() { super(new CandidaturaRepository()); }

  async listarPorVaga(vagaId: number): Promise<any[]> {
    const r = this.getRepo() as CandidaturaRepository;
    if (typeof (r as any).listarPorVaga === 'function') return await (r as any).listarPorVaga(vagaId);
    return await this.listarPorCampo('vaga_id', vagaId);
  }

  async listarMinhas(freelaId: number): Promise<any[]> {
    const r = this.getRepo() as CandidaturaRepository;
    if (typeof (r as any).listarMinhas === 'function') return await (r as any).listarMinhas(freelaId);
    return [];
  }

  // Compatível com BaseService.criar(dados, _usuarioId?) - segundo arg OPCIONAL no base
  // Aqui é obrigatório para candidatar, mas a assinatura aceita 2 args sem quebrar TS2416
  async criar(dados: any, usuarioId?: number): Promise<any> {
    if (!usuarioId) throw new Error('usuarioId obrigatório para candidatar');
    const pool = BaseRepository.getPool() as any;
    const vagaId = Number(dados.vaga_id || dados.vagaId);
    if (!vagaId) throw new Error('vaga_id obrigatório');
    const rv = await pool.query(`SELECT v.*, sv.chave as status_chave, sv.permite_candidatar FROM vagas v JOIN status_vaga sv ON sv.id = v.status_vaga_id WHERE v.id = $1`, [vagaId]);
    const vaga = rv.rows[0];
    if (!vaga) throw new Error('Vaga não encontrada');
    // NULL = nao informado = aceita (o mural usa o mesmo padrao `?? true`).
    // Antes: `!vaga.permite_candidatar` tratava NULL como bloqueio e toda candidatura caia em 500.
    if (vaga.permite_candidatar === false) throw new Error(`Vaga com status ${vaga.status_chave} não aceita candidaturas`);
    if (Number(vaga.contratante_id) === Number(usuarioId)) throw new Error('Você não pode se candidatar na sua própria vaga');
    const rexiste = await pool.query(`SELECT id FROM candidaturas WHERE vaga_id = $1 AND (freela_id = $2 OR usuario_id = $2) AND status IN ('PENDENTE','ACEITA')`, [vagaId, usuarioId]);
    if (rexiste.rows.length) throw new Error('Você já se candidatou para esta vaga');
    const r = await pool.query(`INSERT INTO candidaturas (vaga_id, freela_id, usuario_id, status) VALUES ($1,$2,$2,'PENDENTE') RETURNING *`, [vagaId, usuarioId]);
    if (vaga.status_chave === 'AGUARDANDO_CANDIDATURA') {
      const rs = await pool.query(`SELECT id FROM status_vaga WHERE chave='AGUARDANDO_ACEITE'`);
      if (rs.rows[0]) await pool.query(`UPDATE vagas SET status_vaga_id = $1 WHERE id = $2`, [rs.rows[0].id, vagaId]);
    }
    return r.rows[0];
  }

  // Alias que o App.ts antigo usava
  async candidatar(dados: any, usuarioId: number): Promise<any> { return this.criar(dados, usuarioId); }

  async aceitar(candidaturaId: number, contratanteId: number): Promise<any> {
    const pool = BaseRepository.getPool() as any;
    const rc = await pool.query(`SELECT c.*, v.contratante_id, v.titulo FROM candidaturas c JOIN vagas v ON v.id = c.vaga_id WHERE c.id = $1`, [candidaturaId]);
    const cand = rc.rows[0];
    if (!cand) throw new Error('Candidatura não encontrada');
    if (Number(cand.contratante_id) !== Number(contratanteId)) throw new Error('Só o dono da vaga pode aceitar');
    await pool.query(`UPDATE candidaturas SET status = 'ACEITA' WHERE id = $1`, [candidaturaId]);
    const rs = await pool.query(`SELECT id FROM status_vaga WHERE chave='ACEITA'`);
    if (rs.rows[0]) await pool.query(`UPDATE vagas SET status_vaga_id = $1 WHERE id = $2`, [rs.rows[0].id, cand.vaga_id]);
    await this.notificacaoService.criarNotificacao({ usuario_id: cand.freela_id || cand.usuario_id, tipo: 'CANDIDATURA_ACEITA', titulo: `Sua candidatura foi aceita - Vaga #${cand.vaga_id}`, mensagem: `Você foi aceito para "${cand.titulo}". Aguarde o início.`, vaga_id: cand.vaga_id, candidatura_id: candidaturaId });
    return { ...cand, status: 'ACEITA' };
  }

  async cancelar(candidaturaId: number, usuarioId: number, motivo?: string): Promise<any> {
    const pool = BaseRepository.getPool() as any;
    const cfg = await this.variavelSvc.getConfigCancelamento();
    const { prazoHoras, motivoMin, notificar } = cfg;
    const rc = await pool.query(`SELECT c.*, v.contratante_id, v.titulo, v.data_inicio, sv.chave as status_vaga_chave FROM candidaturas c JOIN vagas v ON v.id = c.vaga_id JOIN status_vaga sv ON sv.id = v.status_vaga_id WHERE c.id = $1`, [candidaturaId]);
    const cand = rc.rows[0];
    if (!cand) throw new Error('Candidatura não encontrada');
    const freelaId = cand.freela_id || cand.usuario_id;
    if (Number(freelaId) !== Number(usuarioId)) throw new Error('Só o freela pode cancelar sua candidatura');
    const statusCand = (cand.status || '').toUpperCase();
    const statusVaga = (cand.status_vaga_chave || '').toUpperCase();
    if (statusCand === 'EM_ANDAMENTO' || statusVaga === 'EM_ANDAMENTO') throw new Error('Não pode cancelar com trampo EM_ANDAMENTO.');
    if (statusCand === 'CANCELADA') throw new Error('Candidatura já cancelada');
    if (statusCand === 'ACEITA' || statusVaga === 'ACEITA') {
      if (!motivo || motivo.trim().length < motivoMin) throw new Error(`Motivo obrigatório (mínimo ${motivoMin} caracteres) quando já foi aceito.`);
      const diffHoras = (new Date(cand.data_inicio).getTime() - Date.now()) / (1000 * 60 * 60);
      if (diffHoras < prazoHoras) throw new Error(`Não pode cancelar. Faltam ${diffHoras.toFixed(1)}h para o início. Cancelamento até ${prazoHoras}h antes.`);
      if (notificar) await this.notificacaoService.enviarCancelamentoCandidatura(cand.contratante_id, cand.vaga_id, candidaturaId, cand.titulo, motivo);
    }
    await pool.query(`UPDATE candidaturas SET status='CANCELADA', motivo_cancelamento=$2, data_cancelamento=NOW(), cancelado_por=$3 WHERE id=$1`, [candidaturaId, motivo || 'Cancelado pelo freela', usuarioId]);
    const rOutros = await pool.query(`SELECT COUNT(*) as total, COUNT(CASE WHEN status='ACEITA' THEN 1 END) as aceitas FROM candidaturas WHERE vaga_id=$1 AND status IN ('PENDENTE','ACEITA') AND id != $2`, [cand.vaga_id, candidaturaId]);
    const totalOutros = Number(rOutros.rows[0].total);
    const temAceita = Number(rOutros.rows[0].aceitas) > 0;
    let novoStatus = 'AGUARDANDO_CANDIDATURA';
    if (totalOutros > 0) novoStatus = temAceita ? 'ACEITA' : 'AGUARDANDO_ACEITE';
    const rs = await pool.query(`SELECT id FROM status_vaga WHERE chave=$1`, [novoStatus]);
    if (rs.rows[0]) await pool.query(`UPDATE vagas SET status_vaga_id=$1 WHERE id=$2`, [rs.rows[0].id, cand.vaga_id]);
    return { candidatura_id: candidaturaId, vaga_id: cand.vaga_id, status_anterior: statusCand, novo_status_vaga: novoStatus, prazo_configurado_horas: prazoHoras, notificacao_enviada: notificar && statusCand === 'ACEITA' };
  }

  async cancelarPorVaga(vagaId: number, usuarioId: number, motivo?: string): Promise<any> {
    const pool = BaseRepository.getPool() as any;
    const r = await pool.query(`SELECT id FROM candidaturas WHERE vaga_id=$1 AND (freela_id=$2 OR usuario_id=$2) AND status IN ('PENDENTE','ACEITA') LIMIT 1`, [vagaId, usuarioId]);
    if (!r.rows[0]) throw new Error('Candidatura não encontrada');
    return this.cancelar(r.rows[0].id, usuarioId, motivo);
  }
}
