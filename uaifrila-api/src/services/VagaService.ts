import { VagaRepository } from '../repositories/VagaRepository';

export class VagaService {
  private repo = new VagaRepository();

  async criarVaga(dados: any) {
    return await this.repo.criarVaga(dados);
  }

  async listarVagasPorContratante(contratanteId: number) {
    return await this.repo.listarVagasPorContratante(contratanteId);
  }

  async buscarPorId(id: number) {
    return await this.repo.buscarPorId(id);
  }

  async mural(usuarioId: number) {
    return await this.repo.buscarMuralSemBloqueiosDeAvaliacao(usuarioId);
  }

  async atualizarVaga(id: number, dados: any) {
    return await this.repo.atualizarVaga(id, dados);
  }

  async cancelarVaga(id: number) {
    return await this.repo.cancelarVaga(id);
  }

  async deletarVaga(id: number) {
    return await this.repo.deletarVaga(id);
  }
}
