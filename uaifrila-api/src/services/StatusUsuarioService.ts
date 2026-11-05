import { StatusUsuarioRepository } from '../repositories/StatusUsuarioRepository';
import { StatusUsuarioModel } from '../models/StatusUsuarioModel';
export class StatusUsuarioService {
  private repo: StatusUsuarioRepository;
  constructor() { this.repo = new StatusUsuarioRepository(); }
  async listar(): Promise<StatusUsuarioModel[]> { return await this.repo.buscarTodos(); }
  async buscarPorId(id: number): Promise<StatusUsuarioModel> { const s = await this.repo.buscarPorId(id); if (!s) throw new Error('Status não encontrado'); return s; }
  async buscarPorChave(chave: string): Promise<StatusUsuarioModel | null> { return await this.repo.buscarPorChave(chave); }
  async criar(dados: any): Promise<StatusUsuarioModel> { return await this.repo.criarGenerico(dados); }
  async atualizar(id: number, dados: any): Promise<StatusUsuarioModel | null> { return await this.repo.atualizarGenerico(id, dados); }
  async deletar(id: number): Promise<boolean> { return await this.repo.deletarPorId(id); }
}
