import { BaseRepository } from './BaseRepository';
import { CandidaturaModel } from '../models/CandidaturaModel';
// Metodos novos: buscarComVaga, criarCandidatura, atualizarStatus, contarAtivasPorVaga.
// Antes, CandidaturaService fazia tudo isso com BaseRepository.getPool().query direto.
export class CandidaturaRepository extends BaseRepository<CandidaturaModel> {
  constructor() { super('candidaturas', CandidaturaModel); }
  async listarPorVaga(vagaId: number): Promise<CandidaturaModel[]> { const r = await this.query(`SELECT * FROM candidaturas WHERE vaga_id = $1 ORDER BY criado_em ASC`, [vagaId]); return this.mapRows(r.rows || []); }
  async listarMinhas(freelaId: number): Promise<CandidaturaModel[]> { const r = await this.query(`SELECT * FROM candidaturas WHERE freela_id = $1 OR usuario_id = $1 ORDER BY criado_em DESC`, [freelaId]); return this.mapRows(r.rows || []); }
  async buscarAtiva(vagaId: number, freelaId: number): Promise<CandidaturaModel | null> { const r = await this.query(`SELECT * FROM candidaturas WHERE vaga_id = $1 AND (freela_id = $2 OR usuario_id = $2) AND status IN ('PENDENTE','ACEITA') LIMIT 1`, [vagaId, freelaId]); return r.rows?.[0] ? this.mapRow(r.rows[0]) : null; }
  async buscarComVaga(candidaturaId: number): Promise<any | null> {
    const r = await this.query(`SELECT c.*, v.contratante_id, v.titulo, v.data_inicio, sv.chave as status_vaga_chave FROM candidaturas c JOIN vagas v ON v.id = c.vaga_id JOIN status_vaga sv ON sv.id = v.status_vaga_id WHERE c.id = $1`, [candidaturaId]);
    return (r.rows || [])[0] || null;
  }
  async criarCandidatura(vagaId: number, usuarioId: number): Promise<any> {
    const r = await this.query(`INSERT INTO candidaturas (vaga_id, freela_id, usuario_id, status) VALUES ($1,$2,$2,'PENDENTE') RETURNING *`, [vagaId, usuarioId]);
    return (r.rows || [])[0] || null;
  }
  async atualizarStatus(candidaturaId: number, status: string, extras: any = {}): Promise<void> {
    const sets: string[] = [`status = $2`]; const vals: any[] = [candidaturaId, status];
    let i = 3;
    if (extras.motivo_cancelamento !== undefined) { sets.push(`motivo_cancelamento = $${i++}`); vals.push(extras.motivo_cancelamento); }
    if (extras.data_cancelamento) { sets.push(`data_cancelamento = NOW()`); }
    if (extras.cancelado_por !== undefined) { sets.push(`cancelado_por = $${i++}`); vals.push(extras.cancelado_por); }
    await this.query(`UPDATE candidaturas SET ${sets.join(', ')} WHERE id = $1`, vals);
  }
  async contarAtivasPorVaga(vagaId: number, excetoId: number): Promise<{ total: number; aceitas: number }> {
    const r = await this.query(`SELECT COUNT(*) as total, COUNT(CASE WHEN status='ACEITA' THEN 1 END) as aceitas FROM candidaturas WHERE vaga_id=$1 AND status IN ('PENDENTE','ACEITA') AND id != $2`, [vagaId, excetoId]);
    const row = (r.rows || [])[0] || {};
    return { total: Number(row.total || 0), aceitas: Number(row.aceitas || 0) };
  }
  async cancelarPendentesPorUsuario(usuarioId: number): Promise<void> {
    await this.query(`UPDATE candidaturas SET status = 'CANCELADA' WHERE (freela_id = $1 OR usuario_id = $1) AND status IN ('PENDENTE','ACEITA')`, [usuarioId]);
  }
}
