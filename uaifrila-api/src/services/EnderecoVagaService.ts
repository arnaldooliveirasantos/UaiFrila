import { EnderecoVagaRepository } from '../repositories/EnderecoVagaRepository';
import { EnderecoVagaModel } from '../models/EnderecoVagaModel';
export class EnderecoVagaService {
  private repo: EnderecoVagaRepository;
  constructor() { this.repo = new EnderecoVagaRepository(); }
  async listar(): Promise<EnderecoVagaModel[]> { return await this.repo.buscarTodos(); }
  async listarPorVaga(vagaId: number): Promise<EnderecoVagaModel[]> { return await this.repo.listarPorVaga(vagaId); }
  async listarPorEndereco(enderecoId: number): Promise<EnderecoVagaModel[]> { return await this.repo.listarPorEndereco(enderecoId); }
  async vincular(vagaId: number, enderecoId: number): Promise<EnderecoVagaModel> { return await this.repo.vincular(vagaId, enderecoId); }
  async desvincular(vagaId: number, enderecoId: number): Promise<boolean> { return await this.repo.desvincular(vagaId, enderecoId); }
  async criar(dados: any): Promise<EnderecoVagaModel> { return await this.repo.criarGenerico(dados); }
  async deletar(id: number): Promise<boolean> { return await this.repo.deletarPorId(id); }
}
