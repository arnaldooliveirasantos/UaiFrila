import { BaseModel, Column, BelongsTo } from './BaseModel';
import { VagaModel } from './VagaModel';
import { UsuarioModel } from './UsuarioModel';
import { CidadeModel } from './CidadeModel';

export class TransacaoModel extends BaseModel {
  static tableName = 'transacoes';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID único' })
  id!: number;

  @Column({ name: 'codigo', description: 'Código: TRX-20241027-000001' })
  codigo!: string;

  @Column({ name: 'vaga_id', description: 'FK vagas.id' })
  vagaId?: number;

  @Column({ name: 'trampo_id', description: 'FK trampos.id' })
  trampoId?: number;

  @Column({ name: 'freela_id', description: 'FK usuarios.id freela' })
  freelaId!: number;

  @Column({ name: 'contratante_id', description: 'FK usuarios.id contratante' })
  contratanteId!: number;

  @Column({ name: 'cidade_id', description: 'FK cidades.id' })
  cidadeId?: number;

  @Column({ name: 'valor_base', type: 'decimal', description: 'Valor base' })
  valorBase: number = 0;

  @Column({ name: 'valor_total_contratante', type: 'decimal', description: 'Total contratante' })
  valorTotalContratante!: number;

  @Column({ name: 'valor_liquido_freela', type: 'decimal', description: 'Líquido freela' })
  valorLiquidoFreela!: number;

  @Column({ name: 'status', description: 'AGUARDANDO_PAGAMENTO, CONCLUIDA' })
  status: string = 'AGUARDANDO_PAGAMENTO';

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Criado em' })
  criadoEm?: Date;

  @Column({ name: 'atualizado_em', type: 'timestamp', description: 'Atualizado em' })
  atualizadoEm?: Date;

  @BelongsTo(() => VagaModel, 'vaga_id', { description: 'Vaga' })
  vaga?: VagaModel;

  @BelongsTo(() => UsuarioModel, 'freela_id', { description: 'Freela' })
  freela?: UsuarioModel;

  @BelongsTo(() => CidadeModel, 'cidade_id', { description: 'Cidade' })
  cidade?: CidadeModel;

  constructor(data?: any) { super(); this.fill(data); }
}
