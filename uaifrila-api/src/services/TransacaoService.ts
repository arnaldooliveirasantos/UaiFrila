import { TransacaoRepository } from '../repositories/TransacaoRepository';
import { TransacaoModel } from '../models/TransacaoModel';
import { BaseService } from './BaseService';
export class TransacaoService extends BaseService<TransacaoModel> {
  protected repository: TransacaoRepository;
  constructor() { super(); this.repository = new TransacaoRepository(); }
  async listarPorUsuario(usuarioId: number): Promise<TransacaoModel[]> { if (!usuarioId) throw new Error('Usuario ID obrigatorio'); return await this.repository.listarPorUsuario(usuarioId); }
  async minhasTransacoes(usuarioId: number): Promise<TransacaoModel[]> { return this.listarPorUsuario(usuarioId); }
  async atualizarStatus(id: number, status: string): Promise<TransacaoModel | null> { this.validateRequired({ status }, ['status']); return await this.atualizar(id, { status }); }
  async criar(dados: any): Promise<TransacaoModel> {
    const vagaId = Number(dados.vaga_id ?? dados.vagaId); const freelaId = Number(dados.freela_id ?? dados.freelaId); const contratanteId = Number(dados.contratante_id ?? dados.contratanteId);
    if (!vagaId || !freelaId || !contratanteId) throw new Error('vaga_id, freela_id e contratante_id sao obrigatorios');
    return await this.repository.criarGenerico({ ...dados, vaga_id: vagaId, freela_id: freelaId, contratante_id: contratanteId, status: dados.status || 'AGUARDANDO_PAGAMENTO' });
  }
  // Escrow: usado pelo worker (item 11 B). Fonte unica: transacoes, nao `pagamentos`.
  async liberarEscrowVencido(horas: number): Promise<TransacaoModel[]> {
    const lista = await this.repository.listarPorStatus('EM_ESCROW');
    const vencidas = lista.filter((t: any) => t.criadoEm && Date.now() - new Date(t.criadoEm).getTime() >= horas * 3600_000);
    const out: TransacaoModel[] = [];
    for (const t of vencidas) { const u = await this.repository.atualizarGenerico(t.id, { status: 'LIBERADO', data_liberacao: new Date() }); if (u) out.push(u); }
    return out;
  }
}
