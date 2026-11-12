import { BaseRepository } from './BaseRepository';
import { UsuarioModel } from '../models/UsuarioModel';
// CORRIGIDO: a query antiga usava u.nome e u.whatsapp — colunas que NAO existem em usuarios
// (a coluna e nome_completo; nao ha whatsapp). Por isso listarCandidatosPorVaga sempre caia no catch.
// SEM Client novo por request (a versao antiga criava um Client pg por chamada e dava client.end()).
export class CandidatoRepository extends BaseRepository<UsuarioModel> {
  constructor() { super('usuarios', UsuarioModel); }
  async listarCandidatosPorVaga(vagaId: number): Promise<any[]> {
    const r = await this.query(`
      SELECT u.id AS freela_id, u.nome_completo AS nome,
             COALESCE(AVG(a.nota), 5.0) AS media_avaliacao,
             COUNT(a.id) AS total_trampos
      FROM usuarios u
      LEFT JOIN candidaturas c ON c.usuario_id = u.id OR c.freela_id = u.id
      LEFT JOIN avaliacoes a ON a.avaliado_id = u.id
      WHERE c.vaga_id = $1
      GROUP BY u.id, u.nome_completo
      ORDER BY media_avaliacao DESC, u.nome_completo ASC`, [vagaId]);
    return r.rows || [];
  }
}
