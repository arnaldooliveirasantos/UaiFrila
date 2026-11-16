import { BaseRepository } from "./BaseRepository";
import { VagaTurnoModel } from "../models/VagaTurnoModel";
export class VagaTurnoRepository extends BaseRepository<VagaTurnoModel> {
  constructor() { super("vaga_turnos", VagaTurnoModel); }
  async listarPorVaga(vagaId: number): Promise<VagaTurnoModel[]> {
    const r = await this.query(`SELECT * FROM vaga_turnos WHERE vaga_id = $1 ORDER BY data, hora_inicio, id`, [vagaId]);
    return this.mapRows(r.rows || []);
  }
  async buscarPorVagaEData(vagaId: number, data: string): Promise<VagaTurnoModel[]> {
    const r = await this.query(`SELECT * FROM vaga_turnos WHERE vaga_id = $1 AND data = $2 ORDER BY hora_inicio`, [vagaId, data]);
    return this.mapRows(r.rows || []);
  }
  // Substitui a agenda inteira da vaga (usado pela tela de agenda e pelo VagaService).
  async substituirAgenda(vagaId: number, turnos: any[]): Promise<VagaTurnoModel[]> {
    await this.query(`DELETE FROM vaga_turnos WHERE vaga_id = $1`, [vagaId]);
    const criados: VagaTurnoModel[] = [];
    for (const t of turnos) {
      const criado = await this.criarGenerico({ vaga_id: vagaId, data: t.data, hora_inicio: t.hora_inicio, hora_fim: t.hora_fim, atravessa_meia_noite: t.atravessa_meia_noite, duracao_minutos: t.duracao_minutos, valor_servico: t.valor_servico, ordem: t.ordem, status: t.status || "AGENDADO" });
      criados.push(criado);
    }
    return criados;
  }
}
