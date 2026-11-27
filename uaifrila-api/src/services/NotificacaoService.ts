import { BaseService } from './BaseService';
import { NotificacaoRepository } from '../repositories/NotificacaoRepository';
import { NotificacaoModel } from '../models/NotificacaoModel';
// Quem chama pode passar vaga_id / candidatura_id (como o CandidaturaService faz)
// OU referencia_tipo + referencia_id. Os dois caem nas colunas reais da tabela:
// referencia_tipo = 'VAGA' | 'CANDIDATURA' e referencia_id = o id.
// ANTES: o repository ignorava vaga_id/candidatura_id e a notificação nascia sem link.
type Criar = { usuario_id: number; tipo: string; titulo: string; mensagem: string; referencia_tipo?: string; referencia_id?: number; vaga_id?: number; candidatura_id?: number };
export class NotificacaoService extends BaseService<NotificacaoModel> {
  constructor() { super(new NotificacaoRepository()); }
  async listarPorUsuario(usuarioId: number): Promise<NotificacaoModel[]> { return await (this.repo as NotificacaoRepository).listarPorUsuario(usuarioId); }
  async criarNotificacao(dados: Criar): Promise<NotificacaoModel> {
    const referencia_tipo = dados.referencia_tipo || (dados.candidatura_id ? 'CANDIDATURA' : dados.vaga_id ? 'VAGA' : undefined);
    const referencia_id = dados.referencia_id ?? dados.candidatura_id ?? dados.vaga_id;
    return await (this.repo as NotificacaoRepository).criarNotificacao({ usuario_id: dados.usuario_id, tipo: dados.tipo, titulo: dados.titulo, mensagem: dados.mensagem, referencia_tipo, referencia_id });
  }
  async contarNaoLidas(usuarioId: number): Promise<number> {
    const lista = await this.listarPorUsuario(usuarioId);
    return lista.filter((n: any) => !(n.lida ?? (n as any).lido)).length;
  }
  async marcarTodasComoLidas(usuarioId: number): Promise<number> {
    const lista = await this.listarPorUsuario(usuarioId);
    let n = 0;
    for (const item of lista) {
      if (!(item as any).lida && !(item as any).lido) { await this.marcarComoLida(Number((item as any).id)); n++; }
    }
    return n;
  }
  async marcarComoLida(id: number): Promise<NotificacaoModel | null> { return await this.repo.atualizarGenerico(id, { lida: true }); }
  async enviarCancelamentoCandidatura(contratanteId: number, vagaId: number, candidaturaId: number, tituloVaga: string, motivo: string): Promise<NotificacaoModel> { return await this.criarNotificacao({ usuario_id: contratanteId, tipo: 'CANCELAMENTO_CANDIDATURA', titulo: `Freela cancelou candidatura - Vaga #${vagaId}`, mensagem: `O freela cancelou a candidatura aceita para "${tituloVaga}". Motivo: ${motivo}. A vaga voltou para aguardando.`, referencia_tipo: 'CANDIDATURA', referencia_id: candidaturaId }); }
  async enviarVagaCancelada(freelaId: number, vagaId: number, candidaturaId: number, tituloVaga: string, motivo?: string): Promise<NotificacaoModel> { return await this.criarNotificacao({ usuario_id: freelaId, tipo: 'VAGA_CANCELADA', titulo: `Vaga cancelada pelo contratante - #${vagaId}`, mensagem: `O contratante cancelou a vaga "${tituloVaga}". Motivo: ${motivo || 'Sem motivo informado'}`, referencia_tipo: 'VAGA', referencia_id: vagaId }); }
}
