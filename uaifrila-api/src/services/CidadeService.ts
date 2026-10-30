
import { BaseService } from './BaseService';
import { CidadeRepository } from '../repositories/CidadeRepository';

export class CidadeService extends BaseService {
  private cidadeRepository: CidadeRepository;
  constructor() { super(); this.cidadeRepository = new CidadeRepository(); }

  async listarAtivas() {
    try { return await this.cidadeRepository.listarAtivas(); }
    catch (e:any) { this.handleError(e, 'CidadeService.listarAtivas'); throw e; }
  }
  async listarTodas() {
    try { 
      const repo = this.cidadeRepository as any;
      if (repo.buscarTodasComHierarquia) return await repo.buscarTodasComHierarquia();
      return await this.cidadeRepository.listarTodas();
    } catch (e:any) { this.handleError(e, 'CidadeService.listarTodas'); throw e; }
  }
  async buscarTodasComHierarquia() {
    try {
      const repo = this.cidadeRepository as any;
      if (repo.buscarTodasComHierarquia) return await repo.buscarTodasComHierarquia();
      return await this.cidadeRepository.listarTodas();
    } catch (e:any) { this.handleError(e, 'CidadeService.buscarTodasComHierarquia'); throw e; }
  }
  async buscarPorId(id: number) { return await this.cidadeRepository.buscarPorId(id); }
  async criar(dados: any) { return await this.cidadeRepository.criar(dados); }
  async atualizarStatus(id: number, ativo: boolean) {
    try {
      const repo = this.cidadeRepository as any;
      if (repo.atualizarStatus) return await repo.atualizarStatus(id, ativo);
      return await (this.cidadeRepository as any).query?.(`UPDATE cidades SET ativa=$2 WHERE id=$1 RETURNING *`, [id, ativo]);
    } catch (e:any) { this.handleError(e, 'CidadeService.atualizarStatus'); throw e; }
  }
}
