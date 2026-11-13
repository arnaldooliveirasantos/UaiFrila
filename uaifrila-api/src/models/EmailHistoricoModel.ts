import { BaseModel, Column, BelongsTo, Hidden } from './BaseModel';
import { UsuarioModel } from './UsuarioModel';
// Banco completo: 17 colunas. Este Model agora espelha todas.
export class EmailHistoricoModel extends BaseModel {
  static tableName = 'email_historico_disparos';
  @Column({ name: 'id', primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: 'template_id' }) templateId?: number;
  @Column({ name: 'usuario_id' }) usuarioId?: number;
  @Column({ name: 'email_destinatario', sensitive: true, mask: 'email' }) emailDestinatario!: string;
  @Column({ name: 'titulo_final' }) tituloFinal?: string;
  @Hidden('Conteudo com dados pessoais') @Column({ name: 'conteudo_final', type: 'text', hidden: true }) conteudoFinal?: string;
  @Hidden('Codigo verificacao - SENSIVEL') @Column({ name: 'codigo_verificacao', hidden: true, sensitive: true, mask: 'codigo' }) codigoVerificacao?: string;
  @Column({ name: 'status_id' }) statusId?: number;
  @Column({ name: 'dados_cadastro', type: 'jsonb' }) dadosCadastro?: any;
  @Column({ name: 'email_remetente' }) emailRemetente?: string;
  @Column({ name: 'tentativas', type: 'integer' }) tentativas: number = 0;
  @Column({ name: 'ultimo_erro', type: 'text' }) ultimoErro?: string;
  @Column({ name: 'expira_em', type: 'timestamp' }) expiraEm?: Date;
  @Column({ name: 'enviado_em', type: 'timestamp' }) enviadoEm?: Date;
  @Column({ name: 'ultima_tentativa', type: 'timestamp' }) ultimaTentativa?: Date;
  @Column({ name: 'criado_em', type: 'timestamp' }) criadoEm?: Date;
  @Column({ name: 'atualizado_em', type: 'timestamp' }) atualizadoEm?: Date;
  @BelongsTo(() => UsuarioModel, 'usuario_id', { description: 'Usuario' }) usuario?: UsuarioModel;
  constructor(data?: any) { super(); this.fill(data); }
}
