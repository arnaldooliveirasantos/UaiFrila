import { BaseService } from './BaseService';
import { CandidaturaRepository } from '../repositories/CandidaturaRepository';
import { VagaRepository } from '../repositories/VagaRepository';
import { VariavelSistemaService } from './VariavelSistemaService';
import { NotificacaoService } from './NotificacaoService';
// CORRIGIDO: antes usava BaseRepository.getPool().query em criar/aceitar/cancelar/
// cancelarPorVaga. Agora todo SQL esta em CandidaturaRepository / VagaRepository.
// ATENCAO: aceitar/cancelar fazem 2 escritas (candidatura + status da vaga) sem
// transacao — o TransactionMiddleware existe mas NAO esta ligado no App.ts e o
// BaseRepository nao honra o txClient. Se um dia ligar, isso aqui vira atomico.
export class CandidaturaService extends BaseService<any> {
  private variavelSvc = new VariavelSistemaService();
  private notificacaoService = new NotificacaoService();
  private vagaRepo = new VagaRepository();
  constructor() { super(new CandidaturaRepository()); }
  private get candRepo(): CandidaturaRepository { return this.getRepo() as CandidaturaRepository; }
  async listarPorVaga(vagaId: number): Promise<any[]> { return await this.candRepo.listarPorVaga(vagaId); }
  async listarMinhas(freelaId: number): Promise<any[]> { return await this.candRepo.listarMinhas(freelaId); }
  async criar(dados: any, usuarioId?: number): Promise<any> {
    if (!usuarioId) throw new Error('usuarioId obrigatório para candidatar');
    const vagaId = Number(dados.vaga_id || dados.vagaId);
    if (!vagaId) throw new Error('vaga_id obrigatório');
    const vaga = await this.vagaRepo.buscarVagaComStatus(vagaId);
    if (!vaga) throw new Error('Vaga não encontrada');
    if (!vaga.permite_candidatar) throw new Error(`Vaga com status ${vaga.status_chave} não aceita candidaturas`);
    if (Number(vaga.contratante_id) === Number(usuarioId)) throw new Error('Você não pode se candidatar na sua própria vaga');
    const existente = await this.candRepo.buscarAtiva(vagaId, usuarioId);
    if (existente) throw new Error('Você já se candidatou para esta vaga');
    const criada = await this.candRepo.criarCandidatura(vagaId, usuarioId);
    if (vaga.status_chave === 'AGUARDANDO_CANDIDATURA') {
      await this.vagaRepo.atualizarStatusVaga(vagaId, 'AGUARDANDO_ACEITE');
    }
    return criada;
  }
  async candidatar(dados: any, usuarioId: number): Promise<any> { return this.criar(dados, usuarioId); }
  async aceitar(candidaturaId: number, contratanteId: number): Promise<any> {
    const cand = await this.candRepo.buscarComVaga(candidaturaId);
    if (!cand) throw new Error('Candidatura não encontrada');
    if (Number(cand.contratante_id) !== Number(contratanteId)) throw new Error('Só o dono da vaga pode aceitar');
    await this.candRepo.atualizarStatus(candidaturaId, 'ACEITA');
    await this.vagaRepo.atualizarStatusVaga(cand.vaga_id, 'ACEITA');
    await this.notificacaoService.criarNotificacao({ usuario_id: cand.freela_id || cand.usuario_id, tipo: 'CANDIDATURA_ACEITA', titulo: `Sua candidatura foi aceita - Vaga #${cand.vaga_id}`, mensagem: `Você foi aceito para "${cand.titulo}". Aguarde o início.`, vaga_id: cand.vaga_id, candidatura_id: candidaturaId });
    return { ...cand, status: 'ACEITA' };
  }
  async cancelar(candidaturaId: number, usuarioId: number, motivo?: string): Promise<any> {
    const cfg = await this.variavelSvc.getConfigCancelamento();
    const { prazoHoras, motivoMin, notificar } = cfg;
    const cand = await this.candRepo.buscarComVaga(candidaturaId);
    if (!cand) throw new Error('Candidatura não encontrada');
    const freelaId = cand.freela_id || cand.usuario_id;
    if (Number(freelaId) !== Number(usuarioId)) throw new Error('Só o freela pode cancelar sua candidatura');
    const statusCand = (cand.status || '').toUpperCase();
    const statusVaga = (cand.status_vaga_chave || '').toUpperCase();
    if (statusCand === 'EM_ANDAMENTO' || statusVaga === 'EM_ANDAMENTO') throw new Error('Não pode cancelar com trampo EM_ANDAMENTO.');
    if (statusCand === 'CANCELADA') throw new Error('Candidatura já cancelada');
    if (statusCand === 'ACEITA' || statusVaga === 'ACEITA') {
      if (!motivo || motivo.trim().length < motivoMin) throw new Error(`Motivo obrigatório (mínimo ${motivoMin} caracteres) quando já foi aceito.`);
      const diffHoras = (new Date(cand.data_inicio).getTime() - Date.now()) / (1000 * 60 * 60);
      if (diffHoras < prazoHoras) throw new Error(`Não pode cancelar. Faltam ${diffHoras.toFixed(1)}h para o início. Cancelamento até ${prazoHoras}h antes.`);
      if (notificar) await this.notificacaoService.enviarCancelamentoCandidatura(cand.contratante_id, cand.vaga_id, candidaturaId, cand.titulo, motivo);
    }
    await this.candRepo.atualizarStatus(candidaturaId, 'CANCELADA', { motivo_cancelamento: motivo || 'Cancelado pelo freela', data_cancelamento: true, cancelado_por: usuarioId });
    const { total: totalOutros, aceitas: temAceitaNum } = await this.candRepo.contarAtivasPorVaga(cand.vaga_id, candidaturaId);
    const temAceita = temAceitaNum > 0;
    let novoStatus = 'AGUARDANDO_CANDIDATURA';
    if (totalOutros > 0) novoStatus = temAceita ? 'ACEITA' : 'AGUARDANDO_ACEITE';
    await this.vagaRepo.atualizarStatusVaga(cand.vaga_id, novoStatus);
    return { candidatura_id: candidaturaId, vaga_id: cand.vaga_id, status_anterior: statusCand, novo_status_vaga: novoStatus, prazo_configurado_horas: prazoHoras, notificacao_enviada: notificar && statusCand === 'ACEITA' };
  }
  async cancelarPorVaga(vagaId: number, usuarioId: number, motivo?: string): Promise<any> {
    const ativa = await this.candRepo.buscarAtiva(vagaId, usuarioId);
    if (!ativa) throw new Error('Candidatura não encontrada');
    return this.cancelar((ativa as any).id, usuarioId, motivo);
  }
}
