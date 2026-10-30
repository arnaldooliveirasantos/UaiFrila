
import { BaseService } from './BaseService';
import { BaseRepository } from '../repositories/BaseRepository';

export class AdminFinanceiroService extends BaseService {
  private repository: BaseRepository;
  constructor(repository?: BaseRepository) {
    super();
    this.repository = repository || new BaseRepository();
  }
  async listarVariaveis() {
    try {
      const pool = BaseRepository.getPool() as any;
      if (!pool) return [];
      const rows = await pool.query('SELECT * FROM variaveis_sistema ORDER BY chave');
      return rows.rows;
    } catch (e:any) { this.handleError(e, 'AdminFinanceiroService.listarVariaveis'); throw e; }
  }
  async atualizarVariavel(dados: any) {
    try {
      this.validateRequired(dados, ['chave']);
      const pool = BaseRepository.getPool() as any;
      if (!pool) throw new Error('Pool não configurado');
      const rows = await pool.query('UPDATE variaveis_sistema SET valor=$2, valor_numerico=$3, atualizado_em=NOW() WHERE chave=$1 RETURNING *', [dados.chave, dados.valor, dados.valor_numerico]);
      return rows.rows[0];
    } catch (e:any) { this.handleError(e, 'AdminFinanceiroService.atualizarVariavel'); throw e; }
  }
}
