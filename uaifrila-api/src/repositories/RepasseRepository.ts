import { BaseRepository } from './BaseRepository';
import { RepasseModel } from '../models/RepasseModel';
export class RepasseRepository extends BaseRepository<RepasseModel> {
  constructor() { super('repasses', RepasseModel); }
  async buscarPorTurno(trampoTurnoId: number): Promise<RepasseModel | null> {
    const r = await this.query(`SELECT * FROM repasses WHERE trampo_turno_id = $1 LIMIT 1`, [trampoTurnoId]);
    return (r.rows || [])[0] ? this.mapRow((r.rows || [])[0]) : null;
  }
  // Claim atômico: 1 UPDATE marca PROCESSANDO e devolve as linhas. 2 workers nunca pegam o mesmo.
  async reivindicarVencidos(limite = 50): Promise<RepasseModel[]> {
    const r = await this.query(`UPDATE repasses SET status = 'PROCESSANDO', atualizado_em = NOW() WHERE id IN (SELECT id FROM repasses WHERE (status = 'AGENDADO' AND agendar_para <= NOW()) OR (status = 'PROCESSANDO' AND atualizado_em < NOW() - INTERVAL '10 minutes') ORDER BY agendar_para ASC LIMIT $1) RETURNING *`, [limite]);
    return this.mapRows(r.rows || []);
  }
}
