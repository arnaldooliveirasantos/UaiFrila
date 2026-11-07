import { BaseModel, Column } from "./BaseModel";
export class StatusVagaModel extends BaseModel {
  static tableName = "status_vaga";
  @Column({ name: "id", primaryKey: true, autoIncrement: true })
  id!: number;
  @Column({ name: "chave" })
  chave!: string;
  @Column({ name: "nome_exibicao" })
  nomeExibicao!: string;
  @Column({ name: "descricao", type: "text" })
  descricao?: string;
  @Column({ name: "cor_hex" })
  corHex?: string;
  @Column({ name: "ordem", type: "int" })
  ordem: number = 0;
  @Column({ name: "permite_editar", type: "boolean" })
  permiteEditar: boolean = true;
  @Column({ name: "permite_cancelar", type: "boolean" })
  permiteCancelar: boolean = true;
  @Column({ name: "permite_candidatar", type: "boolean" })
  permiteCandidatar: boolean = true;
  @Column({ name: "ativo", type: "boolean" })
  ativo: boolean = true;
  @Column({ name: "criado_em", type: "timestamp" })
  criadoEm?: Date;
  constructor(data?: any) {
    super();
    this.fill(data);
  }
}
