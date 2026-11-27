import { BaseRepository } from './BaseRepository';
import { EnderecoModel } from '../models/EnderecoModel';
// listarBrutosPorUsuario: linhas cruas (snake_case) com cidade_nome, para o /auth/me
// (o front le endereco_ativo_cidade a partir de cidade_nome). Sem pool.query no controller.
export class EnderecoRepository extends BaseRepository<EnderecoModel> {
  constructor() { super('enderecos', EnderecoModel); }
  async listarBrutosPorUsuario(usuarioId: number): Promise<any[]> {
    const r = await this.query(
      `SELECT e.*, c.nome AS cidade_nome, e2.sigla AS cidade_estado_sigla, c.estado_id
         FROM enderecos e LEFT JOIN cidades c ON c.id = e.cidade_id LEFT JOIN estados e2 ON e2.id = c.estado_id
         WHERE e.usuario_id = $1 ORDER BY e.ativo DESC NULLS LAST, e.criado_em DESC NULLS LAST, e.id DESC`,
      [usuarioId]);
    return r.rows || [];
  }
  async listarPorUsuario(usuarioId: number): Promise<EnderecoModel[]> {
    const r = await this.query(`SELECT * FROM enderecos WHERE usuario_id = $1 ORDER BY ativo DESC, criado_em DESC`, [usuarioId]);
    return this.mapRows(r.rows || r);
  }
  async buscarAtivoPorUsuario(usuarioId: number): Promise<EnderecoModel | null> {
    const r = await this.query(`SELECT * FROM enderecos WHERE usuario_id = $1 AND ativo = true LIMIT 1`, [usuarioId]);
    const rows = r.rows || r;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }
  async buscarPrimeiroPorUsuario(usuarioId: number): Promise<EnderecoModel | null> {
    const r = await this.query(`SELECT * FROM enderecos WHERE usuario_id = $1 ORDER BY id ASC LIMIT 1`, [usuarioId]);
    const rows = r.rows || r;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }
  async buscarCompletoPorId(id: number): Promise<EnderecoModel | null> {
    const r = await this.query(
      `SELECT e.*, c.nome AS cidade_nome, e2.sigla AS cidade_estado_sigla
       FROM enderecos e LEFT JOIN cidades c ON c.id = e.cidade_id LEFT JOIN estados e2 ON e2.id = c.estado_id WHERE e.id = $1 LIMIT 1`, [id]);
    const rows = r.rows || r;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }
  async desativarOutrosAtivos(usuarioId: number, excetoId: number): Promise<void> {
    await this.query(`UPDATE enderecos SET ativo = false WHERE usuario_id = $1 AND id != $2`, [usuarioId, excetoId]);
  }
  async listarTodosAtivos(): Promise<EnderecoModel[]> {
    const r = await this.query(`SELECT * FROM enderecos WHERE ativo = true ORDER BY criado_em DESC`);
    return this.mapRows(r.rows || r);
  }
  async definirAtivo(id: number, usuarioId: number): Promise<EnderecoModel | null> {
    await this.query(`UPDATE enderecos SET ativo = false WHERE usuario_id = $1 AND id != $2`, [usuarioId, id]);
    const r = await this.query(`UPDATE enderecos SET ativo = true, atualizado_em = NOW() WHERE id = $1 AND usuario_id = $2 RETURNING *`, [id, usuarioId]);
    const rows = r.rows || r;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }
  async deletarPorUsuario(usuarioId: number): Promise<void> {
    await this.query(`DELETE FROM enderecos WHERE usuario_id = $1`, [usuarioId]);
  }
}
