import { BaseModel, Column } from "./BaseModel";
// Banco: 03-VAGA-TURNOS.sql -> vaga_turnos(id, vaga_id, data, hora_inicio, hora_fim,
// atravessa_meia_noite, duracao_minutos, valor_servico, ordem, status, criado_em)
// REGRA: o turno pertence ao dia em que COMECA. hora_fim <= hora_inicio =
// atravessa a meia-noite. Candidatura e TUDO-OU-NADA (todos os turnos);
// o valor por turno so serve para o acerto em caso de IMPREVISTO.
export class VagaTurnoModel extends BaseModel {
  static tableName = "vaga_turnos";
  @Column({ name: "id", primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: "vaga_id", type: "int" }) vagaId!: number;
  @Column({ name: "data", type: "date" }) data!: string;
  @Column({ name: "hora_inicio", type: "time" }) horaInicio!: string;
  @Column({ name: "hora_fim", type: "time" }) horaFim!: string;
  @Column({ name: "atravessa_meia_noite", type: "boolean" }) atravessaMeiaNoite: boolean = false;
  @Column({ name: "duracao_minutos", type: "int" }) duracaoMinutos!: number;
  @Column({ name: "valor_servico" }) valorServico: number = 0;
  @Column({ name: "ordem", type: "int" }) ordem: number = 1;
  @Column({ name: "status" }) status: string = "AGENDADO";
  @Column({ name: "criado_em", type: "timestamp" }) criadoEm?: Date;
  constructor(data?: any) { super(); this.fill(data); }
}
