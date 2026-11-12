import { BaseRepository } from './BaseRepository';
import { EnderecoModel } from '../models/EnderecoModel';
export class EnderecoRepository extends BaseRepository<EnderecoModel> {
  constructor() { super('enderecos', EnderecoModel); }
  async listarPorUsuario(usuarioId: number): Promise<EnderecoModel[]> {
    const r = await this.query(`SELECT e.*, c.nome AS cidade_nome FROM enderecos e LEFT JOIN cidades c ON c.id = e.cidade_id WHERE e.usuario_id = $1 ORDER BY e.ativo DESC, e.criado_em DESC`, [usuarioId]);
    return this.mapRows(r.rows || []);
  }
  async buscarAtivoPorUsuario(usuarioId: number): Promise<EnderecoModel | null> {
    const r = await this.query(`SELECT * FROM enderecos WHERE usuario_id = $1 AND ativo = true LIMIT 1`, [usuarioId]);
    return r.rows?.[0] ? this.mapRow(r.rows[0]) : null;
  }
  async buscarPrimeiroPorUsuario(usuarioId: number): Promise<EnderecoModel | null> {
    const r = await this.query(`SELECT * FROM enderecos WHERE usuario_id = $1 ORDER BY criado_em ASC LIMIT 1`, [usuarioId]);
    return r.rows?.[0] ? this.mapRow(r.rows[0]) : null;
  }
  async desativarOutrosAtivos(usuarioId: number, excetoId: number): Promise<void> {
    await this.query(`UPDATE enderecos SET ativo = false WHERE usuario_id = $1 AND id != $2`, [usuarioId, excetoId]);
  }
  async buscarCompletoPorId(id: number): Promise<EnderecoModel | null> {
    try {
      const r = await this.query(`SELECT e.*, c.nome AS cidade_nome, es.nome AS estado_nome, es.sigla AS estado_sigla, te.chave AS tipo_chave, te.nome AS tipo_nome FROM enderecos e LEFT JOIN cidades c ON c.id = e.cidade_id LEFT JOIN estados es ON es.id = c.estado_id LEFT JOIN tipos_endereco te ON te.id = e.tipo_endereco_id WHERE e.id = $1 LIMIT 1`, [id]);
      return r.rows?.[0] ? this.mapRow(r.rows[0]) : null;
    } catch { return await this.buscarPorId(id); }
  }
  async definirAtivo(id: number, usuarioId: number): Promise<EnderecoModel | null> {
    await this.desativarOutrosAtivos(usuarioId, id);
    const r = await this.query(`UPDATE enderecos SET ativo = true, atualizado_em = NOW() WHERE id = $1 AND usuario_id = $2 RETURNING *`, [id, usuarioId]);
    return r.rows?.[0] ? this.mapRow(r.rows[0]) : null;
  }
  async listarTodosAtivos(): Promise<EnderecoModel[]> {
    const r = await this.query(`SELECT * FROM enderecos WHERE ativo = true ORDER BY criado_em DESC`);
    return this.mapRows(r.rows || []);
  }
  async deletarPorUsuario(usuarioId: number): Promise<void> {
    await this.query(`DELETE FROM enderecos WHERE usuario_id = $1`, [usuarioId]);
  }
}
