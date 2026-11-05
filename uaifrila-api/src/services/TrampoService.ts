
import { TrampoRepository } from '../repositories/TrampoRepository';
import { TrampoModel } from '../models/TrampoModel';
import { BaseService } from './BaseService';

export class TrampoService extends BaseService<TrampoModel> {
  protected repository: TrampoRepository;

  constructor() {
    super();
    this.repository = new TrampoRepository();
  }

  async listarPorUsuario(usuarioId: number): Promise<TrampoModel[]> {
    try {
      if (!usuarioId) throw new Error('Usuário ID obrigatório');
      return await this.repository.listarPorUsuario(usuarioId);
    } catch (e: any) {
      this.handleError(e, 'TrampoService.listarPorUsuario');
    }
  }

  async meusTrampos(usuarioId: number): Promise<TrampoModel[]> {
    return this.listarPorUsuario(usuarioId);
  }

  async iniciar(id: number): Promise<TrampoModel | null> {
    try {
      return await this.atualizar(id, { status: 'EM_ANDAMENTO', dataInicio: new Date() });
    } catch (e: any) {
      this.handleError(e, 'TrampoService.iniciar');
    }
  }

  async finalizar(id: number): Promise<TrampoModel | null> {
    try {
      return await this.atualizar(id, { status: 'FINALIZADO', dataFim: new Date() });
    } catch (e: any) {
      this.handleError(e, 'TrampoService.finalizar');
    }
  }
}
