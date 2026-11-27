import { BaseModel, Column } from './BaseModel';

export class TipoEnderecoModel extends BaseModel {
  static tableName = 'tipos_endereco';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID único' })
  id!: number;

  @Column({ name: 'chave', description: 'Chave: RESIDENCIAL, COMERCIAL, EVENTO' })
  chave!: string;

  @Column({ name: 'nome', description: 'Nome: Residencial' })
  nome!: string;

  @Column({ name: 'descricao', type: 'text', description: 'Descrição' })
  descricao?: string;

  @Column({ name: 'icone', description: 'Ícone: home, building' })
  icone?: string;

  @Column({ name: 'ativo', type: 'boolean', description: 'Se ativo' })
  ativo: boolean = true;

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Data criação' })
  criadoEm?: Date;

  constructor(data?: any) { super(); this.fill(data); }
}
