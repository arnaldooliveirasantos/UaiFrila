import { BaseRepository } from "./BaseRepository";
import { TrampoTurnoModel } from "../models/TrampoTurnoModel";
export class TrampoTurnoRepository extends BaseRepository<TrampoTurnoModel> {
  constructor() { super("trampo_turnos", TrampoTurnoModel); }
  async listarPorTrampo(trampoId: number): Promise<TrampoTurnoModel[]> {
    const r = await this.query(`SELECT tt.*, vt.data, vt.hora_inicio, vt.hora_fim, vt.atravessa_meia_noite, vt.duracao_minutos FROM trampo_turnos tt JOIN vaga_turnos vt ON vt.id = tt.vaga_turno_id WHERE tt.trampo_id = $1 ORDER BY vt.data, vt.hora_inicio`, [trampoId]);
    return this.mapRows(r.rows || []);
  }
  async buscarPorTrampoETurno(trampoId: number, vagaTurnoId: number): Promise<TrampoTurnoModel | null> {
    const r = await this.query(`SELECT * FROM trampo_turnos WHERE trampo_id = $1 AND vaga_turno_id = $2 LIMIT 1`, [trampoId, vagaTurnoId]);
    return (r.rows || [])[0] ? this.mapRow(r.rows[0]) : null;
  }
}
