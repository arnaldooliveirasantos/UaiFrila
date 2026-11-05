import { FuncaoRepository } from '../repositories/FuncaoRepository';
import { FuncaoModel } from '../models/FuncaoModel';
export class FuncaoService {
  private repo: FuncaoRepository;
  constructor() { this.repo = new FuncaoRepository(); }
  async listar(): Promise<FuncaoModel[]> { return await this.repo.buscarTodos(); }
  async listarAtivas(): Promise<FuncaoModel[]> { return await this.repo.listarAtivas(); }
  async buscarPorId(id: number): Promise<FuncaoModel> { const f = await this.repo.buscarPorId(id); if (!f) throw new Error('Função não encontrada'); return f; }
  async buscarPorNome(nome: string): Promise<FuncaoModel | null> { return await this.repo.buscarPorNome(nome); }
  async criar(dados: any): Promise<FuncaoModel> { return await this.repo.criarGenerico(dados); }
  async atualizar(id: number, dados: any): Promise<FuncaoModel | null> { return await this.repo.atualizarGenerico(id, dados); }
  async deletar(id: number): Promise<boolean> { return await this.repo.deletarPorId(id); }
}
