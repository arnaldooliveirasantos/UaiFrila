import { BaseModel, Column } from './BaseModel';

export class FuncaoModel extends BaseModel {
  static tableName = 'funcoes';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID único da função' })
  id!: number;

  @Column({ name: 'nome', description: 'Nome: Garçom, Cozinheiro, Bartender' })
  nome!: string;

  @Column({ name: 'categoria', description: 'Categoria: Atendimento, Cozinha' })
  categoria?: string;

  @Column({ name: 'ativa', type: 'boolean', description: 'Se ativa' })
  ativa: boolean = true;

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Data criação' })
  criadoEm?: Date;

  constructor(data?: any) { super(); this.fill(data); }
}
