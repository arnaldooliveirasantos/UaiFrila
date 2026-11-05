import { BaseRepository } from './BaseRepository';
import { CandidaturaModel } from '../models/CandidaturaModel';
export class CandidaturaRepository extends BaseRepository<CandidaturaModel> {
  constructor() { super('candidaturas', CandidaturaModel); }
  async listarPorVaga(vagaId: number): Promise<CandidaturaModel[]> {
    const result = await this.query(`
      SELECT c.*, u.nome_completo as usuario_nome, u.email as usuario_email, u.avaliacao_media, u.total_avaliacoes
      FROM candidaturas c LEFT JOIN usuarios u ON u.id = c.usuario_id
      WHERE c.vaga_id = $1 ORDER BY c.criado_em DESC
    `, [vagaId]);
    return this.mapRows(result.rows||result);
  }
  async listarPorUsuario(usuarioId: number): Promise<CandidaturaModel[]> {
    const result = await this.query(`SELECT * FROM candidaturas WHERE usuario_id = $1 OR freela_id = $1 ORDER BY criado_em DESC`, [usuarioId]);
    return this.mapRows(result.rows||result);
  }
  async verificarJaCandidatado(vagaId: number, usuarioId: number): Promise<boolean> {
    const result = await this.query(`SELECT id FROM candidaturas WHERE vaga_id = $1 AND (usuario_id = $2 OR freela_id = $2) LIMIT 1`, [vagaId, usuarioId]);
    const rows = result.rows || result;
    return rows.length > 0;
  }
}
