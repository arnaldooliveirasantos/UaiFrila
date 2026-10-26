import { AdminFinanceiroRepository } from '../repositories/AdminFinanceiroRepository';

export class AdminFinanceiroService {
  private repo = new AdminFinanceiroRepository();
  async obterParametrosGlobais() { return await this.repo.listarVariaveisSistema(); }
  async salvarParametroGlobal(chave: string, valor: string) { 
    const num = parseFloat(valor);
    return await this.repo.atualizarVariavelSistema(chave, valor, isNaN(num) ? undefined : num); 
  }
  async obterRelatorioAuditoria(inicio: string, fim: string) { return []; }
  async listarVariaveis() { return await this.repo.listarVariaveisSistema(); }
  async atualizarVariavel(chave: string, valor: string) { return await this.repo.atualizarVariavelSistema(chave, valor); }
}
