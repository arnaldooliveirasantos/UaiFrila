import { BaseRepository } from './BaseRepository';
import { CidadeModel } from '../models/CidadeModel';
// Sem fallback: cidades tem `estado_id` (FK) e `ativa`. Sigla vem por JOIN em estados.
export class CidadeRepository extends BaseRepository<CidadeModel> {
  constructor() { super('cidades', CidadeModel); }
  private selectComSigla = `SELECT c.*, e.sigla AS estado_sigla FROM cidades c LEFT JOIN estados e ON e.id = c.estado_id`;
  async listarAtivas(): Promise<CidadeModel[]> { const r = await this.query(`${this.selectComSigla} WHERE c.ativa = true ORDER BY c.nome`); return this.mapRows(r.rows || []); }
  async listarPorEstado(estadoId: number): Promise<CidadeModel[]> { const r = await this.query(`${this.selectComSigla} WHERE c.estado_id = $1 AND c.ativa = true ORDER BY c.nome`, [estadoId]); return this.mapRows(r.rows || []); }
  async listarPorEstadoSigla(sigla: string): Promise<CidadeModel[]> { const r = await this.query(`${this.selectComSigla} WHERE UPPER(e.sigla) = UPPER($1) AND c.ativa = true ORDER BY c.nome`, [sigla]); return this.mapRows(r.rows || []); }
  async buscarPorNomeEstado(nome: string, sigla: string): Promise<CidadeModel | null> { const r = await this.query(`${this.selectComSigla} WHERE LOWER(c.nome) = LOWER($1) AND UPPER(e.sigla) = UPPER($2) LIMIT 1`, [nome, sigla]); const rows = r.rows || []; return rows[0] ? this.mapRow(rows[0]) : null; }
  async buscarPorNome(nome: string, estadoId?: number): Promise<CidadeModel | null> {
    const r = estadoId ? await this.query(`${this.selectComSigla} WHERE LOWER(c.nome) = LOWER($1) AND c.estado_id = $2 LIMIT 1`, [nome, estadoId]) : await this.query(`${this.selectComSigla} WHERE LOWER(c.nome) = LOWER($1) LIMIT 1`, [nome]);
    const rows = r.rows || []; return rows[0] ? this.mapRow(rows[0]) : null;
  }
  async buscarPorNomeComEstado(nome: string, estadoId?: number): Promise<CidadeModel | null> { return this.buscarPorNome(nome, estadoId); }
}
