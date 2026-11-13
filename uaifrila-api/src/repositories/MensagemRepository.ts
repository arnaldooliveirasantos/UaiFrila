import { BaseRepository } from "./BaseRepository";
import { MensagemModel } from "../models/MensagemModel";
export class MensagemRepository extends BaseRepository<MensagemModel> {
  constructor() {
    super("mensagens", MensagemModel);
  }
  async listarPorConversa(conversaId: number): Promise<MensagemModel[]> {
    const r = await this.query(
      `SELECT * FROM mensagens WHERE conversa_id = $1 ORDER BY criado_em ASC`,
      [conversaId],
    );
    return this.mapRows(r.rows || []);
  }
  async marcarComoLida(conversaId: number, leitorId: number): Promise<void> {
    await this.query(
      `UPDATE mensagens SET lida_em = NOW() WHERE conversa_id = $1 AND remetente_id != $2 AND lida_em IS NULL`,
      [conversaId, leitorId],
    );
  }
}
