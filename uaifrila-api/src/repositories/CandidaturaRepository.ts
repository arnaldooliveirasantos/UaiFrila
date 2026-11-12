import { BaseRepository } from './BaseRepository';
import { CandidaturaModel } from '../models/CandidaturaModel';
export class CandidaturaRepository extends BaseRepository<CandidaturaModel> {
  constructor() { super('candidaturas', CandidaturaModel); }
  async listarPorVaga(vagaId: number): Promise<CandidaturaModel[]> { const r = await this.query(`SELECT * FROM candidaturas WHERE vaga_id = $1 ORDER BY criado_em ASC`, [vagaId]); return this.mapRows(r.rows || []); }
  async listarMinhas(freelaId: number): Promise<CandidaturaModel[]> { const r = await this.query(`SELECT * FROM candidaturas WHERE freela_id = $1 OR usuario_id = $1 ORDER BY criado_em DESC`, [freelaId]); return this.mapRows(r.rows || []); }
  async buscarAtiva(vagaId: number, freelaId: number): Promise<CandidaturaModel | null> { const r = await this.query(`SELECT * FROM candidaturas WHERE vaga_id = $1 AND (freela_id = $2 OR usuario_id = $2) AND status IN ('PENDENTE','ACEITA') LIMIT 1`, [vagaId, freelaId]); return r.rows?.[0] ? this.mapRow(r.rows[0]) : null; }
  // Usado pelo cancelamento de cadastro: cancela PENDENTE/ACEITA do usuario (tolerante a coluna freela_id/usuario_id).
  async cancelarPendentesPorUsuario(usuarioId: number): Promise<void> {
    await this.query(`UPDATE candidaturas SET status = 'CANCELADA' WHERE (freela_id = $1 OR usuario_id = $1) AND status IN ('PENDENTE','ACEITA')`, [usuarioId]);
  }
}
