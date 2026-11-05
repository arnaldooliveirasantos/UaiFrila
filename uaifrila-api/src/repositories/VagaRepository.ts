import { BaseRepository } from './BaseRepository';
import { VagaModel } from '../models/VagaModel';
export class VagaRepository extends BaseRepository<VagaModel> {
  constructor() { super('vagas', VagaModel); }

  async listarAbertas(): Promise<VagaModel[]> {
    const result = await this.query(`SELECT * FROM vagas WHERE status = 'ABERTA' ORDER BY data_inicio ASC`);
    return this.mapRows(result.rows || result);
  }

  async listarPorContratante(contratanteId: number): Promise<VagaModel[]> {
    const result = await this.query(`SELECT * FROM vagas WHERE contratante_id = $1 ORDER BY criado_em DESC`, [contratanteId]);
    return this.mapRows(result.rows || result);
  }

  async buscarCompletaPorId(id: number): Promise<VagaModel | null> {
    const result = await this.query(`
      SELECT v.*, u.nome_completo as contratante_nome, u.email as contratante_email,
             ev.endereco_id, e.logradouro, e.bairro, c.nome as cidade_nome, c.estado as cidade_estado
      FROM vagas v
      LEFT JOIN usuarios u ON u.id = v.contratante_id
      LEFT JOIN enderecos_vaga ev ON ev.vaga_id = v.id AND ev.ativo = true
      LEFT JOIN enderecos e ON e.id = ev.endereco_id
      LEFT JOIN cidades c ON c.id = e.cidade_id
      WHERE v.id = $1 LIMIT 1
    `, [id]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async listarComFiltro(filtro: { status?: string, funcao?: string, cidadeId?: number }): Promise<VagaModel[]> {
    let sql = `SELECT v.* FROM vagas v`;
    const params: any[] = [];
    const wheres: string[] = [];

    if (filtro.cidadeId) {
      sql += ` JOIN enderecos_vaga ev ON ev.vaga_id = v.id JOIN enderecos e ON e.id = ev.endereco_id`;
      params.push(filtro.cidadeId);
      wheres.push(`e.cidade_id = $${params.length}`);
    }
    if (filtro.status) { params.push(filtro.status); wheres.push(`v.status = $${params.length}`); }
    if (filtro.funcao) { params.push(filtro.funcao); wheres.push(`v.funcao = $${params.length}`); }

    if (wheres.length > 0) sql += ` WHERE ${wheres.join(' AND ')}`;
    sql += ` ORDER BY v.data_inicio ASC`;

    const result = await this.query(sql, params);
    return this.mapRows(result.rows || result);
  }
}
