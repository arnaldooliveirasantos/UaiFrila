import { BaseModel, Column } from "./BaseModel";
export class PaisModel extends BaseModel {
  static tableName = "paises";
  @Column({ name: "id", primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: "nome" }) nome!: string;
  @Column({ name: "sigla" }) sigla!: string;
  @Column({ name: "codigo_ibge" }) codigoIbge?: number;
  @Column({ name: "ativo", type: "boolean" }) ativo: boolean = true;
  @Column({ name: "criado_em", type: "timestamp" }) createdAt?: Date;
  @Column({ name: "atualizado_em", type: "timestamp" }) atualizadoEm?: Date;
  constructor(data?: any) {
    super();
    this.fill(data);
  }
}
