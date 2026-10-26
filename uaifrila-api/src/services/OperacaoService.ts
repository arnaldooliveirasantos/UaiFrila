import { BaseService } from './BaseService';
import { OperacaoRepository } from '../repositories/OperacaoRepository';

export class OperacaoService extends BaseService {
  private repo = new OperacaoRepository();

  async candidatar(vagaId: number, usuarioId: number) {
    this.validateRequired({ vagaId, usuarioId }, ['vagaId', 'usuarioId']);
    try {
      return await this.repo.candidatar(vagaId, usuarioId);
    } catch (e: any) {
      this.handleError(e, 'OperacaoService.candidatar');
    }
  }

  async aceitarCandidatura(candidaturaId: number, contratanteId: number) {
    return await this.repo.aceitarCandidatura(candidaturaId, contratanteId);
  }

  async historicoChat(vagaId: number) {
    return await this.repo.historicoChat(vagaId);
  }

  async salvarMensagem(vagaId: number, remetenteId: number, conteudo: string) {
    return await this.repo.salvarMensagem(vagaId, remetenteId, conteudo);
  }
}
