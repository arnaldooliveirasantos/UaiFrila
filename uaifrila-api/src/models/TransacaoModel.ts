import { BaseModel, Column, BelongsTo } from './BaseModel';
import { VagaModel } from './VagaModel';
import { UsuarioModel } from './UsuarioModel';
import { CidadeModel } from './CidadeModel';
// Banco completo (27 colunas). Transacao e a fonte unica de pagamento/escrow (item 11 B: pagamentos dropado).
export class TransacaoModel extends BaseModel {
  static tableName = 'transacoes';
  @Column({ name: 'id', primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: 'codigo' }) codigo!: string;
  @Column({ name: 'vaga_id' }) vagaId?: number;
  @Column({ name: 'trampo_id' }) trampoId?: number;
  @Column({ name: 'freela_id' }) freelaId!: number;
  @Column({ name: 'contratante_id' }) contratanteId!: number;
  @Column({ name: 'cidade_id' }) cidadeId?: number;
  @Column({ name: 'cidade_nome' }) cidadeNome?: string;
  @Column({ name: 'usuario_id' }) usuarioId?: number;
  @Column({ name: 'valor_base', type: 'decimal' }) valorBase: number = 0;
  @Column({ name: 'taxa_percentual', type: 'decimal' }) taxaPercentual?: number;
  @Column({ name: 'taxa_valor', type: 'decimal' }) taxaValor?: number;
  @Column({ name: 'ajuda_custo', type: 'decimal' }) ajudaCusto?: number;
  @Column({ name: 'valor_total_contratante', type: 'decimal' }) valorTotalContratante!: number;
  @Column({ name: 'valor_liquido_freela', type: 'decimal' }) valorLiquidoFreela!: number;
  @Column({ name: 'status' }) status: string = 'AGUARDANDO_PAGAMENTO';
  @Column({ name: 'metodo_pagamento' }) metodoPagamento?: string;
  @Column({ name: 'comprovante_url' }) comprovanteUrl?: string;
  @Column({ name: 'observacoes', type: 'text' }) observacoes?: string;
  @Column({ name: 'motivo_cancelamento', type: 'text' }) motivoCancelamento?: string;
  @Column({ name: 'data_inicio', type: 'timestamp' }) dataInicio?: Date;
  @Column({ name: 'data_fim_prevista', type: 'timestamp' }) dataFimPrevista?: Date;
  @Column({ name: 'data_fim_real', type: 'timestamp' }) dataFimReal?: Date;
  @Column({ name: 'data_pagamento', type: 'timestamp' }) dataPagamento?: Date;
  @Column({ name: 'data_liberacao', type: 'timestamp' }) dataLiberacao?: Date;
  @Column({ name: 'expira_em', type: 'timestamp' }) expiraEm?: Date;
  @Column({ name: 'criado_em', type: 'timestamp' }) criadoEm?: Date;
  @Column({ name: 'atualizado_em', type: 'timestamp' }) atualizadoEm?: Date;
  @BelongsTo(() => VagaModel, 'vaga_id', { description: 'Vaga' }) vaga?: VagaModel;
  @BelongsTo(() => UsuarioModel, 'freela_id', { description: 'Freela' }) freela?: UsuarioModel;
  @BelongsTo(() => CidadeModel, 'cidade_id', { description: 'Cidade' }) cidade?: CidadeModel;
  constructor(data?: any) { super(); this.fill(data); }
}
