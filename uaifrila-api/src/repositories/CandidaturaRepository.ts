import { BaseRepository } from './BaseRepository';
import { CandidaturaModel } from '../models/CandidaturaModel';
export class CandidaturaRepository extends BaseRepository<CandidaturaModel> {
  constructor() { super('candidaturas', CandidaturaModel); }
  async listarPorVaga(vagaId: number): Promise<CandidaturaModel[]> { const r = await this.query(`SELECT * FROM candidaturas WHERE vaga_id = $1 ORDER BY criado_em ASC`, [vagaId]); return this.mapRows(r.rows || r); }
  async listarMinhas(freelaId: number): Promise<CandidaturaModel[]> { const r = await this.query(`SELECT * FROM candidaturas WHERE freela_id = $1 OR usuario_id = $1 ORDER BY criado_em DESC`, [freelaId]); return this.mapRows(r.rows || r); }
  async buscarAtiva(vagaId: number, freelaId: number): Promise<CandidaturaModel | null> { const r = await this.query(`SELECT * FROM candidaturas WHERE vaga_id = $1 AND (freela_id = $2 OR usuario_id = $2) AND status IN ('PENDENTE','ACEITA') LIMIT 1`, [vagaId, freelaId]); const rows = r.rows || r; return rows[0] ? this.mapRow(rows[0]) : null; }
}
