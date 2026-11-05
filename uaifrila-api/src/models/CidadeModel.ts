import { BaseModel, Column, BelongsTo } from './BaseModel';
import { EstadoModel } from './EstadoModel';
import { PaisModel } from './PaisModel';

export class CidadeModel extends BaseModel {
  static tableName = 'cidades';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID único da cidade' })
  id!: number;

  @Column({ name: 'nome', description: 'Nome da cidade' })
  nome!: string;

  @Column({ name: 'estado', description: 'Sigla UF - ex: MG' })
  estado!: string;

  @Column({ name: 'codigo_ibge', description: 'Código IBGE' })
  codigoIbge?: string;

  @Column({ name: 'ativa', type: 'boolean', description: 'Se ativa para vagas' })
  ativa: boolean = true;

  @Column({ name: 'lat', type: 'double', description: 'Latitude' })
  lat?: number;

  @Column({ name: 'lng', type: 'double', description: 'Longitude' })
  lng?: number;

  @Column({ name: 'raio_km', type: 'integer', description: 'Raio KM' })
  raioKm: number = 20;

  @Column({ name: 'populacao', type: 'integer', description: 'População' })
  populacao?: number;

  @Column({ name: 'pais_id', description: 'FK paises.id' })
  paisId?: number;

  @Column({ name: 'estado_id', description: 'FK estados.id' })
  estadoId?: number;

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Data criação' })
  criadoEm?: Date;

  @Column({ name: 'atualizado_em', type: 'timestamp', description: 'Data atualização' })
  atualizadoEm?: Date;

  @BelongsTo(() => EstadoModel, 'estado_id', { description: 'Estado' })
  estadoObj?: EstadoModel;

  @BelongsTo(() => PaisModel, 'pais_id', { description: 'País' })
  pais?: PaisModel;

  constructor(data?: any) { super(); this.fill(data); }
}
