import { BaseRepository } from './BaseRepository';
import { AvaliacaoModel } from '../models/AvaliacaoModel';
export class AvaliacaoRepository extends BaseRepository<AvaliacaoModel> {
  constructor() { super('avaliacoes', AvaliacaoModel); }
  async listarPorAvaliado(avaliadoId: number): Promise<AvaliacaoModel[]> {
    const result = await this.query(`SELECT * FROM avaliacoes WHERE avaliado_id = $1 ORDER BY criado_em DESC`, [avaliadoId]);
    return this.mapRows(result.rows || result);
  }
  async listarPorAvaliador(avaliadorId: number): Promise<AvaliacaoModel[]> {
    const result = await this.query(`SELECT * FROM avaliacoes WHERE avaliador_id = $1 ORDER BY criado_em DESC`, [avaliadorId]);
    return this.mapRows(result.rows || result);
  }
  async mediaPorAvaliado(avaliadoId: number): Promise<number> {
    const result = await this.query(`SELECT AVG(nota) as media FROM avaliacoes WHERE avaliado_id = $1`, [avaliadoId]);
    return Number((result.rows||result)[0]?.media || 5);
  }
  async verificarJaAvaliou(trampoId: number, avaliadorId: number): Promise<boolean> {
    const result = await this.query(`SELECT id FROM avaliacoes WHERE trampo_id = $1 AND avaliador_id = $2 LIMIT 1`, [trampoId, avaliadorId]);
    const rows = result.rows || result;
    return rows.length > 0;
  }
}
