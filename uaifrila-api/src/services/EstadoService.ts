
import { EstadoRepository } from '../repositories/EstadoRepository';
import { EstadoModel } from '../models/EstadoModel';
import { BaseService } from './BaseService';

export class EstadoService extends BaseService<EstadoModel> {
  protected repository: EstadoRepository;

  constructor() {
    super();
    this.repository = new EstadoRepository();
  }

  async buscarPorSigla(sigla: string): Promise<EstadoModel | null> {
    try {
      this.validateRequired({ sigla }, ['sigla']);
      return await this.repository.buscarPorSigla(sigla);
    } catch (e: any) {
      this.handleError(e, 'EstadoService.buscarPorSigla');
    }
  }

  async listarAtivos(): Promise<EstadoModel[]> {
    try {
      return await this.repository.listarAtivos();
    } catch (e: any) {
      return await this.listar();
    }
  }
}
