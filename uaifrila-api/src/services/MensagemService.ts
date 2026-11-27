import { BaseService } from './BaseService';
import { MensagemRepository } from '../repositories/MensagemRepository';
import { ConversaRepository } from '../repositories/ConversaRepository';
import { MensagemModel } from '../models/MensagemModel';
export class MensagemService extends BaseService<MensagemModel> {
  constructor() { super(new MensagemRepository()); }
  async listarPorConversa(conversaId: number, usuarioId: number): Promise<MensagemModel[]> {
    const conversa = await new ConversaRepository().buscarPorId(conversaId); if (!conversa) throw new Error('Conversa nao encontrada');
    if (conversa.contratanteId !== usuarioId && conversa.freelaId !== usuarioId) throw new Error('Acesso negado a conversa');
    return await (this.repo as MensagemRepository).listarPorConversa(conversaId);
  }
  async enviar(conversaId: number, remetenteId: number, dados: { texto: string; anexo_url?: string; tipo?: string }): Promise<MensagemModel> {
    const conversa = await new ConversaRepository().buscarPorId(conversaId); if (!conversa) throw new Error('Conversa nao encontrada');
    if (conversa.contratanteId !== remetenteId && conversa.freelaId !== remetenteId) throw new Error('Acesso negado a conversa');
    if (!dados.texto) throw new Error('texto obrigatorio');
    const msg = await (this.repo as MensagemRepository).criarGenerico({ conversa_id: conversaId, remetente_id: remetenteId, texto: dados.texto, anexo_url: dados.anexo_url, tipo: dados.tipo || 'TEXTO' });
    await new ConversaRepository().tocarUltimaMensagem(conversaId); return msg;
  }
  async marcarComoLida(conversaId: number, leitorId: number): Promise<void> { await (this.repo as MensagemRepository).marcarComoLida(conversaId, leitorId); }
}
