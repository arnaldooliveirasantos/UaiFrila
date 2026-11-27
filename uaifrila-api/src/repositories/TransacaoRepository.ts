import { BaseRepository } from './BaseRepository';
import { TransacaoModel } from '../models/TransacaoModel';
export class TransacaoRepository extends BaseRepository<TransacaoModel> {
  constructor() { super('transacoes', TransacaoModel); }

  async buscarPorCodigo(codigo: string): Promise<TransacaoModel | null> {
    const result = await this.query(`SELECT * FROM transacoes WHERE codigo = $1 LIMIT 1`, [codigo]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async listarPorUsuario(usuarioId: number): Promise<TransacaoModel[]> {
    const result = await this.query(`SELECT * FROM transacoes WHERE freela_id = $1 OR contratante_id = $1 ORDER BY criado_em DESC`, [usuarioId]);
    return this.mapRows(result.rows || result);
  }

  async listarPorStatus(status: string): Promise<TransacaoModel[]> {
    const result = await this.query(`SELECT * FROM transacoes WHERE status = $1 ORDER BY criado_em DESC`, [status]);
    return this.mapRows(result.rows || result);
  }

  async buscarPorTrampo(trampoId: number): Promise<TransacaoModel | null> { const r = await this.query(`SELECT * FROM transacoes WHERE trampo_id = $1 LIMIT 1`, [trampoId]); const rows = r.rows || []; return rows[0] ? this.mapRow(rows[0]) : null; }
  async relatorioPorCidade(cidadeId: number): Promise<any> {
    const result = await this.query(`
      SELECT COUNT(*) as total, SUM(valor_base) as total_base, SUM(taxa_valor) as total_taxa
      FROM transacoes WHERE cidade_id = $1
    `, [cidadeId]);
    return (result.rows||result)[0];
  }
}
