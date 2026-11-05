import { BaseRepository } from './BaseRepository';
import { UsuarioModel } from '../models/UsuarioModel';
export class UsuarioRepository extends BaseRepository<UsuarioModel> {
  constructor() { super('usuarios', UsuarioModel); }

  async buscarPorEmail(email: string): Promise<UsuarioModel | null> {
    const result = await this.query(`SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1`, [email]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async buscarPorCpf(cpf: string): Promise<UsuarioModel | null> {
    const result = await this.query(`SELECT * FROM usuarios WHERE cpf = $1 LIMIT 1`, [cpf]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async buscarPorIdCompleto(id: number): Promise<UsuarioModel | null> {
    const result = await this.query(`
      SELECT u.*, 
             tu.chave as tipo_chave, tu.nome_exibicao as tipo_nome, tu.nivel_permissao,
             su.chave as status_chave, su.nome_exibicao as status_nome,
             e.id as endereco_ativo_id, e.logradouro, e.bairro, e.cidade_id,
             c.nome as cidade_nome, c.estado as cidade_estado
      FROM usuarios u
      LEFT JOIN tipos_usuario tu ON tu.id = u.tipo_usuario_id
      LEFT JOIN status_usuario su ON su.id = u.status_usuario_id
      LEFT JOIN enderecos e ON e.usuario_id = u.id AND e.ativo = true
      LEFT JOIN cidades c ON c.id = e.cidade_id
      WHERE u.id = $1 LIMIT 1
    `, [id]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async listarComFiltro(filtro?: { tipoUsuarioId?: number, statusUsuarioId?: number }): Promise<UsuarioModel[]> {
    let sql = `SELECT * FROM usuarios WHERE 1=1`;
    const params: any[] = [];
    if (filtro?.tipoUsuarioId) { params.push(filtro.tipoUsuarioId); sql += ` AND tipo_usuario_id = $${params.length}`; }
    if (filtro?.statusUsuarioId) { params.push(filtro.statusUsuarioId); sql += ` AND status_usuario_id = $${params.length}`; }
    sql += ` ORDER BY nome_completo`;
    const result = await this.query(sql, params);
    return this.mapRows(result.rows || result);
  }
}
