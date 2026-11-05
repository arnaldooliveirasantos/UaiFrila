import { BaseRepository } from './BaseRepository';
import { EnderecoModel } from '../models/EnderecoModel';

export class EnderecoRepository extends BaseRepository<EnderecoModel> {
  constructor() { super('enderecos', EnderecoModel); }

  async listarPorUsuario(usuarioId: number): Promise<EnderecoModel[]> {
    try {
      const result = await this.query(`
        SELECT e.*, c.nome as cidade_nome, c.estado as cidade_estado_sigla,
               te.chave as tipo_chave, te.nome as tipo_nome
        FROM enderecos e
        LEFT JOIN cidades c ON c.id = e.cidade_id
        LEFT JOIN tipos_endereco te ON te.id = e.tipo_endereco_id
        WHERE e.usuario_id = $1 ORDER BY e.ativo DESC, e.criado_em DESC
      `, [usuarioId]);
      return this.mapRows(result.rows || result);
    } catch (e: any) {
      const result = await this.query(`SELECT * FROM enderecos WHERE usuario_id = $1 ORDER BY ativo DESC, criado_em DESC`, [usuarioId]);
      return this.mapRows(result.rows || result);
    }
  }

  async buscarAtivoPorUsuario(usuarioId: number): Promise<EnderecoModel | null> {
    const result = await this.query(`SELECT * FROM enderecos WHERE usuario_id = $1 AND ativo = true LIMIT 1`, [usuarioId]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async desativarOutrosAtivos(usuarioId: number, excetoId: number): Promise<void> {
    await this.query(`UPDATE enderecos SET ativo = false WHERE usuario_id = $1 AND id != $2`, [usuarioId, excetoId]);
  }

  async buscarCompletoPorId(id: number): Promise<EnderecoModel | null> {
    try {
      const result = await this.query(`
        SELECT e.*, c.nome as cidade_nome, c.estado as cidade_estado_sigla, c.estado_id,
               es.nome as estado_nome, es.sigla as estado_sigla,
               te.chave as tipo_chave, te.nome as tipo_nome,
               (e.logradouro || ', ' || COALESCE(e.numero,'S/N') || ' - ' || e.bairro || ', ' || c.nome || '/' || es.sigla) as endereco_formatado
        FROM enderecos e
        JOIN cidades c ON c.id = e.cidade_id
        JOIN estados es ON es.id = c.estado_id
        LEFT JOIN tipos_endereco te ON te.id = e.tipo_endereco_id
        WHERE e.id = $1 LIMIT 1
      `, [id]);
      const rows = result.rows || result;
      return rows[0] ? this.mapRow(rows[0]) : null;
    } catch {
      return await this.buscarPorId(id);
    }
  }

  // Métodos novos para compatibilidade com Service
  async definirAtivo(id: number, usuarioId: number): Promise<EnderecoModel | null> {
    try {
      await this.desativarOutrosAtivos(usuarioId, id);
      const result = await this.query(`UPDATE enderecos SET ativo = true, atualizado_em = NOW() WHERE id = $1 AND usuario_id = $2 RETURNING *`, [id, usuarioId]);
      const rows = result.rows || result;
      return rows[0] ? this.mapRow(rows[0]) : null;
    } catch (e: any) {
      console.warn('[EnderecoRepository.definirAtivo] erro:', e.message);
      return null;
    }
  }

  async listarTodosAtivos(): Promise<EnderecoModel[]> {
    try {
      const result = await this.query(`SELECT * FROM enderecos WHERE ativo = true ORDER BY criado_em DESC`);
      return this.mapRows(result.rows || result);
    } catch {
      return await this.buscarTodos();
    }
  }
}
