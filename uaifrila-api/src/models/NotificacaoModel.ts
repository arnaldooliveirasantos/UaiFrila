import { BaseModel, Column } from './BaseModel';
export class NotificacaoModel extends BaseModel {
  static tableName = 'notificacoes';
  @Column({ name: 'id', primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: 'usuario_id', type: 'int' }) usuarioId!: number;
  @Column({ name: 'tipo' }) tipo!: string;
  @Column({ name: 'titulo' }) titulo!: string;
  @Column({ name: 'mensagem', type: 'text' }) mensagem!: string;
  @Column({ name: 'vaga_id', type: 'int' }) vagaId?: number;
  @Column({ name: 'candidatura_id', type: 'int' }) candidaturaId?: number;
  @Column({ name: 'lida', type: 'boolean' }) lida: boolean = false;
  @Column({ name: 'criado_em', type: 'timestamp' }) criadoEm?: Date;
  constructor(data?: any) { super(); this.fill(data); }
}
