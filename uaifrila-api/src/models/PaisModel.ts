import { BaseModel, Column } from './BaseModel';

export class PaisModel extends BaseModel {
  static tableName = 'paises';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID único do país' })
  id!: number;

  @Column({ name: 'nome', description: 'Nome do país: Brasil' })
  nome!: string;

  @Column({ name: 'sigla', description: 'Sigla: BRA, USA' })
  sigla!: string;

  @Column({ name: 'codigo_ibge', description: 'Código IBGE' })
  codigoIbge?: number;

  @Column({ name: 'ativo', type: 'boolean', description: 'Se país está ativo' })
  ativo: boolean = true;

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Data criação' })
  criadoEm?: Date;

  constructor(data?: any) { super(); this.fill(data); }
}
