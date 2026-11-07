import { BaseService } from './BaseService';
import { StatusVagaRepository } from '../repositories/StatusVagaRepository';
import { StatusVagaModel } from '../models/StatusVagaModel';

export class StatusVagaService extends BaseService<StatusVagaModel> {
  constructor() { super(new StatusVagaRepository()); }
  async listar(): Promise<StatusVagaModel[]> { try { return await (this.repo as StatusVagaRepository).listarOrdenado(); } catch { return []; } }
  async listarAtivos(): Promise<StatusVagaModel[]> { try { return await (this.repo as StatusVagaRepository).listarAtivos(); } catch { return await this.listar(); } }
  async buscarPorChave(chave: string): Promise<StatusVagaModel> { const s = await (this.repo as StatusVagaRepository).buscarPorChave(chave.toUpperCase()); if (!s) throw new Error(`Status ${chave} não encontrado`); return s; }
  async podeEditar(chave: string): Promise<boolean> { const s = await this.buscarPorChave(chave); return (s as any).permiteEditar ?? (s as any).permite_editar ?? true; }
  async podeCancelar(chave: string): Promise<boolean> { const s = await this.buscarPorChave(chave); return (s as any).permiteCancelar ?? (s as any).permite_cancelar ?? true; }
  async podeCandidatar(chave: string): Promise<boolean> { const s = await this.buscarPorChave(chave); return (s as any).permiteCandidatar ?? (s as any).permite_candidatar ?? true; }
}
