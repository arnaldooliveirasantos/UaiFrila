import { AdminFinanceiroRepository } from '../repositories/AdminFinanceiroRepository';

export class AdminFinanceiroService {
    private repo = new AdminFinanceiroRepository();

    public async obterParametrosGlobais(): Promise<any[]> {
        return await this.repo.listarVariaveisAmbiente();
    }

    public async salvarParametroGlobal(chave: string, valor: string): Promise<any[]> {
        return await this.repo.atualizarVariavelAmbiente(chave, valor);
    }

    public async obterRelatorioAuditoria(inicio: string, fim: string): Promise<any[]> {
        return await this.repo.buscarTransacoesPorPeriodo(inicio, fim);
    }
}
