import { BaseService } from './BaseService';
import { AdminFinanceiroRepository } from '../repositories/AdminFinanceiroRepository';

export class AdminFinanceiroService extends BaseService {
  private repo = new AdminFinanceiroRepository();

  async listarVariaveis() {
    try {
      return await this.repo.listarVariaveis();
    } catch (e: any) {
      this.handleError(e, 'AdminFinanceiroService.listarVariaveis');
    }
  }

  async salvarVariavel(dados: any) {
    this.validateRequired(dados, ['chave']);
    return await this.repo.salvarVariavel(dados);
  }

  async relatorioTransacoes(filtros: any) {
    return await this.repo.relatorioTransacoes(filtros);
  }
}
