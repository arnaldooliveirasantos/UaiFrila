
import { BaseRepository } from './BaseRepository';

export class EnderecoUsuarioRepository extends BaseRepository {
  // Modelo: endereco VARCHAR(150), bairro, cidade_id, cep, numero, complemento, lat, lng
  // Usa VIEW vw_enderecos_completo para leitura
  
  async salvar(usuarioId: number, dados: any) {
    const pool = (this as any).pool || (BaseRepository as any).getPool();
    if (!pool) throw new Error('Pool não configurado');
    
    try {
      await pool.query(`UPDATE enderecos_usuario SET is_ativo = false, atualizado_em = NOW() WHERE usuario_id = $1 AND is_ativo = true`, [usuarioId]);
    } catch {}
    
    const sql = `INSERT INTO enderecos_usuario (usuario_id, endereco, bairro, cidade_id, cep, numero, complemento, lat, lng, is_ativo, criado_em) 
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,NOW()) 
         RETURNING *`;
    const params = [usuarioId, dados.endereco || null, dados.bairro || 'Centro', dados.cidade_id || 1, dados.cep || null, dados.numero || null, dados.complemento || null, dados.lat || null, dados.lng || null];
    const rows = await pool.query(sql, params);
    return rows.rows[0];
  }

  // Leitura via VIEW vw_enderecos_completo
  async buscarPorUsuarioId(usuarioId: number) {
    try {
      return await this.queryOne(`SELECT eu.*, c.nome as cidade_nome, e.sigla as endereco_estado, u.nome_completo, u.email FROM enderecos_usuario eu LEFT JOIN cidades c ON c.id = eu.cidade_id LEFT JOIN estados e ON e.id = c.estado_id LEFT JOIN usuarios u ON u.id = eu.usuario_id WHERE usuario_id = $1 AND is_ativo = true ORDER BY criado_em DESC LIMIT 1`, [usuarioId]);
    } catch (e:any) {
      console.log('[EnderecoUsuarioRepository] Fallback view:', e.message);
      try {
        return await this.queryOne(`SELECT eu.*, c.nome as cidade_nome, c.estado as cidade_estado FROM enderecos_usuario eu LEFT JOIN cidades c ON c.id = eu.cidade_id WHERE eu.usuario_id = $1 AND eu.is_ativo = true ORDER BY eu.criado_em DESC LIMIT 1`, [usuarioId]);
      } catch { 
        try {
          return await this.queryOne(`SELECT * FROM enderecos_usuario WHERE usuario_id = $1 AND is_ativo = true ORDER BY criado_em DESC LIMIT 1`, [usuarioId]);
        } catch { return null; }
      }
    }
  }

  async listarCompletoPorUsuario(usuarioId: number) {
    try {
      return await this.query(`SELECT eu.*, c.nome as cidade_nome, e.sigla as endereco_estado, u.nome_completo, u.email FROM enderecos_usuario eu LEFT JOIN cidades c ON c.id = eu.cidade_id LEFT JOIN estados e ON e.id = c.estado_id LEFT JOIN usuarios u ON u.id = eu.usuario_id WHERE usuario_id = $1 ORDER BY criado_em DESC`, [usuarioId]);
    } catch {
      return await this.query(`SELECT eu.*, c.nome as cidade_nome FROM enderecos_usuario eu LEFT JOIN cidades c ON c.id = eu.cidade_id WHERE eu.usuario_id = $1 ORDER BY eu.criado_em DESC`, [usuarioId]);
    }
  }

  async listarTodosCompleto(limite = 100) {
    try {
      return await this.query(`SELECT eu.*, c.nome as cidade_nome, e.sigla as endereco_estado, u.nome_completo, u.email FROM enderecos_usuario eu LEFT JOIN cidades c ON c.id = eu.cidade_id LEFT JOIN estados e ON e.id = c.estado_id LEFT JOIN usuarios u ON u.id = eu.usuario_id ORDER BY criado_em DESC LIMIT $1`, [limite]);
    } catch {
      return await this.query(`SELECT * FROM enderecos_usuario ORDER BY criado_em DESC LIMIT $1`, [limite]);
    }
  }

  async atualizar(usuarioId: number, dados: any) {
    const existente = await this.buscarPorUsuarioId(usuarioId);
    if (!existente) {
      return await this.salvar(usuarioId, dados);
    }
    const permitidas = ['endereco','bairro','cidade_id','cep','numero','complemento','lat','lng'];
    const campos: string[] = []; const valores: any[] = []; let idx = 1;
    for (const k of permitidas) {
      const v = (dados as any)[k];
      if (v !== undefined) { campos.push(`${k} = $${idx}`); valores.push(v); idx++; }
    }
    if (campos.length === 0) return existente;
    valores.push(usuarioId);
    const sql = `UPDATE enderecos_usuario SET ${campos.join(', ')}, atualizado_em = NOW() WHERE usuario_id = $${idx} AND is_ativo = true RETURNING *`;
    const rows = await this.query(sql, valores);
    return rows[0];
  }

  async listarPorUsuario(usuarioId: number) {
    return await this.listarCompletoPorUsuario(usuarioId);
  }
}
