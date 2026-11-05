import { BaseModel, Column, BelongsTo } from './BaseModel';
import { UsuarioModel } from './UsuarioModel';

export class ExpansaoCidadeModel extends BaseModel {
  static tableName = 'expansao_cidades';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID solicitação expansão' })
  id!: number;

  @Column({ name: 'cidade_nome', description: 'Nome cidade solicitada: Patos de Minas' })
  cidadeNome!: string;

  @Column({ name: 'estado_sigla', description: 'Sigla UF: MG' })
  estadoSigla!: string;

  @Column({ name: 'pais_sigla', description: 'Sigla país: BRA' })
  paisSigla: string = 'BRA';

  @Column({ name: 'status', description: 'SOLICITADA, EM_ANALISE, APROVADA, REJEITADA, ATIVA' })
  status: string = 'SOLICITADA';

  @Column({ name: 'prioridade', type: 'integer', description: 'Prioridade 0-100' })
  prioridade: number = 0;

  @Column({ name: 'solicitado_por', description: 'FK usuarios.id - quem solicitou' })
  solicitadoPor?: number;

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Data criação' })
  criadoEm?: Date;

  @Column({ name: 'atualizado_em', type: 'timestamp', description: 'Data atualização' })
  atualizadoEm?: Date;

  @BelongsTo(() => UsuarioModel, 'solicitado_por', { description: 'Solicitante' })
  solicitante?: UsuarioModel;

  constructor(data?: any) { super(); this.fill(data); }
}
