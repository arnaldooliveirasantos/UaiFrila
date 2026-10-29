import { BaseService } from './BaseService';
import { BaseRepository } from '../repositories/BaseRepository';

class VariaveisRepo extends BaseRepository {
  async listar() {
    try {
      return await this.query(`SELECT * FROM variaveis_sistema ORDER BY id ASC`);
    } catch {
      return [
        { id: 1, chave: 'VALOR_MINIMO_VAGA', valor: '75', valor_numerico: 75 },
        { id: 2, chave: 'TAXA_PIX_PERCENTUAL', valor: '1', valor_numerico: 1 },
        { id: 3, chave: 'TAXA_CARTAO_PERCENTUAL', valor: '4', valor_numerico: 4 },
        { id: 4, chave: 'COMISSAO_APLICATIVO', valor: '10', valor_numerico: 10 },
      ];
    }
  }
}

export class AdminFinanceiroService extends BaseService {
  private variaveisRepo: VariaveisRepo;

  constructor(repository?: BaseRepository) {
    super(repository);
    this.variaveisRepo = new VariaveisRepo();
  }

  async listarVariaveis() {
    try {
      return await this.variaveisRepo.listar();
    } catch (e) {
      this.handleError(e, 'AdminFinanceiroService.listarVariaveis');
    }
  }

  async atualizarVariavel(dados: any) {
    this.validateRequired(dados, ['chave']);
    try {
      const repo = this.variaveisRepo as any;
      const rows = await repo.query(`UPDATE variaveis_sistema SET valor = $2, valor_numerico = $3, atualizado_em = NOW() WHERE chave = $1 RETURNING *`, [dados.chave, dados.valor, dados.valor_numerico || parseFloat(dados.valor)]);
      return rows[0];
    } catch (e) {
      this.handleError(e, 'AdminFinanceiroService.atualizarVariavel');
    }
  }
}
