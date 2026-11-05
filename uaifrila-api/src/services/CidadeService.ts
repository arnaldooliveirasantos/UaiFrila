
import { CidadeRepository } from '../repositories/CidadeRepository';
import { CidadeModel } from '../models/CidadeModel';
import { BaseService } from './BaseService';

export class CidadeService extends BaseService<CidadeModel> {
  protected repository: CidadeRepository;

  constructor() {
    super();
    this.repository = new CidadeRepository();
  }

  async listarAtivas(): Promise<CidadeModel[]> {
    try {
      return await this.repository.listarAtivas();
    } catch (e: any) {
      this.handleError(e, 'CidadeService.listarAtivas');
    }
  }

  async listarPorEstado(estadoId: number): Promise<CidadeModel[]> {
    try {
      if (!estadoId) throw new Error('Estado ID obrigatório');
      return await this.repository.listarPorEstado(estadoId);
    } catch (e: any) {
      this.handleError(e, 'CidadeService.listarPorEstado');
    }
  }

  async listarPorEstadoSigla(sigla: string): Promise<CidadeModel[]> {
    try {
      this.validateRequired({ sigla }, ['sigla']);
      return await this.repository.listarPorEstadoSigla(sigla);
    } catch (e: any) {
      this.handleError(e, 'CidadeService.listarPorEstadoSigla');
    }
  }

  async buscarPorNome(nome: string, estadoId?: number): Promise<CidadeModel | null> {
    try {
      return await this.repository.buscarPorNome(nome, estadoId);
    } catch (e: any) {
      this.handleError(e, 'CidadeService.buscarPorNome');
    }
  }
}
