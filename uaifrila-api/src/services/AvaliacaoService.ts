
import { AvaliacaoRepository } from '../repositories/AvaliacaoRepository';
import { AvaliacaoModel } from '../models/AvaliacaoModel';
import { BaseService } from './BaseService';

export class AvaliacaoService extends BaseService<AvaliacaoModel> {
  protected repository: AvaliacaoRepository;

  constructor() {
    super();
    this.repository = new AvaliacaoRepository();
  }

  async listarPorAvaliado(avaliadoId: number): Promise<AvaliacaoModel[]> {
    try {
      if (!avaliadoId) throw new Error('Avaliado ID obrigatório');
      return await this.repository.listarPorAvaliado(avaliadoId);
    } catch (e: any) {
      this.handleError(e, 'AvaliacaoService.listarPorAvaliado');
    }
  }

  async listarPorAvaliador(avaliadorId: number): Promise<AvaliacaoModel[]> {
    try {
      return await this.repository.listarPorAvaliador(avaliadorId);
    } catch (e: any) {
      this.handleError(e, 'AvaliacaoService.listarPorAvaliador');
    }
  }

  async minhasAvaliacoes(usuarioId: number): Promise<AvaliacaoModel[]> {
    return this.listarPorAvaliador(usuarioId);
  }

  async criarAvaliacao(dados: { avaliadorId: number, avaliadoId: number, nota: number, comentario?: string, trampoId?: number }): Promise<AvaliacaoModel> {
    try {
      this.validateRequired(dados, ['avaliadorId', 'avaliadoId', 'nota']);
      if (dados.nota < 1 || dados.nota > 5) throw new Error('Nota deve ser entre 1 e 5');
      if (dados.avaliadorId === dados.avaliadoId) throw new Error('Não pode avaliar a si mesmo');
      return await this.criar(dados);
    } catch (e: any) {
      this.handleError(e, 'AvaliacaoService.criarAvaliacao');
    }
  }
}
