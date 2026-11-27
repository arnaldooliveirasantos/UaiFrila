import { BaseService } from './BaseService';
import { EnderecoVagaRepository } from '../repositories/EnderecoVagaRepository';
import { EnderecoVagaModel } from '../models/EnderecoVagaModel';

export class EnderecoVagaService extends BaseService<EnderecoVagaModel> {
  constructor() { super(new EnderecoVagaRepository()); }

  async listarPorVaga(vagaId: number): Promise<EnderecoVagaModel[]> {
    return await (this.getRepo() as EnderecoVagaRepository).listarPorVaga(vagaId);
  }

  async listarPorEndereco(enderecoId: number): Promise<EnderecoVagaModel[]> {
    return await (this.getRepo() as EnderecoVagaRepository).listarPorEndereco(enderecoId);
  }

  async vincular(vagaId: number, enderecoId: number): Promise<EnderecoVagaModel> {
    return await (this.getRepo() as EnderecoVagaRepository).vincular(vagaId, enderecoId);
  }

  async desvincular(vagaId: number, enderecoId: number): Promise<boolean> {
    return await (this.getRepo() as EnderecoVagaRepository).desvincular(vagaId, enderecoId);
  }

  async buscarAtivoPorVaga(vagaId: number): Promise<any> {
    return await (this.getRepo() as EnderecoVagaRepository).buscarAtivoPorVaga(vagaId);
  }
}
