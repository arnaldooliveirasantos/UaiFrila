import { TipoEnderecoRepository } from '../repositories/TipoEnderecoRepository';
import { TipoEnderecoModel } from '../models/TipoEnderecoModel';
export class TipoEnderecoService {
  private repo: TipoEnderecoRepository;
  constructor() { this.repo = new TipoEnderecoRepository(); }
  async listar(): Promise<TipoEnderecoModel[]> { return await this.repo.buscarTodos(); }
  async listarAtivos(): Promise<TipoEnderecoModel[]> { return await this.repo.listarAtivos(); }
  async buscarPorId(id: number): Promise<TipoEnderecoModel> { const t = await this.repo.buscarPorId(id); if (!t) throw new Error('Tipo endereço não encontrado'); return t; }
  async buscarPorChave(chave: string): Promise<TipoEnderecoModel | null> { return await this.repo.buscarPorChave(chave); }
  async criar(dados: any): Promise<TipoEnderecoModel> { return await this.repo.criarGenerico(dados); }
  async atualizar(id: number, dados: any): Promise<TipoEnderecoModel | null> { return await this.repo.atualizarGenerico(id, dados); }
  async deletar(id: number): Promise<boolean> { return await this.repo.deletarPorId(id); }
}
