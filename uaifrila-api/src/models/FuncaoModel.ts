import { BaseModel, Column } from './BaseModel';
// Banco: funcoes(id,nome,ativa,criado_em,categoria_id -> categorias_funcao.id)
// Nao existe coluna `categoria` em funcoes.
export class FuncaoModel extends BaseModel {
  static tableName = 'funcoes';
  @Column({ name: 'id', primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: 'nome' }) nome!: string;
  @Column({ name: 'categoria_id' }) categoriaId?: number;
  @Column({ name: 'ativa', type: 'boolean' }) ativa: boolean = true;
  @Column({ name: 'criado_em', type: 'timestamp' }) criadoEm?: Date;
  constructor(data?: any) { super(); this.fill(data); }
}
