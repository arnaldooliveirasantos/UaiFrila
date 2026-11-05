import { BaseModel, Column } from './BaseModel';

export class EmailStatusModel extends BaseModel {
  static tableName = 'email_status';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID status' })
  id!: number;

  @Column({ name: 'chave', description: 'Chave: ENVIADO, FALHA, PENDENTE' })
  chave!: string;

  @Column({ name: 'nome', description: 'Nome: Enviado, Falha' })
  nome!: string;

  constructor(data?: any) { super(); this.fill(data); }
}
