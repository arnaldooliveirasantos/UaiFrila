import { BaseService } from './BaseService';
import { ConversaRepository } from '../repositories/ConversaRepository';
import { ConversaModel } from '../models/ConversaModel';
export class ConversaService extends BaseService<ConversaModel> {
  constructor() { super(new ConversaRepository()); }
  async listarPorUsuario(usuarioId: number): Promise<ConversaModel[]> { return await (this.repo as ConversaRepository).listarPorUsuario(usuarioId); }
  async buscarOuCriarPorTrampo(trampoId: number, contratanteId: number, freelaId: number): Promise<ConversaModel> {
    const repo = this.repo as ConversaRepository; const existente = await repo.buscarPorTrampo(trampoId); if (existente) return existente;
    return await repo.criarGenerico({ trampo_id: trampoId, contratante_id: contratanteId, freela_id: freelaId });
  }
}
