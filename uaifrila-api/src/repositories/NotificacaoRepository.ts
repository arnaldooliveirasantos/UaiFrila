import { BaseRepository } from "./BaseRepository";
import { NotificacaoModel } from "../models/NotificacaoModel";
export class NotificacaoRepository extends BaseRepository<NotificacaoModel> {
  constructor() {
    super("notificacoes", NotificacaoModel);
  }
  async listarPorUsuario(usuarioId: number): Promise<NotificacaoModel[]> {
    const r = await this.query(
      `SELECT * FROM notificacoes WHERE usuario_id = $1 ORDER BY criado_em DESC`,
      [usuarioId],
    );
    return this.mapRows(r.rows || []);
  }
  async criarNotificacao(dados: {
    usuario_id: number;
    tipo: string;
    titulo: string;
    mensagem: string;
    referencia_tipo?: string;
    referencia_id?: number;
  }): Promise<NotificacaoModel> {
    // WHITELIST: notificacoes so tem essas colunas. O mapToDbColumns deixa passar
    // chaves desconhecidas (vaga_id, candidatura_id, ...) direto para o INSERT ->
    // Postgres "column \"vaga_id\" of relation \"notificacoes\" does not exist".
    // Quem chamar com vaga_id/candidatura_id tem o campo ignorado aqui; o certo e
    // passar referencia_tipo + referencia_id (ver CandidaturaService.aceitar/recusar).
    const { usuario_id, tipo, titulo, mensagem, referencia_tipo, referencia_id } = dados as any;
    return await this.criarGenerico({ usuario_id, tipo, titulo, mensagem, referencia_tipo, referencia_id });
  }
}
