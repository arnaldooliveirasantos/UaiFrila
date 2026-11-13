import { BaseModel, Column, BelongsTo } from "./BaseModel";
import { EstadoModel } from "./EstadoModel";
import { PaisModel } from "./PaisModel";
// Banco: cidades(id,pais_id,nome,estado_id,ativa,lat,lng,raio_km,regiao,codigo_ibge,populacao,status_expansao,demanda_score,criado_em,atualizado_em)
// Nao existe coluna `estado` em cidades. Sigla vem por JOIN em estados (ver CidadeRepository).
export class CidadeModel extends BaseModel {
  static tableName = "cidades";
  @Column({ name: "id", primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: "nome" }) nome!: string;
  @Column({ name: "codigo_ibge" }) codigoIbge?: string;
  @Column({ name: "ativa", type: "boolean" }) ativa: boolean = true;
  @Column({ name: "lat", type: "double" }) lat?: number;
  @Column({ name: "lng", type: "double" }) lng?: number;
  @Column({ name: "raio_km", type: "integer" }) raioKm: number = 20;
  @Column({ name: "regiao" }) regiao?: string;
  @Column({ name: "populacao", type: "integer" }) populacao?: number;
  @Column({ name: "status_expansao" }) statusExpansao?: string;
  @Column({ name: "demanda_score", type: "integer" }) demandaScore?: number;
  @Column({ name: "estado_id" }) estadoId?: number;
  @Column({ name: "criado_em", type: "timestamp" }) createdAt?: Date;
  @Column({ name: "atualizado_em", type: "timestamp" }) atualizadoEm?: Date;
  @BelongsTo(() => EstadoModel, "estado_id", { description: "Estado" })
  estadoObj?: EstadoModel;
  constructor(data?: any) {
    super();
    this.fill(data);
  }
}
