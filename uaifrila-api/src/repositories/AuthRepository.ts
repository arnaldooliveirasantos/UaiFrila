import { BaseRepository } from './BaseRepository';

export class AuthRepository extends BaseRepository {
  async buscarPorEmail(email: string) {
    return await this.queryOne(`SELECT id, nome, nome_fantasia, email, senha_hash, tipo FROM usuarios WHERE email = $1 LIMIT 1`, [email]);
  }

  async criarUsuario(dados: { nome: string; email: string; senha_hash: string; tipo?: string }) {
    const sql = `INSERT INTO usuarios (nome, email, senha_hash, tipo) VALUES ($1,$2,$3,$4) RETURNING id, nome, email, tipo`;
    const params = [dados.nome, dados.email, dados.senha_hash, dados.tipo || 'FREELA'];
    const rows = await this.query(sql, params);
    return rows[0];
  }

  async buscarPorId(id: number) {
    return await this.queryOne(`SELECT id, nome, email, tipo FROM usuarios WHERE id = $1`, [id]);
  }
}
