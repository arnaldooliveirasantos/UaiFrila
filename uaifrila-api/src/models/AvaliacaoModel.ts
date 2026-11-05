import { BaseModel, Column, BelongsTo } from './BaseModel';
import { UsuarioModel } from './UsuarioModel';

export class AvaliacaoModel extends BaseModel {
  static tableName = 'avaliacoes';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID único' })
  id!: number;

  @Column({ name: 'trampo_id', description: 'FK trampos.id' })
  trampoId?: number;

  @Column({ name: 'avaliador_id', description: 'FK usuarios.id - quem avaliou' })
  avaliadorId?: number;

  @Column({ name: 'avaliado_id', description: 'FK usuarios.id - avaliado' })
  avaliadoId?: number;

  @Column({ name: 'nota', type: 'integer', description: 'Nota 1 a 5' })
  nota!: number;

  @Column({ name: 'comentario', type: 'text', description: 'Comentário' })
  comentario?: string;

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Data avaliação' })
  criadoEm?: Date;

  @BelongsTo(() => UsuarioModel, 'avaliador_id', { description: 'Avaliador' })
  avaliador?: UsuarioModel;

  @BelongsTo(() => UsuarioModel, 'avaliado_id', { description: 'Avaliado' })
  avaliado?: UsuarioModel;

  constructor(data?: any) { super(); this.fill(data); }
}
