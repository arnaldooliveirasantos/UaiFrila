import { BaseService } from './BaseService';
import { TrampoTurnoRepository } from '../repositories/TrampoTurnoRepository';
import { TrampoTurnoModel } from '../models/TrampoTurnoModel';
import { BaseRepository } from '../repositories/BaseRepository';
export class TrampoTurnoService extends BaseService<TrampoTurnoModel> {
  constructor() { super(new TrampoTurnoRepository()); }
  private async buscarTrampo(trampoId: number) {
    const pool = BaseRepository.getPool() as any;
    const r = await pool.query(`SELECT * FROM trampos WHERE id = $1`, [trampoId]);
    if (!r.rows[0]) throw new Error('Trampo não encontrado');
    return r.rows[0];
  }
  private async garantirParticipante(trampoId: number, usuarioId: number) {
    const t = await this.buscarTrampo(trampoId);
    if (Number(t.freela_id) !== Number(usuarioId) && Number(t.contratante_id) !== Number(usuarioId)) throw new Error('Você não participa deste trampo');
    return t;
  }
  async listarPorTrampo(trampoId: number, usuarioId: number): Promise<TrampoTurnoModel[]> {
    await this.garantirParticipante(trampoId, usuarioId);
    return await (this.repo as TrampoTurnoRepository).listarPorTrampo(trampoId);
  }
  // Gera um item por turno da vaga, com o valor do turno congelado.
  // Chamado quando a candidatura vira trampo (aceite). Idempotente.
  async gerarParaTrampo(trampoId: number, usuarioId: number): Promise<TrampoTurnoModel[]> {
    const trampo = await this.garantirParticipante(trampoId, usuarioId);
    const pool = BaseRepository.getPool() as any;
    const rv = await pool.query(`SELECT * FROM vaga_turnos WHERE vaga_id = $1 ORDER BY data, hora_inicio`, [trampo.vaga_id]);
    const criados: TrampoTurnoModel[] = [];
    for (const vt of rv.rows || []) {
      const ja = await (this.repo as TrampoTurnoRepository).buscarPorTrampoETurno(trampoId, Number(vt.id));
      if (ja) { criados.push(ja); continue; }
      criados.push(await this.repo.criarGenerico({ trampo_id: trampoId, vaga_turno_id: Number(vt.id), status: 'AGENDADO', valor_servico: Number(vt.valor_servico || 0) }));
    }
    return criados;
  }
  async checkin(id: number, usuarioId: number): Promise<TrampoTurnoModel | null> {
    const item = await this.buscarPorId(id);
    const trampo = await this.buscarTrampo(Number((item as any).trampoId ?? (item as any).trampo_id));
    if (Number(trampo.freela_id) !== Number(usuarioId)) throw new Error('Só o freela pode fazer check-in');
    if (String((item as any).status).toUpperCase() !== 'AGENDADO') throw new Error(`Turno com status ${(item as any).status} - check-in não permitido`);
    return await this.repo.atualizarGenerico(id, { status: 'EM_ANDAMENTO', checkin_em: new Date() });
  }
  async checkout(id: number, usuarioId: number): Promise<TrampoTurnoModel | null> {
    const item = await this.buscarPorId(id);
    const trampo = await this.buscarTrampo(Number((item as any).trampoId ?? (item as any).trampo_id));
    if (Number(trampo.freela_id) !== Number(usuarioId)) throw new Error('Só o freela pode fazer check-out');
    if (String((item as any).status).toUpperCase() !== 'EM_ANDAMENTO') throw new Error(`Turno com status ${(item as any).status} - check-out não permitido`);
    return await this.repo.atualizarGenerico(id, { status: 'CONCLUIDO', checkout_em: new Date() });
  }
  async marcarFalta(id: number, usuarioId: number): Promise<TrampoTurnoModel | null> {
    const item = await this.buscarPorId(id);
    const trampo = await this.buscarTrampo(Number((item as any).trampoId ?? (item as any).trampo_id));
    if (Number(trampo.contratante_id) !== Number(usuarioId)) throw new Error('Só o contratante pode marcar falta');
    if (String((item as any).status).toUpperCase() === 'CONCLUIDO') throw new Error('Turno já concluído - não pode marcar falta');
    return await this.repo.atualizarGenerico(id, { status: 'FALTOU' });
  }
  // IMPREVISTO: freela nao pode continuar. Cancela os turnos restantes
  // (AGENDADO/EM_ANDAMENTO); os CONCLUIDOS ficam pagos. So o freela ou o
  // contratante do trampo pode acionar.
  async cancelarRestantes(trampoId: number, usuarioId: number, motivo?: string): Promise<TrampoTurnoModel[]> {
    await this.garantirParticipante(trampoId, usuarioId);
    const pool = BaseRepository.getPool() as any;
    await pool.query(`UPDATE trampo_turnos SET status = 'CANCELADO', atualizado_em = NOW() WHERE trampo_id = $1 AND status IN ('AGENDADO','EM_ANDAMENTO')`, [trampoId]);
    return await (this.repo as TrampoTurnoRepository).listarPorTrampo(trampoId);
  }
  // Acerto por imprevisto: soma SO os turnos CONCLUIDOS.
  async resumoPagamento(trampoId: number, usuarioId: number): Promise<any> {
    const lista = await this.listarPorTrampo(trampoId, usuarioId);
    const porStatus: Record<string, number> = {};
    let pago = 0;
    for (const x of lista) {
      const st = String((x as any).status).toUpperCase();
      porStatus[st] = (porStatus[st] || 0) + 1;
      if (st === 'CONCLUIDO') pago += Number((x as any).valorServico ?? (x as any).valor_servico ?? 0);
    }
    return { trampo_id: trampoId, turnos_total: lista.length, por_status: porStatus, valor_a_pagar: pago, turnos: lista };
  }
}
