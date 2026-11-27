import { BaseModel, Column } from './BaseModel';
export class CategoriaFuncaoModel extends BaseModel {
  static tableName = 'categorias_funcao';
  @Column({ name: 'id', primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: 'nome' }) nome!: string;
  @Column({ name: 'icone' }) icone?: string;
  @Column({ name: 'ativa', type: 'boolean' }) ativa: boolean = true;
  @Column({ name: 'criado_em', type: 'timestamp' }) criadoEm?: Date;
  constructor(data?: any) { super(); this.fill(data); }
}
