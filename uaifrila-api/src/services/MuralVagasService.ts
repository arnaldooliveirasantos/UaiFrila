import { VagaRepository } from '../repositories/VagaRepository';

export class MuralVagasService {
  private vagaRepo = new VagaRepository();

  async listarVagasParaMural(usuarioId: number, tipo: string) {
    try {
      const vagas = await this.vagaRepo.buscarMuralSemBloqueiosDeAvaliacao(usuarioId);
      return vagas;
    } catch (e) {
      console.error('Erro mural:', e);
      return [];
    }
  }
}