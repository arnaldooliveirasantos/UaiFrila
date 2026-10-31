
import { BaseRepository } from './BaseRepository';

export class UsuarioRepository extends BaseRepository {
  
  // Usa VIEW vw_usuarios_com_endereco_ativo
  async buscarPorIdComEndereco(id: number) {
    try {
      return await this.queryOne(`SELECT u.*, eu.id as endereco_ativo_id, eu.endereco as endereco_ativo_completo, eu.bairro as endereco_ativo_bairro, eu.cep as endereco_ativo_cep, c.nome as endereco_ativo_cidade, e.sigla as endereco_ativo_estado FROM usuarios u LEFT JOIN enderecos_usuario eu ON eu.usuario_id = u.id AND eu.is_ativo = true LEFT JOIN cidades c ON c.id = eu.cidade_id LEFT JOIN estados e ON e.id = c.estado_id WHERE id = $1`, [id]);
    } catch (e:any) {
      console.log('[UsuarioRepository] Fallback vw_usuarios_com_endereco_ativo:', e.message);
      try {
        return await this.queryOne(`SELECT u.*, tu.chave as tipo_chave, tu.nome_exibicao as tipo_nome, eu.id as endereco_ativo_id, eu.endereco as endereco_ativo_completo, eu.bairro as endereco_ativo_bairro, eu.cep as endereco_ativo_cep, eu.numero as endereco_ativo_numero, eu.complemento as endereco_ativo_complemento, eu.lat as endereco_ativo_lat, eu.lng as endereco_ativo_lng, eu.cidade_id as endereco_ativo_cidade_id, c.nome as endereco_ativo_cidade FROM usuarios u LEFT JOIN tipos_usuario tu ON tu.id = u.tipo_usuario_id LEFT JOIN enderecos_usuario eu ON eu.usuario_id = u.id AND eu.is_ativo = true LEFT JOIN cidades c ON c.id = eu.cidade_id WHERE u.id = $1`, [id]);
      } catch {
        return await this.queryOne(`SELECT * FROM usuarios WHERE id = $1`, [id]);
      }
    }
  }

  async buscarPorEmailComEndereco(email: string) {
    try {
      return await this.queryOne(`SELECT u.*, eu.id as endereco_ativo_id, eu.endereco as endereco_ativo_completo, eu.bairro as endereco_ativo_bairro, eu.cep as endereco_ativo_cep, c.nome as endereco_ativo_cidade, e.sigla as endereco_ativo_estado FROM usuarios u LEFT JOIN enderecos_usuario eu ON eu.usuario_id = u.id AND eu.is_ativo = true LEFT JOIN cidades c ON c.id = eu.cidade_id LEFT JOIN estados e ON e.id = c.estado_id WHERE LOWER(email) = LOWER($1) LIMIT 1`, [email]);
    } catch {
      return await this.queryOne(`SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1`, [email]);
    }
  }

  async buscarPorEmail(email: string) {
    return await this.buscarPorEmailComEndereco(email);
  }

  async buscarPorId(id: number) {
    return await this.buscarPorIdComEndereco(id);
  }

  async listarComEndereco(limite = 100) {
    try {
      return await this.query(`SELECT u.*, eu.id as endereco_ativo_id, eu.endereco as endereco_ativo_completo, eu.bairro as endereco_ativo_bairro, eu.cep as endereco_ativo_cep, c.nome as endereco_ativo_cidade, e.sigla as endereco_ativo_estado FROM usuarios u LEFT JOIN enderecos_usuario eu ON eu.usuario_id = u.id AND eu.is_ativo = true LEFT JOIN cidades c ON c.id = eu.cidade_id LEFT JOIN estados e ON e.id = c.estado_id ORDER BY criado_em DESC LIMIT $1`, [limite]);
    } catch {
      return await this.query(`SELECT * FROM usuarios ORDER BY criado_em DESC LIMIT $1`, [limite]);
    }
  }

  async criar(usuario: any) {
    const sql = `INSERT INTO usuarios (nome_completo, cpf, email, senha_hash, cnpj, nome_fantasia, tipo_usuario_id, funcao_principal, valor_hora_base, bio, tem_mei, como_chega, ajuda_uber, status_usuario_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,1) RETURNING *`;
    const params = [usuario.nome_completo, usuario.cpf || null, usuario.email, usuario.senha_hash || usuario.senha || '', usuario.cnpj || null, usuario.nome_fantasia || null, usuario.tipo_usuario_id || 1, usuario.funcao_principal || 'Garçom', usuario.valor_hora_base || 20, usuario.bio || null, usuario.tem_mei || false, usuario.como_chega || null, usuario.ajuda_uber || null];
    const rows = await this.query(sql, params);
    return rows[0];
  }

  async atualizar(id: number, dados: any) {
    const permitidos = ['nome_completo','cpf','email','cnpj','nome_fantasia','tipo_usuario_id','funcao_principal','valor_hora_base','bio','tem_mei','como_chega','ajuda_uber','status_usuario_id'];
    const campos: string[] = []; const valores: any[] = []; let idx = 1;
    for (const k of permitidos) {
      if (dados[k] !== undefined) { campos.push(`${k} = $${idx}`); valores.push(dados[k]); idx++; }
    }
    if (campos.length === 0) return await this.buscarPorIdComEndereco(id);
    valores.push(id);
    const sql = `UPDATE usuarios SET ${campos.join(', ')}, atualizado_em = NOW() WHERE id = $${idx} RETURNING *`;
    const rows = await this.query(sql, valores);
    return rows[0];
  }
}
