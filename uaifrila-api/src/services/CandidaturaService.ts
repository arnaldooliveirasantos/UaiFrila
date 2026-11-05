
import { CandidaturaRepository } from '../repositories/CandidaturaRepository';
import { CandidaturaModel } from '../models/CandidaturaModel';
import { BaseService } from './BaseService';

export class CandidaturaService extends BaseService<CandidaturaModel> {
  protected repository: CandidaturaRepository;

  constructor() {
    super();
    this.repository = new CandidaturaRepository();
  }

  async listarPorVaga(vagaId: number): Promise<CandidaturaModel[]> {
    try {
      if (!vagaId) throw new Error('Vaga ID obrigatório');
      return await this.repository.listarPorVaga(vagaId);
    } catch (e: any) {
      this.handleError(e, 'CandidaturaService.listarPorVaga');
    }
  }

  async listarPorUsuario(usuarioId: number): Promise<CandidaturaModel[]> {
    try {
      if (!usuarioId) throw new Error('Usuário ID obrigatório');
      return await this.repository.listarPorUsuario(usuarioId);
    } catch (e: any) {
      this.handleError(e, 'CandidaturaService.listarPorUsuario');
    }
  }

  async minhasCandidaturas(usuarioId: number): Promise<CandidaturaModel[]> {
    return this.listarPorUsuario(usuarioId);
  }

  async candidatar(dados: { vagaId: number, usuarioId: number, mensagem?: string }): Promise<CandidaturaModel> {
    try {
      this.validateRequired(dados, ['vagaId', 'usuarioId']);
      // Verifica se já se candidatou
      const existentes = await this.repository.listarPorVaga(dados.vagaId);
      const jaExiste = existentes.find((c: any) => c.usuarioId === dados.usuarioId || c.usuario_id === dados.usuarioId);
      if (jaExiste) throw new Error('Você já se candidatou para esta vaga');
      return await this.criar({
        vagaId: dados.vagaId,
        usuarioId: dados.usuarioId,
        mensagem: dados.mensagem,
        status: 'PENDENTE'
      });
    } catch (e: any) {
      this.handleError(e, 'CandidaturaService.candidatar');
    }
  }

  async atualizarStatus(id: number, status: string): Promise<CandidaturaModel | null> {
    try {
      this.validateRequired({ status }, ['status']);
      return await this.atualizar(id, { status });
    } catch (e: any) {
      this.handleError(e, 'CandidaturaService.atualizarStatus');
    }
  }
}
