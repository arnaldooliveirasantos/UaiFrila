import { BaseRepository } from './BaseRepository';
import { NotificacaoModel } from '../models/NotificacaoModel';
export class NotificacaoRepository extends BaseRepository<NotificacaoModel> {
  constructor() { super('notificacoes', NotificacaoModel); }
  async listarPorUsuario(usuarioId: number): Promise<NotificacaoModel[]> { const r = await this.query(`SELECT * FROM notificacoes WHERE usuario_id = $1 ORDER BY criado_em DESC`, [usuarioId]); return this.mapRows(r.rows || r); }
  async criarNotificacao(dados: any): Promise<NotificacaoModel> { return await this.criarGenerico(dados); }
}
