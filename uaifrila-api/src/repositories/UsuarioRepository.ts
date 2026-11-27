import { BaseRepository } from './BaseRepository';
import { UsuarioModel } from '../models/UsuarioModel';
// CORRIGIDO: usava BaseRepository.getPool().query direto (furava a transacao do middleware).
// Agora usa this.query() — que usa o client da transacao quando existe.
export class UsuarioRepository extends BaseRepository<UsuarioModel> {
  constructor() { super('usuarios', UsuarioModel); }
  async buscarPorEmail(email: string): Promise<any | null> {
    const r = await this.query(`SELECT * FROM usuarios WHERE LOWER(email) = LOWER($1) LIMIT 1`, [email]);
    return r.rows?.[0] || null;
  }
  async buscarPorCpf(cpf: string): Promise<any | null> {
    const r = await this.query(`SELECT * FROM usuarios WHERE cpf = $1 LIMIT 1`, [cpf]);
    return r.rows?.[0] || null;
  }
  async buscarPorId(id: number): Promise<any | null> {
    const r = await this.query(`SELECT * FROM usuarios WHERE id = $1 LIMIT 1`, [id]);
    return r.rows?.[0] || null;
  }
  // Usuario + chave do status (sem JOIN com tu.nome / su.nome — essas colunas nao existem).
  async buscarPorEmailComStatus(email: string): Promise<any | null> {
    const r = await this.query(`SELECT u.*, su.chave AS status_chave FROM usuarios u LEFT JOIN status_usuario su ON su.id = u.status_usuario_id WHERE LOWER(u.email) = LOWER($1) LIMIT 1`, [email]);
    return r.rows?.[0] || null;
  }
  async atualizarStatus(id: number, statusId: number): Promise<void> {
    await this.query(`UPDATE usuarios SET status_usuario_id = $1, atualizado_em = NOW() WHERE id = $2`, [statusId, id]);
  }
  // Cancelamento LGPD: colunas existem no SQL 00 (email, cpf, nome_completo, cnpj, nome_fantasia, senha_hash, status, cancelado_em, cancelado_por).
  async anonimizarCancelar(id: number, statusCanceladoId: number): Promise<void> {
    await this.query(`UPDATE usuarios SET email = $2, cpf = $3, nome_completo = 'Usuario Cancelado', cnpj = NULL, nome_fantasia = NULL, senha_hash = NULL, status_usuario_id = $1, cancelado_em = NOW(), cancelado_por = 'PROPRIO_USUARIO_LINK', atualizado_em = NOW() WHERE id = $4`,
      [statusCanceladoId, `${id}@cancelado.com`, String(id), id]);
  }
}
