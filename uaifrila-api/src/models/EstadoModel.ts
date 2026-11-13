import { BaseModel, Column, BelongsTo, HasMany } from "./BaseModel";
import { PaisModel } from "./PaisModel";
import { CidadeModel } from "./CidadeModel";
export class EstadoModel extends BaseModel {
  static tableName = "estados";
  @Column({ name: "id", primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: "pais_id" }) paisId!: number;
  @Column({ name: "nome" }) nome!: string;
  @Column({ name: "sigla" }) sigla!: string;
  @Column({ name: "codigo_ibge", type: "integer" }) codigoIbge?: number;
  @Column({ name: "regiao" }) regiao?: string;
  @Column({ name: "ativo", type: "boolean" }) ativo: boolean = true;
  @Column({ name: "criado_em", type: "timestamp" }) createdAt?: Date;
  @Column({ name: "atualizado_em", type: "timestamp" }) atualizadoEm?: Date;
  @BelongsTo(() => PaisModel, "pais_id", { description: "Pais" })
  pais?: PaisModel;
  @HasMany(() => CidadeModel, "estado_id", { description: "Cidades do estado" })
  cidades?: CidadeModel[];
  constructor(data?: any) {
    super();
    this.fill(data);
  }
}
