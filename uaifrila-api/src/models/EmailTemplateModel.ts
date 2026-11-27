import { BaseModel, Column, Hidden } from './BaseModel';

export class EmailTemplateModel extends BaseModel {
  static tableName = 'email_templates';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID template' })
  id!: number;

  @Column({ name: 'chave_uso', description: 'Chave: BOAS_VINDAS, RECUPERAR_SENHA, CODIGO_VERIFICACAO' })
  chaveUso!: string;

  @Column({ name: 'titulo_assunto', description: 'Assunto do e-mail' })
  tituloAssunto!: string;

  @Hidden('HTML sensível - não expor na API')
  @Column({ name: 'conteudo_corpo', type: 'text', hidden: true, description: 'HTML do corpo - SENSÍVEL, nunca expor' })
  conteudoCorpo!: string;

  @Column({ name: 'email_remetente', description: 'E-mail remetente' })
  emailRemetente: string = 'noreply@uaifrila.com.br';

  @Column({ name: 'nome_remetente', description: 'Nome remetente' })
  nomeRemetente: string = 'UAI FRILA';

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Data criação' })
  criadoEm?: Date;

  constructor(data?: any) { super(); this.fill(data); }
}
