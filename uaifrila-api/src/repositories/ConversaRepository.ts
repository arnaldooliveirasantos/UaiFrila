import { BaseRepository } from "./BaseRepository";
import { ConversaModel } from "../models/ConversaModel";
export class ConversaRepository extends BaseRepository<ConversaModel> {
  constructor() {
    super("conversas", ConversaModel);
  }
  async listarPorUsuario(usuarioId: number): Promise<ConversaModel[]> {
    const r = await this.query(
      `SELECT * FROM conversas WHERE freela_id = $1 OR contratante_id = $1 ORDER BY criado_em DESC`,
      [usuarioId],
    );
    return this.mapRows(r.rows || []);
  }
  async buscarPorTrampo(trampoId: number): Promise<ConversaModel | null> {
    const r = await this.query(
      `SELECT * FROM conversas WHERE trampo_id = $1 LIMIT 1`,
      [trampoId],
    );
    const rows = r.rows || [];
    return rows[0] ? this.mapRow(rows[0]) : null;
  }
  async tocarUltimaMensagem(conversaId: number): Promise<void> {
    await this.query(
      `UPDATE conversas SET ultima_mensagem_at = NOW() WHERE id = $1`,
      [conversaId],
    );
  }
}
