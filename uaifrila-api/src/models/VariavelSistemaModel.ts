import { BaseModel, Column } from './BaseModel';

// Tabela EXISTENTE variaveis_sistema:
// id, chave, valor (text), valor_numerico (numeric), categoria, descricao, atualizado_em
// NÃO tem: grupo, tipo, ativo, editavel
export class VariavelSistemaModel extends BaseModel {
  static tableName = 'variaveis_sistema';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ name: 'chave' })
  chave!: string;

  @Column({ name: 'valor' })
  valor!: string;

  @Column({ name: 'valor_numerico', type: 'decimal' })
  valorNumerico?: number;

  @Column({ name: 'categoria' })
  categoria?: string;

  @Column({ name: 'descricao', type: 'text' })
  descricao?: string;

  @Column({ name: 'atualizado_em', type: 'timestamp' })
  atualizadoEm?: Date;

  constructor(data?: any) { super(); this.fill(data); }
}
