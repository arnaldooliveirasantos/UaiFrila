import { BaseModel, Column } from "./BaseModel";
// Banco: 03-VAGA-TURNOS.sql -> trampo_turnos(id, trampo_id, vaga_turno_id, status,
// checkin_em, checkout_em, valor_servico, criado_em, atualizado_em)
// REGRA: um item por turno do trampo. Valor por turno serve SO para o acerto
// em caso de IMPREVISTO: turnos CONCLUIDOS sao pagos, restantes CANCELADO.
export class TrampoTurnoModel extends BaseModel {
  static tableName = "trampo_turnos";
  @Column({ name: "id", primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: "trampo_id", type: "int" }) trampoId!: number;
  @Column({ name: "vaga_turno_id", type: "int" }) vagaTurnoId!: number;
  @Column({ name: "status" }) status: string = "AGENDADO";
  @Column({ name: "checkin_em", type: "timestamp" }) checkinEm?: Date;
  @Column({ name: "checkout_em", type: "timestamp" }) checkoutEm?: Date;
  @Column({ name: "valor_servico" }) valorServico: number = 0;
  @Column({ name: "criado_em", type: "timestamp" }) criadoEm?: Date;
  @Column({ name: "atualizado_em", type: "timestamp" }) atualizadoEm?: Date;
  constructor(data?: any) { super(); this.fill(data); }
}
