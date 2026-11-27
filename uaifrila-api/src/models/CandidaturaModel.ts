import { BaseModel, Column, BelongsTo } from './BaseModel';
import { VagaModel } from './VagaModel';
import { UsuarioModel } from './UsuarioModel';

export class CandidaturaModel extends BaseModel {
  static tableName = 'candidaturas';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID único da candidatura' })
  id!: number;

  @Column({ name: 'vaga_id', description: 'FK vagas.id' })
  vagaId!: number;

  @Column({ name: 'usuario_id', description: 'FK usuarios.id - quem se candidatou' })
  usuarioId!: number;

  @Column({ name: 'freela_id', description: 'FK usuarios.id - alias' })
  freelaId?: number;

  @Column({ name: 'status', description: 'PENDENTE, ACEITA, REJEITADA' })
  status: string = 'PENDENTE';

  @Column({ name: 'mensagem', type: 'text', description: 'Mensagem' })
  mensagem?: string;

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Data candidatura' })
  criadoEm?: Date;

  @Column({ name: 'atualizado_em', type: 'timestamp', description: 'Atualização' })
  atualizadoEm?: Date;

  @BelongsTo(() => VagaModel, 'vaga_id', { description: 'Vaga' })
  vaga?: VagaModel;

  @BelongsTo(() => UsuarioModel, 'usuario_id', { description: 'Usuário' })
  usuario?: UsuarioModel;

  constructor(data?: any) { super(); this.fill(data); }
}
