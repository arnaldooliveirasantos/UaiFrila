import { BaseRepository } from './BaseRepository';
import { CidadeModel } from '../models/CidadeModel';

export class CidadeRepository extends BaseRepository<CidadeModel> {
  constructor() { super('cidades', CidadeModel); }

  async listarAtivas(): Promise<CidadeModel[]> {
    try {
      const result = await this.query(`SELECT * FROM cidades WHERE ativa = true ORDER BY nome`);
      return this.mapRows(result.rows || result);
    } catch {
      // Fallback se coluna ativa não existir
      const result = await this.query(`SELECT * FROM cidades ORDER BY nome`);
      return this.mapRows(result.rows || result);
    }
  }

  async listarPorEstado(estadoId: number): Promise<CidadeModel[]> {
    const result = await this.query(`SELECT * FROM cidades WHERE estado_id = $1 ORDER BY nome`, [estadoId]);
    return this.mapRows(result.rows || result);
  }

  async listarPorEstadoSigla(sigla: string): Promise<CidadeModel[]> {
    const result = await this.query(`SELECT * FROM cidades WHERE estado = $1 ORDER BY nome`, [sigla]);
    return this.mapRows(result.rows || result);
  }

  async buscarPorNomeEstado(nome: string, estado: string): Promise<CidadeModel | null> {
    const result = await this.query(`SELECT * FROM cidades WHERE LOWER(nome) = LOWER($1) AND estado = $2 LIMIT 1`, [nome, estado]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  // Alias para compatibilidade
  async buscarPorNome(nome: string, estadoId?: number): Promise<CidadeModel | null> {
    try {
      if (estadoId) {
        const result = await this.query(`SELECT * FROM cidades WHERE LOWER(nome) = LOWER($1) AND estado_id = $2 LIMIT 1`, [nome, estadoId]);
        const rows = result.rows || result;
        return rows[0] ? this.mapRow(rows[0]) : null;
      } else {
        const result = await this.query(`SELECT * FROM cidades WHERE LOWER(nome) = LOWER($1) LIMIT 1`, [nome]);
        const rows = result.rows || result;
        return rows[0] ? this.mapRow(rows[0]) : null;
      }
    } catch {
      return null;
    }
  }

  async buscarPorNomeComEstado(nome: string, estadoId?: number): Promise<CidadeModel | null> {
    return this.buscarPorNome(nome, estadoId);
  }
}
