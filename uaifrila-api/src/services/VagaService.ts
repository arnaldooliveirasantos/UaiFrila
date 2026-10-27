import { BaseService } from './BaseService';
import { VagaRepository } from '../repositories/VagaRepository';

export class VagaService extends BaseService {
  private vagaRepo = new VagaRepository();

  async criar(dados: any) {
    this.validateRequired(dados, ['contratante_id', 'titulo']);
    try {
      const result = await this.vagaRepo.criarVaga(dados);
      // criarVaga retorna array ou objeto dependendo do repo
      if (Array.isArray(result)) return result[0];
      return result;
    } catch (e: any) {
      this.handleError(e, 'VagaService.criar');
    }
  }

  async listar(filtros?: any) {
    return await this.vagaRepo.listarVagas(filtros);
  }

  async listarPorContratante(contratanteId: number) {
    return await this.vagaRepo.listarVagasPorContratante(contratanteId);
  }

  async buscarPorId(id: number) {
    return await this.vagaRepo.buscarPorId(id);
  }

  async atualizar(id: number, dados: any) {
    return await this.vagaRepo.atualizarVaga(id, dados);
  }

  async cancelar(id: number) {
    return await this.vagaRepo.cancelarVaga(id);
  }

  async deletar(id: number) {
    return await this.vagaRepo.deletarVaga(id);
  }
}
