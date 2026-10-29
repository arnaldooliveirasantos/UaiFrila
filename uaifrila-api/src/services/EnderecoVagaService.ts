import { VagaRepository } from '../repositories/VagaRepository';

export class EnderecoVagaService {
  private repo = new VagaRepository();

  async criarEndereco(dados: any) {
    return await this.repo.criarEnderecoVaga(dados);
  }

  async listarPorVaga(vagaId: number) {
    return await this.repo.buscarEnderecoPorVagaId(vagaId);
  }

  async atualizar(vagaId: number, dados: any) {
    return await this.repo.atualizarEnderecoVaga(vagaId, dados);
  }
}
