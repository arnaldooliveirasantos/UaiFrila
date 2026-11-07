import { BaseRepository } from "./BaseRepository";
import { VagaModel } from "../models/VagaModel";
export class VagaRepository extends BaseRepository<VagaModel> {
  constructor() {
    super("vagas", VagaModel);
  }
  async listarAbertas(): Promise<VagaModel[]> {
    const r = await this.query(
      `SELECT v.*, sv.chave as status_chave, sv.nome_exibicao as status_nome FROM vagas v JOIN status_vaga sv ON sv.id = v.status_vaga_id WHERE sv.chave IN ('AGUARDANDO_CANDIDATURA','AGUARDANDO_ACEITE') ORDER BY v.criado_em DESC`,
    );
    return this.mapRows(r.rows || r);
  }
  async listarPorContratante(contratanteId: number): Promise<VagaModel[]> {
    const r = await this.query(
      `SELECT v.*, sv.chave as status_chave FROM vagas v JOIN status_vaga sv ON sv.id = v.status_vaga_id WHERE v.contratante_id = $1 ORDER BY v.criado_em DESC`,
      [contratanteId],
    );
    return this.mapRows(r.rows || r);
  }
  async buscarCompletaPorId(id: number): Promise<any> {
    const r = await this.query(
      `SELECT v.*, sv.chave as status_chave, sv.nome_exibicao as status_nome FROM vagas v JOIN status_vaga sv ON sv.id = v.status_vaga_id WHERE v.id = $1`,
      [id],
    );
    const rows = r.rows || r;
    return rows[0] || null;
  }
}
