import { BaseRepository } from './BaseRepository';
import { TrampoModel } from '../models/TrampoModel';
export class TrampoRepository extends BaseRepository<TrampoModel> {
  constructor() { super('trampos', TrampoModel); }
  async listarPorUsuario(usuarioId: number): Promise<TrampoModel[]> { const r = await this.query(`SELECT * FROM trampos WHERE freela_id = $1 OR contratante_id = $1 ORDER BY criado_em DESC`, [usuarioId]); return this.mapRows(r.rows || []); }
  async buscarPorVaga(vagaId: number): Promise<TrampoModel | null> { const r = await this.query(`SELECT * FROM trampos WHERE vaga_id = $1 LIMIT 1`, [vagaId]); const rows = r.rows || []; return rows[0] ? this.mapRow(rows[0]) : null; }
  async listarPorStatus(status: string): Promise<TrampoModel[]> { const r = await this.query(`SELECT * FROM trampos WHERE status = $1 ORDER BY criado_em DESC`, [status]); return this.mapRows(r.rows || []); }
  // Ganhos: SQL FIXO, sem information_schema, sem fallback. Colunas existem no banco (itens 3 e 7).
  async listarGanhosRaw(usuarioId: number, filtros: any): Promise<any[]> {
    const { data_inicio, data_fim, status, contratante_id, funcao, busca } = filtros || {};
    const where: string[] = [`t.freela_id = $1`]; const vals: any[] = [usuarioId]; let pi = 2;
    if (data_inicio) { where.push(`DATE(COALESCE(t.data_fim, t.criado_em)) >= $${pi++}`); vals.push(data_inicio); }
    if (data_fim) { where.push(`DATE(COALESCE(t.data_fim, t.criado_em)) <= $${pi++}`); vals.push(data_fim); }
    if (status && String(status).toUpperCase() !== 'TODOS') { where.push(`UPPER(t.status) = $${pi++}`); vals.push(String(status).toUpperCase()); }
    if (contratante_id) { where.push(`v.contratante_id = $${pi++}`); vals.push(Number(contratante_id)); }
    if (funcao) { where.push(`(f.nome ILIKE $${pi} OR v.titulo ILIKE $${pi})`); vals.push(`%${funcao}%`); pi++; }
    if (busca) { where.push(`(v.titulo ILIKE $${pi} OR v.descricao ILIKE $${pi})`); vals.push(`%${busca}%`); pi++; }
    const sql = `SELECT t.*, v.titulo AS vaga_titulo, f.nome AS vaga_funcao, v.valor_servico, v.total_freela, v.valor_transporte,
      v.contratante_id, u.nome_completo AS contratante_nome
      FROM trampos t
      LEFT JOIN vagas v ON v.id = t.vaga_id
      LEFT JOIN funcoes f ON f.id = v.funcao_id
      LEFT JOIN usuarios u ON u.id = v.contratante_id
      WHERE ${where.join(' AND ')} ORDER BY t.criado_em DESC`;
    const r = await this.query(sql, vals); return r.rows || [];
  }
}
