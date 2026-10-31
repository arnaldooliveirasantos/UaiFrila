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

  // Aliases para compatibilidade com App.ts minimal
  async criar(dados: any, usuarioId?: number) {
    return await this.criarVaga({ ...dados, contratante_id: usuarioId || dados.contratante_id });
  }

  async buscarMural(usuarioId?: number, page = 1, limit = 20) {
    return await this.mural(usuarioId);
  }

  async minhasPublicadas(usuarioId: number) {
    return await this.listarVagasPorContratante(usuarioId);
  }

  async listarPorContratante(usuarioId: number) {
    return await this.listarVagasPorContratante(usuarioId);
  }

  async atualizar(id: number, dados: any, usuarioId?: number) {
    return await this.atualizarVaga(id, dados);
  }

  async cancelar(id: number, usuarioId?: number) {
    return await this.cancelarVaga(id);
  }
}
