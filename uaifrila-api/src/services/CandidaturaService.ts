
import { CandidaturaRepository } from '../repositories/CandidaturaRepository';

export class CandidaturaService {
  private repository: CandidaturaRepository;

  constructor() {
    this.repository = new CandidaturaRepository();
  }

  async candidatar(vagaId: number, usuarioId: number, mensagem?: string) {
    if (!vagaId || !usuarioId) throw new Error('vagaId e usuarioId obrigatórios');
    return await this.repository.candidatar(vagaId, usuarioId, mensagem);
  }

  async listarPorVaga(vagaId: number) {
    return await this.repository.listarPorVaga(vagaId);
  }

  async listarPorUsuario(usuarioId: number) {
    return await this.repository.listarPorUsuario(usuarioId);
  }

  async aceitar(vagaId: number, candidaturaId: number, contratanteId: number) {
    return await this.repository.aceitar(vagaId, candidaturaId, contratanteId);
  }
}
