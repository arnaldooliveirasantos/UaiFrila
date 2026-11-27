import { BaseModel, Column } from './BaseModel';
// Tabela variaveis_sistema (SQL 00): id, chave, valor, valor_numerico, tipo, descricao, categoria, editavel, criado_em, atualizado_em
// CORRIGIDO: model anterior nao tinha tipo/editavel/criado_em — divergia do banco.
export class VariavelSistemaModel extends BaseModel {
  static tableName = 'variaveis_sistema';
  @Column({ name: 'id', primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: 'chave' }) chave!: string;
  @Column({ name: 'valor' }) valor!: string;
  @Column({ name: 'valor_numerico', type: 'decimal' }) valorNumerico?: number;
  @Column({ name: 'tipo' }) tipo?: string;
  @Column({ name: 'categoria' }) categoria?: string;
  @Column({ name: 'descricao', type: 'text' }) descricao?: string;
  @Column({ name: 'editavel' }) editavel?: boolean;
  @Column({ name: 'criado_em', type: 'timestamp' }) criadoEm?: Date;
  @Column({ name: 'atualizado_em', type: 'timestamp' }) atualizadoEm?: Date;
  constructor(data?: any) { super(); this.fill(data); }
}
