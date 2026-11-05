import { BaseModel, Column, BelongsTo, HasMany } from './BaseModel';
import { UsuarioModel } from './UsuarioModel';
import { EnderecoVagaModel } from './EnderecoVagaModel';

export class VagaModel extends BaseModel {
  static tableName = 'vagas';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID único da vaga' })
  id!: number;

  @Column({ name: 'contratante_id', description: 'FK usuarios.id - quem publicou' })
  contratanteId!: number;

  @Column({ name: 'titulo', description: 'Título da vaga' })
  titulo!: string;

  @Column({ name: 'descricao', type: 'text', description: 'Descrição' })
  descricao?: string;

  @Column({ name: 'funcao', description: 'Função: Garçom' })
  funcao?: string;

  @Column({ name: 'valor_hora', type: 'numeric', description: 'Valor hora' })
  valorHora!: number;

  @Column({ name: 'valor_servico', type: 'numeric', description: 'Valor serviço' })
  valorServico?: number;

  @Column({ name: 'valor_transporte', type: 'numeric', description: 'Ajuda transporte' })
  valorTransporte?: number;

  @Column({ name: 'total_freela', type: 'numeric', description: 'Total freela' })
  totalFreela?: number;

  @Column({ name: 'status', description: 'Status: ABERTA, FECHADA' })
  status: string = 'ABERTA';

  @Column({ name: 'data_inicio', type: 'timestamp', description: 'Início' })
  dataInicio!: Date;

  @Column({ name: 'data_fim', type: 'timestamp', description: 'Fim' })
  dataFim!: Date;

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Criado em' })
  criadoEm?: Date;

  @Column({ name: 'atualizado_em', type: 'timestamp', description: 'Atualizado em' })
  atualizadoEm?: Date;

  @BelongsTo(() => UsuarioModel, 'contratante_id', { description: 'Contratante' })
  contratante?: UsuarioModel;

  @HasMany(() => EnderecoVagaModel, 'vaga_id', { description: 'Endereços da vaga' })
  enderecosVaga?: EnderecoVagaModel[];

  constructor(data?: any) { super(); this.fill(data); }
}
