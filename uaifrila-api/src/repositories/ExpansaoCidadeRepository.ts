import { BaseRepository } from './BaseRepository';
import { ExpansaoCidadeModel } from '../models/ExpansaoCidadeModel';
export class ExpansaoCidadeRepository extends BaseRepository<ExpansaoCidadeModel> {
  constructor() { super('expansao_cidades', ExpansaoCidadeModel); }
  async listarPorStatus(status: string): Promise<ExpansaoCidadeModel[]> {
    const result = await this.query(`SELECT * FROM expansao_cidades WHERE status = $1 ORDER BY prioridade DESC, criado_em DESC`, [status]);
    return this.mapRows(result.rows || result);
  }
  async buscarPorCidadeEstado(cidadeNome: string, estadoSigla: string): Promise<ExpansaoCidadeModel | null> {
    const result = await this.query(`SELECT * FROM expansao_cidades WHERE LOWER(cidade_nome) = LOWER($1) AND estado_sigla = $2 LIMIT 1`, [cidadeNome, estadoSigla]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }
  async dashboard(): Promise<any> {
    const total = await this.query(`SELECT COUNT(*) as total FROM expansao_cidades`);
    const porStatus = await this.query(`SELECT status, COUNT(*) as qtd FROM expansao_cidades GROUP BY status`);
    return { total: (total.rows||total)[0]?.total || 0, porStatus: porStatus.rows||porStatus };
  }
}
