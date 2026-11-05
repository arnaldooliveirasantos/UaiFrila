
import { ExpansaoCidadeRepository } from '../repositories/ExpansaoCidadeRepository';
import { ExpansaoCidadeModel } from '../models/ExpansaoCidadeModel';
import { BaseService } from './BaseService';

export class ExpansaoCidadeService extends BaseService<ExpansaoCidadeModel> {
  protected repository: ExpansaoCidadeRepository;

  constructor() {
    super();
    this.repository = new ExpansaoCidadeRepository();
  }

  async listarPorStatus(status: string): Promise<ExpansaoCidadeModel[]> {
    try {
      return await this.repository.listarPorStatus(status);
    } catch (e: any) {
      this.handleError(e, 'ExpansaoCidadeService.listarPorStatus');
    }
  }

  async solicitar(dados: { cidadeNome: string, estadoSigla: string, paisSigla?: string, solicitadoPor: number }): Promise<ExpansaoCidadeModel> {
    try {
      this.validateRequired(dados, ['cidadeNome', 'estadoSigla', 'solicitadoPor']);
      return await this.criar({
        cidadeNome: dados.cidadeNome,
        estadoSigla: dados.estadoSigla,
        paisSigla: dados.paisSigla || 'BRA',
        status: 'SOLICITADA',
        solicitadoPor: dados.solicitadoPor
      });
    } catch (e: any) {
      this.handleError(e, 'ExpansaoCidadeService.solicitar');
    }
  }

  async atualizarStatus(id: number, status: string): Promise<ExpansaoCidadeModel | null> {
    try {
      this.validateRequired({ status }, ['status']);
      return await this.atualizar(id, { status });
    } catch (e: any) {
      this.handleError(e, 'ExpansaoCidadeService.atualizarStatus');
    }
  }
}
