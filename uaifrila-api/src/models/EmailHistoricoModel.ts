import { BaseModel, Column, BelongsTo, Hidden } from './BaseModel';
import { UsuarioModel } from './UsuarioModel';

export class EmailHistoricoModel extends BaseModel {
  static tableName = 'email_historico_disparos';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID histórico' })
  id!: number;

  @Column({ name: 'usuario_id', description: 'FK usuarios.id' })
  usuarioId?: number;

  @Column({ name: 'email_destinatario', description: 'E-mail destinatário', sensitive: true, mask: 'email' })
  emailDestinatario!: string;

  @Hidden('Conteúdo com dados pessoais')
  @Column({ name: 'conteudo_final', type: 'text', hidden: true, description: 'Conteúdo final' })
  conteudoFinal?: string;

  @Hidden('Código verificação - SENSÍVEL')
  @Column({ name: 'codigo_verificacao', hidden: true, sensitive: true, mask: 'codigo', description: 'Código 6 dígitos - SENSÍVEL - mascarado ao sair da API' })
  codigoVerificacao?: string;

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Data criação' })
  criadoEm?: Date;

  @BelongsTo(() => UsuarioModel, 'usuario_id', { description: 'Usuário' })
  usuario?: UsuarioModel;

  constructor(data?: any) { super(); this.fill(data); }
}
