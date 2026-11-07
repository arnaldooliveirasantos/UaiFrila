import { BaseModel, Column } from "./BaseModel";
export class VagaModel extends BaseModel {
  static tableName = "vagas";
  @Column({ name: "id", primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: "contratante_id", type: "int" }) contratanteId!: number;
  @Column({ name: "titulo" }) titulo!: string;
  @Column({ name: "descricao", type: "text" }) descricao?: string;
  @Column({ name: "funcao" }) funcao?: string;
  @Column({ name: "valor_hora", type: "decimal" }) valorHora: number = 20;
  @Column({ name: "valor_servico", type: "decimal" }) valorServico: number = 75;
  @Column({ name: "valor_transporte", type: "decimal" })
  valorTransporte: number = 0;
  @Column({ name: "total_freela", type: "decimal" }) totalFreela?: number;
  @Column({ name: "status_vaga_id", type: "int" }) statusVagaId: number = 1;
  @Column({ name: "data_inicio", type: "timestamp" }) dataInicio?: Date;
  @Column({ name: "data_fim", type: "timestamp" }) dataFim?: Date;
  @Column({ name: "criado_em", type: "timestamp" }) criadoEm?: Date;
  @Column({ name: "atualizado_em", type: "timestamp" }) atualizadoEm?: Date;
  constructor(data?: any) {
    super();
    this.fill(data);
  }
}
