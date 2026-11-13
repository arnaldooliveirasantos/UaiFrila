import { BaseModel, Column } from "./BaseModel";
// Banco: expansao_cidades(id,cidade_nome,estado_sigla,populacao,demanda_solicitacoes,demanda_vagas,status,prioridade,motivo,criado_em,atualizado_em)
// Nao existem pais_sigla / solicitado_por no banco.
export class ExpansaoCidadeModel extends BaseModel {
  static tableName = "expansao_cidades";
  @Column({ name: "id", primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: "cidade_nome" }) cidadeNome!: string;
  @Column({ name: "estado_sigla" }) estadoSigla!: string;
  @Column({ name: "populacao", type: "integer" }) populacao?: number;
  @Column({ name: "demanda_solicitacoes", type: "integer" })
  demandaSolicitacoes?: number;
  @Column({ name: "demanda_vagas", type: "integer" }) demandaVagas?: number;
  @Column({ name: "status" }) status: string = "SOLICITADA";
  @Column({ name: "prioridade", type: "integer" }) prioridade: number = 0;
  @Column({ name: "motivo", type: "text" }) motivo?: string;
  @Column({ name: "criado_em", type: "timestamp" }) createdAt?: Date;
  @Column({ name: "atualizado_em", type: "timestamp" }) atualizadoEm?: Date;
  constructor(data?: any) {
    super();
    this.fill(data);
  }
}
