
import { TransacaoRepository } from '../repositories/TransacaoRepository';
import { TransacaoModel } from '../models/TransacaoModel';
import { BaseService } from './BaseService';

export class TransacaoService extends BaseService<TransacaoModel> {
  protected repository: TransacaoRepository;

  constructor() {
    super();
    this.repository = new TransacaoRepository();
  }

  async listarPorUsuario(usuarioId: number): Promise<TransacaoModel[]> {
    try {
      if (!usuarioId) throw new Error('Usuário ID obrigatório');
      return await this.repository.listarPorUsuario(usuarioId);
    } catch (e: any) {
      this.handleError(e, 'TransacaoService.listarPorUsuario');
    }
  }

  async minhasTransacoes(usuarioId: number): Promise<TransacaoModel[]> {
    return this.listarPorUsuario(usuarioId);
  }

  async atualizarStatus(id: number, status: string): Promise<TransacaoModel | null> {
    try {
      this.validateRequired({ status }, ['status']);
      return await this.atualizar(id, { status });
    } catch (e: any) {
      this.handleError(e, 'TransacaoService.atualizarStatus');
    }
  }
}
