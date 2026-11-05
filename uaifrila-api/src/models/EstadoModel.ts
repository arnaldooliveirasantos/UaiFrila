import { BaseModel, Column, BelongsTo, HasMany } from './BaseModel';
import { PaisModel } from './PaisModel';
import { CidadeModel } from './CidadeModel';

export class EstadoModel extends BaseModel {
  static tableName = 'estados';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID único do estado' })
  id!: number;

  @Column({ name: 'pais_id', description: 'FK paises.id' })
  paisId!: number;

  @Column({ name: 'nome', description: 'Nome: Minas Gerais' })
  nome!: string;

  @Column({ name: 'sigla', description: 'Sigla UF: MG, SP, RJ' })
  sigla!: string;

  @Column({ name: 'codigo_ibge', type: 'integer', description: 'Código IBGE' })
  codigoIbge?: number;

  @Column({ name: 'regiao', description: 'Região: Sudeste' })
  regiao?: string;

  @Column({ name: 'ativo', type: 'boolean', description: 'Se ativo' })
  ativo: boolean = true;

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Data criação' })
  criadoEm?: Date;

  @BelongsTo(() => PaisModel, 'pais_id', { description: 'País' })
  pais?: PaisModel;

  @HasMany(() => CidadeModel, 'estado_id', { description: 'Cidades do estado' })
  cidades?: CidadeModel[];

  constructor(data?: any) { super(); this.fill(data); }
}
