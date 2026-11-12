import { BaseRepository } from "./BaseRepository";
import { VagaModel } from "../models/VagaModel";
// Metodos novos: listarMural, atualizarStatusVaga. Antes, VagaService fazia isso
// com BaseRepository.getPool().query direto.
export class VagaRepository extends BaseRepository<VagaModel> {
  constructor() { super("vagas", VagaModel); }
  async listarAbertas(): Promise<VagaModel[]> {
    const r = await this.query(`SELECT v.*, sv.chave as status_chave, sv.nome_exibicao as status_nome FROM vagas v JOIN status_vaga sv ON sv.id = v.status_vaga_id WHERE sv.chave IN ('AGUARDANDO_CANDIDATURA','AGUARDANDO_ACEITE') ORDER BY v.criado_em DESC`);
    return this.mapRows(r.rows || r);
  }
  async listarPorContratante(contratanteId: number): Promise<VagaModel[]> {
    const r = await this.query(`SELECT v.*, sv.chave as status_chave FROM vagas v JOIN status_vaga sv ON sv.id = v.status_vaga_id WHERE v.contratante_id = $1 ORDER BY v.criado_em DESC`, [contratanteId]);
    return this.mapRows(r.rows || r);
  }
  async buscarCompletaPorId(id: number): Promise<any> {
    const r = await this.query(`SELECT v.*, sv.chave as status_chave, sv.nome_exibicao as status_nome FROM vagas v JOIN status_vaga sv ON sv.id = v.status_vaga_id WHERE v.id = $1`, [id]);
    const rows = r.rows || r;
    return rows[0] || null;
  }
  // Mural: vagas com inicio anterior a hoje NAO aparecem.
  async listarMural(): Promise<any[]> {
    const r = await this.query(`SELECT v.*, sv.chave as status_chave, sv.nome_exibicao as status_nome, sv.cor_hex as status_cor, sv.permite_editar, sv.permite_cancelar, sv.permite_candidatar FROM vagas v JOIN status_vaga sv ON sv.id = v.status_vaga_id WHERE sv.chave IN ('AGUARDANDO_CANDIDATURA','AGUARDANDO_ACEITE') AND (v.data_inicio IS NULL OR DATE(v.data_inicio) >= CURRENT_DATE) ORDER BY v.criado_em DESC`);
    return r.rows || [];
  }
  async buscarVagaComStatus(vagaId: number): Promise<any | null> {
    const r = await this.query(`SELECT v.*, sv.chave as status_chave, sv.permite_candidatar FROM vagas v JOIN status_vaga sv ON sv.id = v.status_vaga_id WHERE v.id = $1`, [vagaId]);
    return (r.rows || [])[0] || null;
  }
  // Troca o status_vaga_id da vaga pela chave (ex.: 'AGUARDANDO_ACEITE', 'CANCELADA').
  async atualizarStatusVaga(vagaId: number, chaveStatus: string): Promise<boolean> {
    const r = await this.query(`UPDATE vagas SET status_vaga_id = (SELECT id FROM status_vaga WHERE chave = $2) WHERE id = $1`, [vagaId, chaveStatus]);
    return (r.rowCount || 0) > 0;
  }
}
