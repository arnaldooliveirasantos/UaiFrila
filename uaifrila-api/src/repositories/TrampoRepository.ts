import { BaseRepository } from './BaseRepository';
import { TrampoModel } from '../models/TrampoModel';
export class TrampoRepository extends BaseRepository<TrampoModel> {
  constructor() { super('trampos', TrampoModel); }
  async listarPorUsuario(usuarioId: number): Promise<TrampoModel[]> {
    const result = await this.query(`SELECT * FROM trampos WHERE freela_id = $1 OR contratante_id = $1 ORDER BY criado_em DESC`, [usuarioId]);
    return this.mapRows(result.rows || result);
  }
  async buscarPorVaga(vagaId: number): Promise<TrampoModel | null> {
    const result = await this.query(`SELECT * FROM trampos WHERE vaga_id = $1 LIMIT 1`, [vagaId]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }
  async listarPorStatus(status: string): Promise<TrampoModel[]> {
    const result = await this.query(`SELECT * FROM trampos WHERE status = $1 ORDER BY criado_em DESC`, [status]);
    return this.mapRows(result.rows || result);
  }
  // Ganhos: SQL dinamico com filtros (antes vivia no GanhosController com pool.query).
  // Descobre as colunas de trampos via information_schema para nao quebrar se o banco
  // nao tiver alguma coluna opcional (ex.: freela_recebe_liquido).
  async listarGanhosRaw(usuarioId: number, filtros: any): Promise<any[]> {
    let cols: string[] = [];
    try {
      const rc = await this.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'trampos'`);
      cols = (rc.rows || []).map((r: any) => r.column_name);
    } catch {}
    if (!cols.length) return [];
    const has = (c: string) => cols.includes(c);
    const freelaCol = has('freela_id') ? 'freela_id' : has('usuario_id') ? 'usuario_id' : has('freela_usuario_id') ? 'freela_usuario_id' : null;
    const vagaCol = has('vaga_id') ? 'vaga_id' : null;
    const statusCol = has('status') ? 'status' : null;
    const dataCol = has('data_fim') ? 'data_fim' : has('criado_em') ? 'criado_em' : has('data_inicio') ? 'data_inicio' : null;
    if (!freelaCol) return [];
    const { data_inicio, data_fim, status, contratante_id, funcao, busca } = filtros || {};
    const where: string[] = [`t.${freelaCol} = $1`];
    const vals: any[] = [usuarioId];
    let pi = 2;
    if (data_inicio && dataCol) { where.push(`DATE(t.${dataCol}) >= $${pi++}`); vals.push(data_inicio); }
    if (data_fim && dataCol) { where.push(`DATE(t.${dataCol}) <= $${pi++}`); vals.push(data_fim); }
    if (status && String(status).toUpperCase() !== 'TODOS' && statusCol) { where.push(`UPPER(t.${statusCol}) = $${pi++}`); vals.push(String(status).toUpperCase()); }
    if (contratante_id && vagaCol) { where.push(`v.contratante_id = $${pi++}`); vals.push(Number(contratante_id)); }
    if (funcao && vagaCol) { where.push(`(v.funcao ILIKE $${pi} OR v.titulo ILIKE $${pi})`); vals.push(`%${funcao}%`); pi++; }
    if (busca && vagaCol) { where.push(`(v.titulo ILIKE $${pi} OR v.descricao ILIKE $${pi})`); vals.push(`%${busca}%`); pi++; }
    const sql = `SELECT t.*, v.titulo AS vaga_titulo, v.funcao AS vaga_funcao, v.valor_servico, v.valor_total, v.valor_transporte,
      v.contratante_id, u.nome_completo AS contratante_nome, c.nome AS cidade_nome
      FROM trampos t
      ${vagaCol ? 'LEFT JOIN vagas v ON v.id = t.vaga_id' : ''}
      ${vagaCol ? 'LEFT JOIN usuarios u ON u.id = v.contratante_id' : ''}
      ${vagaCol ? 'LEFT JOIN cidades c ON c.id = v.cidade_id' : ''}
      WHERE ${where.join(' AND ')} ORDER BY t.${dataCol || 'id'} DESC`;
    const r = await this.query(sql, vals);
    return r.rows || [];
  }
}
