import { BaseService } from './BaseService';
import { VagaRepository } from '../repositories/VagaRepository';

export class VagaService extends BaseService {
  private vagaRepo = new VagaRepository();

  async criar(dados: any) {
    this.validateRequired(dados, ['contratante_id', 'titulo']);
    try {
      const result = await this.vagaRepo.criarVaga(dados);
      return result[0];
    } catch (e: any) {
      this.handleError(e, 'VagaService.criar');
    }
  }

  async listar(filtros?: any) {
    return await this.vagaRepo.listarVagas(filtros);
  }

  async buscarPorId(id: number) {
    return await this.vagaRepo.buscarPorId(id);
  }
}
