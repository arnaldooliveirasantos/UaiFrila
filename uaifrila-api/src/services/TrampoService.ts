
import { TrampoRepository } from '../repositories/TrampoRepository';
import { TrampoModel } from '../models/TrampoModel';
import { BaseService } from './BaseService';

export class TrampoService extends BaseService<TrampoModel> {
  protected repository: TrampoRepository;

  constructor() {
    super();
    this.repository = new TrampoRepository();
  }

  async listarPorUsuario(usuarioId: number): Promise<TrampoModel[]> {
    try {
      if (!usuarioId) throw new Error('Usuário ID obrigatório');
      return await this.repository.listarPorUsuario(usuarioId);
    } catch (e: any) {
      this.handleError(e, 'TrampoService.listarPorUsuario');
    }
  }

  async meusTrampos(usuarioId: number): Promise<TrampoModel[]> {
    return this.listarPorUsuario(usuarioId);
  }

  async iniciar(id: number): Promise<TrampoModel | null> {
    try {
      return await this.atualizar(id, { status: 'EM_ANDAMENTO', dataInicio: new Date() });
    } catch (e: any) {
      this.handleError(e, 'TrampoService.iniciar');
    }
  }

  async finalizar(id: number): Promise<TrampoModel | null> {
    try {
      return await this.atualizar(id, { status: 'FINALIZADO', dataFim: new Date() });
    } catch (e: any) {
      this.handleError(e, 'TrampoService.finalizar');
    }
  }
  // Criar trampo direto (rota POST /api/trampos). Antes, o App chamava
  // trampoCtrl.criar e o metodo NAO existia -> 500.
  async criar(dados: any): Promise<TrampoModel> {
    try {
      const vagaId = Number(dados.vaga_id ?? dados.vagaId);
      const freelaId = Number(dados.freela_id ?? dados.freelaId);
      const contratanteId = Number(dados.contratante_id ?? dados.contratanteId);
      if (!vagaId || !freelaId || !contratanteId) throw new Error('vaga_id, freela_id e contratante_id sao obrigatorios');
      return await this.criar({ vagaId, freelaId, contratanteId, status: dados.status || 'ACEITO' });
    } catch (e: any) { this.handleError(e, 'TrampoService.criar'); }
  }
  async listarTodos(): Promise<TrampoModel[]> {
    try { return await this.listar(); }
    catch (e: any) { this.handleError(e, 'TrampoService.listarTodos'); }
  }
}
