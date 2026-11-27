import { BaseRepository } from './BaseRepository';
import { ProvedorPagamentoModel } from '../models/ProvedorPagamentoModel';
export class ProvedorPagamentoRepository extends BaseRepository<ProvedorPagamentoModel> {
  constructor() { super('provedores_pagamento', ProvedorPagamentoModel); }
  async buscarAtivo(): Promise<ProvedorPagamentoModel | null> {
    const r = await this.query(`SELECT * FROM provedores_pagamento WHERE ativo = true ORDER BY id LIMIT 1`);
    return (r.rows || [])[0] ? this.mapRow((r.rows || [])[0]) : null;
  }
  async buscarPorProvedor(provedor: string): Promise<ProvedorPagamentoModel | null> {
    const r = await this.query(`SELECT * FROM provedores_pagamento WHERE provedor = $1 LIMIT 1`, [String(provedor).toUpperCase()]);
    return (r.rows || [])[0] ? this.mapRow((r.rows || [])[0]) : null;
  }
  async desativarTodos(): Promise<void> { await this.query(`UPDATE provedores_pagamento SET ativo = false, atualizado_em = NOW()`); }
  async registrarAuditoria(provedorId: number, adminId: number, acao: string, deAtivo: boolean, paraAtivo: boolean): Promise<void> {
    await this.query(`INSERT INTO provedor_pagamento_auditoria (provedor_id, admin_id, acao, de_ativo, para_ativo) VALUES ($1,$2,$3,$4,$5)`, [provedorId, adminId, acao, deAtivo, paraAtivo]);
  }
}
