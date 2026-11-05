import { TipoUsuarioRepository } from '../repositories/TipoUsuarioRepository';
import { TipoUsuarioModel } from '../models/TipoUsuarioModel';
export class TipoUsuarioService {
  private repo: TipoUsuarioRepository;
  constructor() { this.repo = new TipoUsuarioRepository(); }
  async listar(): Promise<TipoUsuarioModel[]> { return await this.repo.buscarTodos(); }
  async buscarPorId(id: number): Promise<TipoUsuarioModel> { const t = await this.repo.buscarPorId(id); if (!t) throw new Error('Tipo usuário não encontrado'); return t; }
  async buscarPorChave(chave: string): Promise<TipoUsuarioModel | null> { return await this.repo.buscarPorChave(chave); }
  async criar(dados: any): Promise<TipoUsuarioModel> { return await this.repo.criarGenerico(dados); }
  async atualizar(id: number, dados: any): Promise<TipoUsuarioModel | null> { return await this.repo.atualizarGenerico(id, dados); }
  async deletar(id: number): Promise<boolean> { return await this.repo.deletarPorId(id); }
}
