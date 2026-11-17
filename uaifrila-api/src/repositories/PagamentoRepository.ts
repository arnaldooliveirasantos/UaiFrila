import { BaseRepository } from './BaseRepository';
import { PagamentoModel } from '../models/PagamentoModel';
export class PagamentoRepository extends BaseRepository<PagamentoModel> {
  constructor() { super('pagamentos', PagamentoModel); }
  async buscarPorCandidatura(candidaturaId: number): Promise<PagamentoModel | null> {
    const r = await this.query(`SELECT * FROM pagamentos WHERE candidatura_id = $1 ORDER BY id DESC LIMIT 1`, [candidaturaId]);
    return (r.rows || [])[0] ? this.mapRow((r.rows || [])[0]) : null;
  }
  async buscarPorProvedorPagamentoId(id: string): Promise<PagamentoModel | null> {
    const r = await this.query(`SELECT * FROM pagamentos WHERE provedor_pagamento_id = $1 LIMIT 1`, [id]);
    return (r.rows || [])[0] ? this.mapRow((r.rows || [])[0]) : null;
  }
  async listarPendentesNotificacao(minutos: number): Promise<PagamentoModel[]> {
    const r = await this.query(`SELECT * FROM pagamentos WHERE status = 'AGUARDANDO_PAGAMENTO' AND notificacao_60min_enviada = false AND expira_em <= NOW() + ($1 || ' minutes')::interval ORDER BY expira_em ASC LIMIT 100`, [String(minutos)]);
    return this.mapRows(r.rows || []);
  }
  async listarAguardando(): Promise<PagamentoModel[]> {
    const r = await this.query(`SELECT * FROM pagamentos WHERE status = 'AGUARDANDO_PAGAMENTO' ORDER BY criado_em ASC LIMIT 100`);
    return this.mapRows(r.rows || []);
  }
  async listarPorContratante(contratanteId: number): Promise<PagamentoModel[]> {
    const r = await this.query(`SELECT * FROM pagamentos WHERE contratante_id = $1 ORDER BY id DESC`, [contratanteId]);
    return this.mapRows(r.rows || []);
  }
}
