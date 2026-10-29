import { CidadeRepository } from '../repositories/CidadeRepository';
import { BaseService } from './BaseService';

export class CidadeService extends BaseService {
  private cidadeRepository: CidadeRepository;

  constructor() {
    const repo = new CidadeRepository();
    super(repo);
    this.cidadeRepository = repo;
  }

  async listarAtivas() {
    try {
      return await this.cidadeRepository.listarAtivas();
    } catch (e) {
      this.handleError(e, 'CidadeService.listarAtivas');
    }
  }

  async buscarTodasComHierarquia() {
    try {
      return await this.cidadeRepository.buscarTodasComHierarquia();
    } catch (e) {
      this.handleError(e, 'CidadeService.buscarTodasComHierarquia');
    }
  }

  async atualizarStatus(id: number, ativo: boolean) {
    this.validateRequired({ id }, ['id']);
    try {
      return await this.cidadeRepository.atualizarStatus(id, ativo);
    } catch (e) {
      this.handleError(e, 'CidadeService.atualizarStatus');
    }
  }
}
