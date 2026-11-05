import { BaseModel, Column } from './BaseModel';

export class VariavelSistemaModel extends BaseModel {
  static tableName = 'variaveis_sistema';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID variável' })
  id!: number;

  @Column({ name: 'chave', description: 'Chave: TAXA_PIX_PERCENTUAL, COMISSAO' })
  chave!: string;

  @Column({ name: 'valor', description: 'Valor string' })
  valor!: string;

  @Column({ name: 'valor_numerico', type: 'decimal', description: 'Valor numérico' })
  valorNumerico?: number;

  @Column({ name: 'descricao', type: 'text', description: 'Descrição para admin' })
  descricao?: string;

  @Column({ name: 'categoria', description: 'Categoria: geral, pagamento' })
  categoria: string = 'geral';

  @Column({ name: 'editavel', type: 'boolean', description: 'Se editável' })
  editavel: boolean = true;

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Data criação' })
  criadoEm?: Date;

  @Column({ name: 'atualizado_em', type: 'timestamp', description: 'Atualização' })
  atualizadoEm?: Date;

  constructor(data?: any) { super(); this.fill(data); }
}
