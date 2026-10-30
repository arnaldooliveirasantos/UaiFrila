
import { BaseRepository } from './BaseRepository';

export interface TipoUsuario {
  id: number;
  chave: string;
  nome_exibicao: string;
  descricao?: string;
  nivel_permissao: number;
  criado_em: Date;
}

export class TiposUsuarioRepository extends BaseRepository {
  async listarTodos(): Promise<TipoUsuario[]> {
    const rows = await this.query(`SELECT id, chave, nome_exibicao, descricao, nivel_permissao, criado_em FROM tipos_usuario ORDER BY nivel_permissao ASC, id ASC`);
    return rows;
  }

  async buscarPorId(id: number): Promise<TipoUsuario | null> {
    return await this.queryOne(`SELECT id, chave, nome_exibicao, descricao, nivel_permissao, criado_em FROM tipos_usuario WHERE id=$1 LIMIT 1`, [id]);
  }

  async buscarPorChave(chave: string): Promise<TipoUsuario | null> {
    return await this.queryOne(`SELECT id, chave, nome_exibicao, descricao, nivel_permissao, criado_em FROM tipos_usuario WHERE LOWER(chave)=LOWER($1) LIMIT 1`, [chave]);
  }
}
