import { BaseService } from './BaseService';
import { CandidaturaRepository } from '../repositories/CandidaturaRepository';
import { VariavelSistemaService } from './VariavelSistemaService';
import { NotificacaoService } from './NotificacaoService';
import { BaseRepository } from '../repositories/BaseRepository';
import { VagaService } from './VagaService';
import { TrampoService } from './TrampoService';
import { TrampoTurnoService } from './TrampoTurnoService';

// Fases 1 a 4 do fluxo de seleção.
// Status da candidatura: PENDENTE -> SELECIONADO -> ACEITA (confirmou) / RECUSADA (recusou ou prazo expirou)
// PENDENTE -> LISTA_ESPERA (vaga cheia ou seleção feita) -> SELECIONADO (quando abre vaga).
// Quantidade da vaga (vagas.quantidade_vagas) = quantas pessoas a vaga precisa.
// Preenchidas = SELECIONADO + ACEITA. Restantes = quantidade - preenchidas.
// Quando abre vaga (recusa, expiração, cancelamento), o 1o da fila é chamado automaticamente.
export class CandidaturaService extends BaseService<any> {
  private variavelSvc = new VariavelSistemaService();
  private notificacaoService = new NotificacaoService();
  constructor() { super(new CandidaturaRepository()); }

  private async prazoConfirmacaoHoras(): Promise<number> {
    try { return await this.variavelSvc.buscarNumeroObrigatorio('PRAZO_CONFIRMACAO_SELECAO_HORAS'); } catch { return 24; }
  }
  private async limitePendentes(): Promise<number> {
    try { return await this.variavelSvc.buscarNumeroObrigatorio('LIMITE_CANDIDATURAS_PENDENTES'); } catch { return 5; }
  }
  private async vagaDe(vagaId: number): Promise<any> {
    const pool = BaseRepository.getPool() as any;
    const r = await pool.query(`SELECT v.*, sv.chave as status_chave FROM vagas v LEFT JOIN status_vaga sv ON sv.id = v.status_vaga_id WHERE v.id = $1`, [vagaId]);
    return r.rows[0] || null;
  }
  private async contarPreenchidas(vagaId: number): Promise<number> {
    const pool = BaseRepository.getPool() as any;
    const r = await pool.query(`SELECT COUNT(*)::int AS n FROM candidaturas WHERE vaga_id = $1 AND status IN ('SELECIONADO','ACEITA')`, [vagaId]);
    return Number(r.rows[0]?.n || 0);
  }
  // Status da vaga derivado da seleção. Não mexe em EM_ANDAMENTO / FINALIZADA / CANCELADA / FECHADA.
  private async atualizarStatusVaga(vagaId: number): Promise<void> {
    const pool = BaseRepository.getPool() as any;
    const vaga = await this.vagaDe(vagaId);
    if (!vaga) return;
    const chave = String(vaga.status_chave || '').toUpperCase();
    if (['EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA', 'FECHADA'].includes(chave)) return;
    const r = await pool.query(`SELECT COUNT(*) FILTER (WHERE status = 'SELECIONADO')::int AS sel, COUNT(*) FILTER (WHERE status = 'ACEITA')::int AS ace, COUNT(*) FILTER (WHERE status IN ('PENDENTE','LISTA_ESPERA'))::int AS pend FROM candidaturas WHERE vaga_id = $1`, [vagaId]);
    const { sel, ace, pend } = r.rows[0] || { sel: 0, ace: 0, pend: 0 };
    let novo = 'AGUARDANDO_CANDIDATURA';
    if (sel > 0) novo = 'AGUARDANDO_CONFIRMACAO';
    else if (ace > 0) novo = 'ACEITA';
    else if (pend > 0) novo = 'AGUARDANDO_ACEITE';
    if (novo === chave) return;
    const rs = await pool.query(`SELECT id FROM status_vaga WHERE chave = $1`, [novo]);
    if (rs.rows[0]) await pool.query(`UPDATE vagas SET status_vaga_id = $1 WHERE id = $2`, [rs.rows[0].id, vagaId]);
  }
  // Renumera a fila (1, 2, 3...) na ordem de chegada, sem buracos.
  private async renumerarFila(vagaId: number): Promise<void> {
    const pool = BaseRepository.getPool() as any;
    const r = await pool.query(`SELECT id FROM candidaturas WHERE vaga_id = $1 AND status = 'LISTA_ESPERA' ORDER BY COALESCE(posicao_lista_espera, 999999), criado_em ASC`, [vagaId]);
    for (let i = 0; i < r.rows.length; i++) {
      await pool.query(`UPDATE candidaturas SET posicao_lista_espera = $2 WHERE id = $1`, [r.rows[i].id, i + 1]);
    }
  }
  // Chama o 1o da fila: vira SELECIONADO com prazo novo. Retorna a candidatura chamada (ou null).
  private async promoverProximo(vagaId: number): Promise<any | null> {
    const pool = BaseRepository.getPool() as any;
    const vaga = await this.vagaDe(vagaId);
    if (!vaga) return null;
    const preenchidas = await this.contarPreenchidas(vagaId);
    const quantidade = Number(vaga.quantidade_vagas || 1);
    if (preenchidas >= quantidade) return null;
    const r = await pool.query(`SELECT * FROM candidaturas WHERE vaga_id = $1 AND status = 'LISTA_ESPERA' ORDER BY COALESCE(posicao_lista_espera, 999999), criado_em ASC LIMIT 1`, [vagaId]);
    const cand = r.rows[0];
    if (!cand) return null;
    const prazoHoras = await this.prazoConfirmacaoHoras();
    const prazo = new Date(Date.now() + prazoHoras * 3600 * 1000);
    await pool.query(`UPDATE candidaturas SET status = 'SELECIONADO', posicao_lista_espera = NULL, prazo_resposta_ate = $2 WHERE id = $1`, [cand.id, prazo]);
    await this.renumerarFila(vagaId);
    await this.atualizarStatusVaga(vagaId);
    const freelaId = cand.freela_id || cand.usuario_id;
    try { await this.notificacaoService.criarNotificacao({ usuario_id: freelaId, tipo: 'SELECAO_CHAMADA_FILA', titulo: `Sua vez! Vaga #${vagaId}`, mensagem: `Uma vaga abriu em "${vaga.titulo}". Você foi chamado da lista de espera — confirme em até ${prazoHoras}h.`, vaga_id: vagaId, candidatura_id: cand.id }); } catch {}
    return { ...cand, status: 'SELECIONADO', prazo_resposta_ate: prazo, posicao_lista_espera: null };
  }
  private async buscarCandidatura(id: number): Promise<any> {
    const pool = BaseRepository.getPool() as any;
    const r = await pool.query(`SELECT c.*, v.contratante_id, v.titulo as vaga_titulo, v.quantidade_vagas FROM candidaturas c JOIN vagas v ON v.id = c.vaga_id WHERE c.id = $1`, [id]);
    return r.rows[0] || null;
  }

  async listarPorVaga(vagaId: number): Promise<any[]> {
    try { await this.processarPrazos(); } catch {}
    const r = this.getRepo() as CandidaturaRepository;
    if (typeof (r as any).listarPorVaga === 'function') return await (r as any).listarPorVaga(vagaId);
    return await this.listarPorCampo('vaga_id', vagaId);
  }

  // Resumo da seleção para o Gerenciar Candidatos: quantidade, preenchidas, restantes, fila.
  async resumoSelecao(vagaId: number, contratanteId: number): Promise<any> {
    const pool = BaseRepository.getPool() as any;
    const vaga = await this.vagaDe(vagaId);
    if (!vaga) throw new Error('Vaga não encontrada');
    if (Number(vaga.contratante_id) !== Number(contratanteId)) throw new Error('Só o dono da vaga pode ver o resumo');
    const quantidade = Number(vaga.quantidade_vagas || 1);
    const r = await pool.query(`SELECT COUNT(*) FILTER (WHERE status = 'SELECIONADO')::int AS selecionados, COUNT(*) FILTER (WHERE status = 'ACEITA')::int AS aceitos, COUNT(*) FILTER (WHERE status = 'PENDENTE')::int AS pendentes, COUNT(*) FILTER (WHERE status = 'LISTA_ESPERA')::int AS fila FROM candidaturas WHERE vaga_id = $1`, [vagaId]);
    const s = r.rows[0] || { selecionados: 0, aceitos: 0, pendentes: 0, fila: 0 };
    const preenchidas = s.selecionados + s.aceitos;
    return { vaga_id: vagaId, quantidade_vagas: quantidade, selecionados: s.selecionados, aceitos: s.aceitos, preenchidas, restantes: Math.max(0, quantidade - preenchidas), pendentes: s.pendentes, lista_espera: s.fila, prazo_confirmacao_horas: await this.prazoConfirmacaoHoras() };
  }

  // Candidaturas do freela ENRIQUECIDAS com os dados da vaga (titulo, datas,
  // valores) + calculo (valor a receber, mesma regra de exibicao do mural).
  async listarMinhas(freelaId: number): Promise<any[]> {
    try { await this.processarPrazos(); } catch {}
    const pool = BaseRepository.getPool() as any;
    const r = await pool.query(
      `SELECT c.*, v.titulo as vaga_titulo, f.nome as vaga_funcao, v.descricao as vaga_descricao,
              v.data_inicio as vaga_data_inicio, v.data_fim as vaga_data_fim,
              v.valor_servico as vaga_valor_servico, v.valor_transporte as vaga_valor_transporte,
              v.contratante_id as vaga_contratante_id,
              sv.chave as vaga_status_chave, sv.nome_exibicao as vaga_status_nome
       FROM candidaturas c JOIN vagas v ON v.id = c.vaga_id LEFT JOIN funcoes f ON f.id = v.funcao_id
       LEFT JOIN status_vaga sv ON sv.id = v.status_vaga_id
       WHERE c.freela_id = $1 OR c.usuario_id = $1 ORDER BY c.criado_em DESC`, [freelaId]);
    const lista = r.rows || [];
    const vs = new VagaService();
    for (const c of lista) {
      try {
        c.calculo = await vs.calcular({ valor_servico: Number(c.vaga_valor_servico || 0), valor_transporte: Number(c.vaga_valor_transporte || 0), data_inicio_local: String(c.vaga_data_inicio || ''), data_fim_local: String(c.vaga_data_fim || ''), meio_pagamento: 'pix' });
        c.valor_a_receber = c.calculo?.valor_a_receber ?? null;
      } catch { c.calculo = null; c.valor_a_receber = null; }
    }
    return lista;
  }

  async criar(dados: any, usuarioId?: number): Promise<any> {
    if (!usuarioId) throw new Error('usuarioId obrigatório para candidatar');
    const pool = BaseRepository.getPool() as any;
    const vagaId = Number(dados.vaga_id || dados.vagaId);
    if (!vagaId) throw new Error('vaga_id obrigatório');
    const rv = await pool.query(`SELECT v.*, sv.chave as status_chave, sv.permite_candidatar FROM vagas v JOIN status_vaga sv ON sv.id = v.status_vaga_id WHERE v.id = $1`, [vagaId]);
    const vaga = rv.rows[0];
    if (!vaga) throw new Error('Vaga não encontrada');
    if (vaga.permite_candidatar === false) throw new Error(`Vaga com status ${vaga.status_chave} não aceita candidaturas`);
    if (Number(vaga.contratante_id) === Number(usuarioId)) throw new Error('Você não pode se candidatar na sua própria vaga');
    // Fase 3: data limite para se candidatar (NULL = até o início do primeiro turno).
    if (vaga.data_limite_candidatura && new Date(vaga.data_limite_candidatura).getTime() < Date.now()) throw new Error('Prazo para se candidatar nesta vaga já encerrou');
    // Fase 2: limite de candidaturas pendentes por freela (PENDENTE + SELECIONADO + LISTA_ESPERA).
    const limite = await this.limitePendentes();
    const rp = await pool.query(`SELECT COUNT(*)::int AS n FROM candidaturas WHERE (freela_id = $1 OR usuario_id = $1) AND status IN ('PENDENTE','SELECIONADO','LISTA_ESPERA')`, [usuarioId]);
    if (Number(rp.rows[0]?.n || 0) >= limite) throw new Error(`Você já tem ${limite} candidaturas pendentes. Cancele alguma antes de se candidatar em outra vaga.`);
    const rexiste = await pool.query(`SELECT id FROM candidaturas WHERE vaga_id = $1 AND (freela_id = $2 OR usuario_id = $2) AND status IN ('PENDENTE','SELECIONADO','LISTA_ESPERA','ACEITA')`, [vagaId, usuarioId]);
    if (rexiste.rows.length) throw new Error('Você já se candidatou para esta vaga');
    // Fase 1: vaga já cheia no ato da candidatura -> entra direto na lista de espera.
    const preenchidas = await this.contarPreenchidas(vagaId);
    const quantidade = Number(vaga.quantidade_vagas || 1);
    const mensagem = String(dados.mensagem || dados.mensagem_candidatura || '').slice(0, 500) || null;
    let criada: any;
    if (preenchidas >= quantidade) {
      const rpos = await pool.query(`SELECT COALESCE(MAX(posicao_lista_espera), 0)::int + 1 AS prox FROM candidaturas WHERE vaga_id = $1 AND status = 'LISTA_ESPERA'`, [vagaId]);
      const pos = Number(rpos.rows[0]?.prox || 1);
      const r = await pool.query(`INSERT INTO candidaturas (vaga_id, freela_id, usuario_id, status, mensagem, posicao_lista_espera) VALUES ($1,$2,$2,'LISTA_ESPERA',$3,$4) RETURNING *`, [vagaId, usuarioId, mensagem, pos]);
      criada = r.rows[0];
    } else {
      const r = await pool.query(`INSERT INTO candidaturas (vaga_id, freela_id, usuario_id, status, mensagem) VALUES ($1,$2,$2,'PENDENTE',$3) RETURNING *`, [vagaId, usuarioId, mensagem]);
      criada = r.rows[0];
    }
    if (vaga.status_chave === 'AGUARDANDO_CANDIDATURA') {
      const rs = await pool.query(`SELECT id FROM status_vaga WHERE chave='AGUARDANDO_ACEITE'`);
      if (rs.rows[0]) await pool.query(`UPDATE vagas SET status_vaga_id = $1 WHERE id = $2`, [rs.rows[0].id, vagaId]);
    }
    return criada;
  }

  async candidatar(dados: any, usuarioId: number): Promise<any> { return this.criar(dados, usuarioId); }

  // Fase 1: o dono seleciona N candidatos de uma vez. Viram SELECIONADO com prazo.
  // Quem ficou PENDENTE vai para a lista de espera (posição por ordem de chegada).
  async selecionarEmLote(vagaId: number, contratanteId: number, ids: number[]): Promise<any> {
    const pool = BaseRepository.getPool() as any;
    const vaga = await this.vagaDe(vagaId);
    if (!vaga) throw new Error('Vaga não encontrada');
    if (Number(vaga.contratante_id) !== Number(contratanteId)) throw new Error('Só o dono da vaga pode selecionar');
    const idsLimpos = [...new Set((ids || []).map(Number).filter((n) => !isNaN(n) && n > 0))];
    if (!idsLimpos.length) throw new Error('Selecione pelo menos um candidato');
    const quantidade = Number(vaga.quantidade_vagas || 1);
    const preenchidas = await this.contarPreenchidas(vagaId);
    const restantes = quantidade - preenchidas;
    if (idsLimpos.length > restantes) throw new Error(`Só restam ${restantes} vaga(s). Selecione no máximo ${restantes} candidato(s).`);
    const r = await pool.query(`SELECT * FROM candidaturas WHERE id = ANY($1::int[]) AND vaga_id = $2 ORDER BY criado_em ASC`, [idsLimpos, vagaId]);
    const validas = r.rows || [];
    if (validas.length !== idsLimpos.length) throw new Error('Um ou mais candidatos não pertencem a esta vaga');
    for (const c of validas) {
      if (!['PENDENTE', 'LISTA_ESPERA'].includes(String(c.status || '').toUpperCase())) throw new Error(`Candidatura #${c.id} não pode ser selecionada (status ${c.status})`);
    }
    const prazoHoras = await this.prazoConfirmacaoHoras();
    const prazo = new Date(Date.now() + prazoHoras * 3600 * 1000);
    const selecionados: any[] = [];
    for (const c of validas) {
      await pool.query(`UPDATE candidaturas SET status = 'SELECIONADO', posicao_lista_espera = NULL, prazo_resposta_ate = $2 WHERE id = $1`, [c.id, prazo]);
      const freelaId = c.freela_id || c.usuario_id;
      try { await this.notificacaoService.criarNotificacao({ usuario_id: freelaId, tipo: 'CANDIDATURA_SELECIONADA', titulo: `Você foi selecionado! Vaga #${vagaId}`, mensagem: `Você foi selecionado para "${vaga.titulo}". Confirme em até ${prazoHoras}h — sem confirmar, a vaga chama o próximo da fila.`, vaga_id: vagaId, candidatura_id: c.id }); } catch {}
      selecionados.push({ ...c, status: 'SELECIONADO', prazo_resposta_ate: prazo, posicao_lista_espera: null });
    }
    // Quem ficou PENDENTE vira fila (ordem de chegada).
    const rp = await pool.query(`SELECT id FROM candidaturas WHERE vaga_id = $1 AND status = 'PENDENTE' ORDER BY criado_em ASC`, [vagaId]);
    for (const row of rp.rows) {
      const rpos = await pool.query(`SELECT COALESCE(MAX(posicao_lista_espera), 0)::int + 1 AS prox FROM candidaturas WHERE vaga_id = $1 AND status = 'LISTA_ESPERA'`, [vagaId]);
      await pool.query(`UPDATE candidaturas SET status = 'LISTA_ESPERA', posicao_lista_espera = $2 WHERE id = $1`, [row.id, Number(rpos.rows[0]?.prox || 1)]);
    }
    await this.renumerarFila(vagaId);
    await this.atualizarStatusVaga(vagaId);
    return { vaga_id: vagaId, selecionados, prazo_resposta_ate: prazo, prazo_confirmacao_horas: prazoHoras, restantes: restantes - selecionados.length };
  }

  // Fase 1: freela confirma a seleção -> vira ACEITA e o trampo é gerado (com turnos).
  async confirmarSelecao(candidaturaId: number, freelaId: number): Promise<any> {
    const pool = BaseRepository.getPool() as any;
    const cand = await this.buscarCandidatura(candidaturaId);
    if (!cand) throw new Error('Candidatura não encontrada');
    const dono = cand.freela_id || cand.usuario_id;
    if (Number(dono) !== Number(freelaId)) throw new Error('Só o freela pode confirmar sua seleção');
    if (String(cand.status || '').toUpperCase() !== 'SELECIONADO') throw new Error(`Candidatura não está aguardando confirmação (status ${cand.status})`);
    if (cand.prazo_resposta_ate && new Date(cand.prazo_resposta_ate).getTime() < Date.now()) {
      await this.expirarSelecao(cand);
      throw new Error('Prazo de confirmação expirado. A vaga chamou o próximo da lista de espera.');
    }
    await pool.query(`UPDATE candidaturas SET status = 'ACEITA', prazo_resposta_ate = NULL WHERE id = $1`, [candidaturaId]);
    const trampoSvc = new TrampoService();
    const trampo: any = await trampoSvc.criar({ vaga_id: cand.vaga_id, freela_id: dono, contratante_id: cand.contratante_id });
    try { await new TrampoTurnoService().gerarParaTrampo(Number(trampo.id ?? trampo.trampoId), Number(dono)); } catch {}
    await this.atualizarStatusVaga(cand.vaga_id);
    try { await this.notificacaoService.criarNotificacao({ usuario_id: cand.contratante_id, tipo: 'SELECAO_CONFIRMADA', titulo: `Seleção confirmada — Vaga #${cand.vaga_id}`, mensagem: `O freela confirmou a seleção em "${cand.vaga_titulo}". O trampo foi gerado.`, vaga_id: cand.vaga_id, candidatura_id: candidaturaId }); } catch {}
    try { const { PagamentoService } = await import('./PagamentoService'); await new PagamentoService().criarOuObter(candidaturaId, Number(cand.contratante_id), 'pix'); } catch (e: any) { console.error('[Candidatura] criar pagamento falhou:', e.message); }
    return { ...cand, status: 'ACEITA', prazo_resposta_ate: null, trampo_id: trampo.id ?? trampo.trampoId };
  }

  // Fase 1: freela recusa a seleção -> vaga abre e o próximo da fila é chamado.
  async recusarSelecao(candidaturaId: number, freelaId: number, motivo?: string): Promise<any> {
    const cand = await this.buscarCandidatura(candidaturaId);
    if (!cand) throw new Error('Candidatura não encontrada');
    const dono = cand.freela_id || cand.usuario_id;
    if (Number(dono) !== Number(freelaId)) throw new Error('Só o freela pode recusar sua seleção');
    if (String(cand.status || '').toUpperCase() !== 'SELECIONADO') throw new Error(`Candidatura não está aguardando confirmação (status ${cand.status})`);
    const pool = BaseRepository.getPool() as any;
    await pool.query(`UPDATE candidaturas SET status = 'RECUSADA', motivo_recusa = $2, prazo_resposta_ate = NULL WHERE id = $1`, [candidaturaId, String(motivo || 'Recusada pelo freela').slice(0, 100)]);
    const chamado = await this.promoverProximo(cand.vaga_id);
    await this.atualizarStatusVaga(cand.vaga_id);
    try { await this.notificacaoService.criarNotificacao({ usuario_id: cand.contratante_id, tipo: 'SELECAO_RECUSADA', titulo: `Seleção recusada — Vaga #${cand.vaga_id}`, mensagem: `O freela recusou a seleção em "${cand.vaga_titulo}".${chamado ? ' O próximo da fila foi chamado.' : ''}`, vaga_id: cand.vaga_id, candidatura_id: candidaturaId }); } catch {}
    return { candidatura_id: candidaturaId, vaga_id: cand.vaga_id, novo_status: 'RECUSADA', chamado_da_fila: chamado ? { candidatura_id: chamado.id, prazo_resposta_ate: chamado.prazo_resposta_ate } : null };
  }

  // Expira UMA seleção (prazo estourou) e chama o próximo. Usado pelo processarPrazos e pelo confirmar atrasado.
  private async expirarSelecao(cand: any): Promise<any> {
    const pool = BaseRepository.getPool() as any;
    await pool.query(`UPDATE candidaturas SET status = 'RECUSADA', motivo_recusa = 'Prazo de confirmação expirado', prazo_resposta_ate = NULL WHERE id = $1`, [cand.id]);
    const chamado = await this.promoverProximo(cand.vaga_id);
    await this.atualizarStatusVaga(cand.vaga_id);
    const freelaId = cand.freela_id || cand.usuario_id;
    try { await this.notificacaoService.criarNotificacao({ usuario_id: freelaId, tipo: 'SELECAO_EXPIRADA', titulo: `Prazo expirado — Vaga #${cand.vaga_id}`, mensagem: `O prazo para confirmar a seleção em "${cand.vaga_titulo}" expirou.`, vaga_id: cand.vaga_id, candidatura_id: cand.id }); } catch {}
    return chamado;
  }

  // Fase 1: expira todas as seleções com prazo vencido e chama a fila. Chamada
  // preguiçosamente nas listagens e pelo endpoint (cron) POST /api/candidaturas/processar-prazos.
  async processarPrazos(): Promise<any> {
    const pool = BaseRepository.getPool() as any;
    const r = await pool.query(`SELECT c.*, v.contratante_id, v.titulo as vaga_titulo FROM candidaturas c JOIN vagas v ON v.id = c.vaga_id WHERE c.status = 'SELECIONADO' AND c.prazo_resposta_ate IS NOT NULL AND c.prazo_resposta_ate < NOW() ORDER BY c.prazo_resposta_ate ASC LIMIT 100`);
    const expiradas: any[] = [];
    for (const cand of r.rows || []) {
      const chamado = await this.expirarSelecao(cand);
      expiradas.push({ candidatura_id: cand.id, vaga_id: cand.vaga_id, chamado_da_fila: chamado ? chamado.id : null });
    }
    return { processadas: expiradas.length, expiradas };
  }

  // Fase 1: dono marca que viu a candidatura (visto_em).
  async marcarVisto(candidaturaId: number, contratanteId: number): Promise<any> {
    const cand = await this.buscarCandidatura(candidaturaId);
    if (!cand) throw new Error('Candidatura não encontrada');
    if (Number(cand.contratante_id) !== Number(contratanteId)) throw new Error('Só o dono da vaga pode marcar como vista');
    const pool = BaseRepository.getPool() as any;
    await pool.query(`UPDATE candidaturas SET visto_em = NOW() WHERE id = $1`, [candidaturaId]);
    return { candidatura_id: candidaturaId, visto_em: new Date().toISOString() };
  }

  // Fase 1 (caminho legado 1 passo): aceitar direto -> ACEITA + trampo gerado.
  // Mantido porque o botão "Aceitar" do Gerenciar Candidatos e o PUT /status usam ele.
  async aceitar(candidaturaId: number, contratanteId: number): Promise<any> {
    const pool = BaseRepository.getPool() as any;
    const rc = await pool.query(`SELECT c.*, v.contratante_id, v.titulo FROM candidaturas c JOIN vagas v ON v.id = c.vaga_id WHERE c.id = $1`, [candidaturaId]);
    const cand = rc.rows[0];
    if (!cand) throw new Error('Candidatura não encontrada');
    if (Number(cand.contratante_id) !== Number(contratanteId)) throw new Error('Só o dono da vaga pode aceitar');
    if (!['PENDENTE', 'LISTA_ESPERA', 'SELECIONADO'].includes(String(cand.status || '').toUpperCase())) throw new Error(`Candidatura não pode ser aceita (status ${cand.status})`);
    if (String(cand.status || '').toUpperCase() === 'LISTA_ESPERA') {
      const vaga = await this.vagaDe(cand.vaga_id);
      const preenchidas = await this.contarPreenchidas(cand.vaga_id);
      if (preenchidas >= Number(vaga?.quantidade_vagas || 1)) throw new Error('Vaga já está cheia. Use a seleção em lote ou aguarde uma vaga abrir.');
    }
    await pool.query(`UPDATE candidaturas SET status = 'ACEITA', posicao_lista_espera = NULL, prazo_resposta_ate = NULL WHERE id = $1`, [candidaturaId]);
    await this.renumerarFila(cand.vaga_id);
    await this.atualizarStatusVaga(cand.vaga_id);
    const trampoSvc = new TrampoService();
    let trampo: any = null;
    try {
      trampo = await trampoSvc.criar({ vaga_id: cand.vaga_id, freela_id: cand.freela_id || cand.usuario_id, contratante_id: cand.contratante_id });
      await new TrampoTurnoService().gerarParaTrampo(Number(trampo.id ?? trampo.trampoId), Number(cand.freela_id || cand.usuario_id));
    } catch {}
    await this.notificacaoService.criarNotificacao({ usuario_id: cand.freela_id || cand.usuario_id, tipo: 'CANDIDATURA_ACEITA', titulo: `Sua candidatura foi aceita - Vaga #${cand.vaga_id}`, mensagem: `Você foi aceito para "${cand.titulo}". Aguarde o início.`, vaga_id: cand.vaga_id, candidatura_id: candidaturaId });
    // Pagamento: cria a cobrança (provedor ativo). Falha do provedor NÃO desfaz o aceite.
    try { const { PagamentoService } = await import('./PagamentoService'); await new PagamentoService().criarOuObter(candidaturaId, Number(cand.contratante_id), 'pix'); } catch (e: any) { console.error('[Candidatura] criar pagamento falhou:', e.message); }
    return { ...cand, status: 'ACEITA', trampo_id: trampo?.id ?? trampo?.trampoId ?? null };
  }

  // Fase 1: dono recusa uma candidatura (PENDENTE / LISTA_ESPERA / SELECIONADO).
  // Recusar um SELECIONADO abre vaga e chama o próximo da fila.
  async recusar(candidaturaId: number, contratanteId: number, motivo?: string): Promise<any> {
    const pool = BaseRepository.getPool() as any;
    const cand = await this.buscarCandidatura(candidaturaId);
    if (!cand) throw new Error('Candidatura não encontrada');
    if (Number(cand.contratante_id) !== Number(contratanteId)) throw new Error('Só o dono da vaga pode recusar');
    const status = String(cand.status || '').toUpperCase();
    if (!['PENDENTE', 'LISTA_ESPERA', 'SELECIONADO'].includes(status)) throw new Error(`Candidatura não pode ser recusada (status ${status})`);
    await pool.query(`UPDATE candidaturas SET status = 'RECUSADA', motivo_recusa = $2, posicao_lista_espera = NULL, prazo_resposta_ate = NULL WHERE id = $1`, [candidaturaId, String(motivo || 'Recusada pelo contratante').slice(0, 100)]);
    await this.renumerarFila(cand.vaga_id);
    let chamado = null;
    if (status === 'SELECIONADO') chamado = await this.promoverProximo(cand.vaga_id);
    await this.atualizarStatusVaga(cand.vaga_id);
    const freelaId = cand.freela_id || cand.usuario_id;
    try { await this.notificacaoService.criarNotificacao({ usuario_id: freelaId, tipo: 'CANDIDATURA_RECUSADA', titulo: `Candidatura não aprovada — Vaga #${cand.vaga_id}`, mensagem: `Sua candidatura em "${cand.vaga_titulo}" não foi aprovada.${motivo ? ` Motivo: ${motivo}` : ''}`, vaga_id: cand.vaga_id, candidatura_id: candidaturaId }); } catch {}
    return { candidatura_id: candidaturaId, vaga_id: cand.vaga_id, novo_status: 'RECUSADA', chamado_da_fila: chamado ? chamado.id : null };
  }

  async cancelar(candidaturaId: number, usuarioId: number, motivo?: string): Promise<any> {
    const pool = BaseRepository.getPool() as any;
    const cfg = await this.variavelSvc.getConfigCancelamento();
    const { prazoHoras, motivoMin, notificar } = cfg;
    const rc = await pool.query(`SELECT c.*, v.contratante_id, v.titulo, v.data_inicio, sv.chave as status_vaga_chave FROM candidaturas c JOIN vagas v ON v.id = c.vaga_id JOIN status_vaga sv ON sv.id = v.status_vaga_id WHERE c.id = $1`, [candidaturaId]);
    const cand = rc.rows[0];
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
    await pool.query(`UPDATE candidaturas SET status='CANCELADA', motivo_cancelamento=$2, data_cancelamento=NOW(), cancelado_por=$3, posicao_lista_espera=NULL, prazo_resposta_ate=NULL WHERE id=$1`, [candidaturaId, motivo || 'Cancelado pelo freela', usuarioId]);
    // Reembolso: 100% se nenhum turno confirmado; parcial se algum já confirmado.
    if (statusCand === 'ACEITA') {
      try { const { PagamentoService } = await import('./PagamentoService'); const { PagamentoRepository } = await import('../repositories/PagamentoRepository'); const pg: any = await new PagamentoRepository().buscarPorCandidatura(candidaturaId); if (pg && ['EM_ESCROW', 'AGUARDANDO_PAGAMENTO'].includes(String(pg.status))) await new PagamentoService().reembolsar(Number(pg.id), Number(cand.contratante_id), motivo || 'Candidatura cancelada pelo freela', true); } catch (e: any) { console.error('[Candidatura] reembolso falhou:', e.message); }
    }
    // Fase 1: cancelar um ACEITA / SELECIONADO abre vaga -> chama o próximo da fila.
    let chamado = null;
    if (['ACEITA', 'SELECIONADO'].includes(statusCand)) chamado = await this.promoverProximo(cand.vaga_id);
    else await this.renumerarFila(cand.vaga_id);
    await this.atualizarStatusVaga(cand.vaga_id);
    return { candidatura_id: candidaturaId, vaga_id: cand.vaga_id, status_anterior: statusCand, novo_status_vaga: 'ver status da vaga', prazo_configurado_horas: prazoHoras, notificacao_enviada: notificar && statusCand === 'ACEITA', chamado_da_fila: chamado ? chamado.id : null };
  }

  async cancelarPorVaga(vagaId: number, usuarioId: number, motivo?: string): Promise<any> {
    const pool = BaseRepository.getPool() as any;
    const r = await pool.query(`SELECT id FROM candidaturas WHERE vaga_id=$1 AND (freela_id=$2 OR usuario_id=$2) AND status IN ('PENDENTE','SELECIONADO','LISTA_ESPERA','ACEITA') LIMIT 1`, [vagaId, usuarioId]);
    if (!r.rows[0]) throw new Error('Candidatura não encontrada');
    return this.cancelar(r.rows[0].id, usuarioId, motivo);
  }
}
