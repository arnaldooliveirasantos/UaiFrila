
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
  // Criar trampo direto (rota POST /api/trampos) ou pelo aceite da candidatura.
  // ANTES: chamava this.criar(...) de novo -> recursao infinita, nunca inseria.
  // AGORA: insere de verdade via repository. Idempotente: se ja existir trampo
  // para vaga+freela, devolve o existente (aceitar duas vezes nao duplica).
  async criar(dados: any): Promise<TrampoModel> {
    try {
      const vagaId = Number(dados.vaga_id ?? dados.vagaId);
      const freelaId = Number(dados.freela_id ?? dados.freelaId);
      const contratanteId = Number(dados.contratante_id ?? dados.contratanteId);
      if (!vagaId || !freelaId || !contratanteId) throw new Error('vaga_id, freela_id e contratante_id sao obrigatorios');
      const pool = (await import('../repositories/BaseRepository')).BaseRepository.getPool() as any;
      const ex = await pool.query(`SELECT * FROM trampos WHERE vaga_id = $1 AND freela_id = $2 LIMIT 1`, [vagaId, freelaId]);
      if (ex.rows[0]) return new TrampoModel(ex.rows[0]);
      const rv = await pool.query(`SELECT data_inicio, data_fim FROM vagas WHERE id = $1`, [vagaId]);
      const criado = await this.repository.criarGenerico({ vaga_id: vagaId, freela_id: freelaId, contratante_id: contratanteId, status: dados.status || 'ACEITO', data_inicio: rv.rows[0]?.data_inicio || null, data_fim: rv.rows[0]?.data_fim || null });
      return criado as TrampoModel;
    } catch (e: any) { this.handleError(e, 'TrampoService.criar'); }
  }
  // Trampo + turnos + acerto de uma candidatura (usado em Meus Trampos).
  async buscarPorCandidatura(candidaturaId: number, usuarioId: number): Promise<any> {
    const pool = (await import('../repositories/BaseRepository')).BaseRepository.getPool() as any;
    const rc = await pool.query(`SELECT * FROM candidaturas WHERE id = $1`, [candidaturaId]);
    const cand = rc.rows[0];
    if (!cand) throw new Error('Candidatura não encontrada');
    if (Number(cand.freela_id || cand.usuario_id) !== Number(usuarioId) && Number(cand.contratante_id || 0) !== Number(usuarioId)) {
      // Dono da vaga: permite ver tambem (contratante_id vem da vaga).
      const rv = await pool.query(`SELECT contratante_id FROM vagas WHERE id = $1`, [cand.vaga_id]);
      if (Number(rv.rows[0]?.contratante_id) !== Number(usuarioId)) throw new Error('Você não participa deste trampo');
    }
    const rt = await pool.query(`SELECT * FROM trampos WHERE vaga_id = $1 AND freela_id = $2 LIMIT 1`, [cand.vaga_id, cand.freela_id || cand.usuario_id]);
    const trampo = rt.rows[0] || null;
    if (!trampo) return { trampo: null, turnos: [], valor_a_pagar: 0 };
    const rtt = await pool.query(`SELECT tt.*, vt.data, vt.hora_inicio, vt.hora_fim, vt.atravessa_meia_noite, vt.duracao_minutos FROM trampo_turnos tt JOIN vaga_turnos vt ON vt.id = tt.vaga_turno_id WHERE tt.trampo_id = $1 ORDER BY vt.data, vt.hora_inicio`, [trampo.id]);
    const turnos = (rtt.rows || []).map((x: any) => ({ ...x, data: x.data instanceof Date ? x.data.toISOString().slice(0, 10) : String(x.data).slice(0, 10) }));
    const valor_a_pagar = turnos.filter((x: any) => String(x.status).toUpperCase() === 'CONCLUIDO').reduce((s: number, x: any) => s + Number(x.valor_servico || 0), 0);
    return { trampo, turnos, valor_a_pagar };
  }
  // FASE 4: freela confirma que vai (24h antes do trampo). Só quem participa.
  async confirmarPresenca(id: number, usuarioId: number): Promise<any> {
    const pool = (await import('../repositories/BaseRepository')).BaseRepository.getPool() as any;
    const rt = await pool.query(`SELECT t.*, v.titulo FROM trampos t JOIN vagas v ON v.id = t.vaga_id WHERE t.id = $1`, [id]);
    const trampo = rt.rows[0];
    if (!trampo) throw new Error('Trampo não encontrado');
    if (Number(trampo.freela_id) !== Number(usuarioId) && Number(trampo.contratante_id) !== Number(usuarioId)) throw new Error('Você não participa deste trampo');
    if (trampo.presenca_confirmada_em) return { trampo_id: id, presenca_confirmada_em: trampo.presenca_confirmada_em, ja_confirmada: true };
    const r = await pool.query(`UPDATE trampos SET presenca_confirmada_em = NOW() WHERE id = $1 RETURNING *`, [id]);
    const outroId = Number(trampo.freela_id) === Number(usuarioId) ? Number(trampo.contratante_id) : Number(trampo.freela_id);
    try {
      const { NotificacaoService } = await import('./NotificacaoService');
      await new NotificacaoService().criarNotificacao({ usuario_id: outroId, tipo: 'PRESENCA_CONFIRMADA', titulo: `Presença confirmada - Vaga #${trampo.vaga_id}`, mensagem: `Presença confirmada para "${trampo.titulo}".`, referencia_tipo: 'TRAMPO', referencia_id: id });
    } catch {}
    return { ...r.rows[0], ja_confirmada: false };
  }

  async listarTodos(): Promise<TrampoModel[]> {
    try { return await this.listar(); }
    catch (e: any) { this.handleError(e, 'TrampoService.listarTodos'); }
  }
}
