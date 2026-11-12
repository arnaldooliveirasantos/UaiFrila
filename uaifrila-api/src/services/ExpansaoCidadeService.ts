import { ExpansaoCidadeRepository } from '../repositories/ExpansaoCidadeRepository';
import { ExpansaoCidadeModel } from '../models/ExpansaoCidadeModel';
import { BaseService } from './BaseService';
export class ExpansaoCidadeService extends BaseService<ExpansaoCidadeModel> {
  constructor() { super(new ExpansaoCidadeRepository()); }
  private get repoExp(): ExpansaoCidadeRepository { return this.getRepo() as ExpansaoCidadeRepository; }
  async listarPorStatus(status: string): Promise<ExpansaoCidadeModel[]> {
    try { return await this.repoExp.listarPorStatus(status); }
    catch (e: any) { this.handleError(e, 'ExpansaoCidadeService.listarPorStatus'); }
  }
  async solicitar(dados: { cidadeNome: string, estadoSigla: string, paisSigla?: string, solicitadoPor: number }): Promise<ExpansaoCidadeModel> {
    try {
      this.validateRequired(dados, ['cidadeNome', 'estadoSigla', 'solicitadoPor']);
      return await this.criar({
        cidadeNome: dados.cidadeNome, estadoSigla: dados.estadoSigla,
        paisSigla: dados.paisSigla || 'BRA', status: 'SOLICITADA', solicitadoPor: dados.solicitadoPor,
      });
    } catch (e: any) { this.handleError(e, 'ExpansaoCidadeService.solicitar'); }
  }
  async atualizarStatus(id: number, status: string): Promise<ExpansaoCidadeModel | null> {
    try {
      this.validateRequired({ status }, ['status']);
      return await this.atualizar(id, { status });
    } catch (e: any) { this.handleError(e, 'ExpansaoCidadeService.atualizarStatus'); }
  }
  // NOVO: o App ja chamava expansaoCtrl.dashboard, mas o metodo nao existia no service.
  async dashboard(): Promise<any> {
    try { return await this.repoExp.dashboard(); }
    catch (e: any) { this.handleError(e, 'ExpansaoCidadeService.dashboard'); }
  }
}
