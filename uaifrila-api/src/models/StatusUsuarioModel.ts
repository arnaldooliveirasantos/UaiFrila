import { BaseModel, Column } from './BaseModel';

export class StatusUsuarioModel extends BaseModel {
  static tableName = 'status_usuario';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID único do status' })
  id!: number;

  @Column({ name: 'chave', description: 'Chave: ATIVO, PENDENTE, BLOQUEADO' })
  chave!: string;

  @Column({ name: 'nome_exibicao', description: 'Nome para frontend' })
  nomeExibicao!: string;

  @Column({ name: 'descricao', type: 'text', description: 'Descrição' })
  descricao?: string;

  @Column({ name: 'cor_hex', description: 'Cor hex para badge' })
  corHex?: string;

  @Column({ name: 'ordem', type: 'integer', description: 'Ordem exibição' })
  ordem: number = 0;

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Data criação' })
  criadoEm?: Date;

  constructor(data?: any) { super(); this.fill(data); }
}
