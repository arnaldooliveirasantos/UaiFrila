
import { TransacaoRepository } from '../repositories/TransacaoRepository';
import { TransacaoModel } from '../models/TransacaoModel';
import { BaseService } from './BaseService';

export class TransacaoService extends BaseService<TransacaoModel> {
  protected repository: TransacaoRepository;

  constructor() {
    super();
    this.repository = new TransacaoRepository();
  }

  async listarPorUsuario(usuarioId: number): Promise<TransacaoModel[]> {
    try {
      if (!usuarioId) throw new Error('Usuário ID obrigatório');
      return await this.repository.listarPorUsuario(usuarioId);
    } catch (e: any) {
      this.handleError(e, 'TransacaoService.listarPorUsuario');
    }
  }

  async minhasTransacoes(usuarioId: number): Promise<TransacaoModel[]> {
    return this.listarPorUsuario(usuarioId);
  }

  async atualizarStatus(id: number, status: string): Promise<TransacaoModel | null> {
    try {
      this.validateRequired({ status }, ['status']);
      return await this.atualizar(id, { status });
    } catch (e: any) {
      this.handleError(e, 'TransacaoService.atualizarStatus');
    }
  }
  // Criar transacao (rota POST /api/transacoes). Antes, o App chamava
  // transacaoCtrl.criar e o metodo NAO existia -> 500.
  async criar(dados: any): Promise<TransacaoModel> {
    try {
      const vagaId = Number(dados.vaga_id ?? dados.vagaId);
      const freelaId = Number(dados.freela_id ?? dados.freelaId);
      const contratanteId = Number(dados.contratante_id ?? dados.contratanteId);
      if (!vagaId || !freelaId || !contratanteId) throw new Error('vaga_id, freela_id e contratante_id sao obrigatorios');
      const resto: any = { ...dados };
      for (const k of ['vaga_id', 'vagaId', 'freela_id', 'freelaId', 'contratante_id', 'contratanteId']) delete resto[k];
      return await this.criar({ vagaId, freelaId, contratanteId, status: dados.status || 'PENDENTE', ...resto });
    } catch (e: any) { this.handleError(e, 'TransacaoService.criar'); }
  }
}
