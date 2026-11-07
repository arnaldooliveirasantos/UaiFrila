import { BaseService } from './BaseService';
import { NotificacaoRepository } from '../repositories/NotificacaoRepository';
import { NotificacaoModel } from '../models/NotificacaoModel';

export class NotificacaoService extends BaseService<NotificacaoModel> {
  constructor() { super(new NotificacaoRepository()); }
  async listarPorUsuario(usuarioId: number): Promise<NotificacaoModel[]> { return await (this.repo as NotificacaoRepository).listarPorUsuario(usuarioId); }
  async criarNotificacao(dados: { usuario_id: number; tipo: string; titulo: string; mensagem: string; vaga_id?: number; candidatura_id?: number }): Promise<NotificacaoModel> { return await (this.repo as NotificacaoRepository).criarNotificacao(dados); }
  async marcarComoLida(id: number): Promise<NotificacaoModel | null> { return await this.repo.atualizarGenerico(id, { lida: true }); }
  async enviarCancelamentoCandidatura(contratanteId: number, vagaId: number, candidaturaId: number, tituloVaga: string, motivo: string): Promise<NotificacaoModel> { return await this.criarNotificacao({ usuario_id: contratanteId, tipo: 'CANCELAMENTO_CANDIDATURA', titulo: `Freela cancelou candidatura - Vaga #${vagaId}`, mensagem: `O freela cancelou a candidatura aceita para "${tituloVaga}". Motivo: ${motivo}. A vaga voltou para aguardando.`, vaga_id: vagaId, candidatura_id: candidaturaId }); }
  async enviarVagaCancelada(freelaId: number, vagaId: number, candidaturaId: number, tituloVaga: string, motivo?: string): Promise<NotificacaoModel> { return await this.criarNotificacao({ usuario_id: freelaId, tipo: 'VAGA_CANCELADA', titulo: `Vaga cancelada pelo contratante - #${vagaId}`, mensagem: `O contratante cancelou a vaga "${tituloVaga}". Motivo: ${motivo || 'Sem motivo informado'}`, vaga_id: vagaId, candidatura_id: candidaturaId }); }
}
