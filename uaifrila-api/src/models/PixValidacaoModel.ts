import { BaseModel, Column } from './BaseModel';
// pix_validacoes: token de e-mail para confirmar Pix em nome de terceiro.
export class PixValidacaoModel extends BaseModel {
  static tableName = 'pix_validacoes';
  @Column({ name: 'id', primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: 'usuario_id', type: 'int' }) usuarioId!: number;
  @Column({ name: 'tipo_chave' }) tipoChave!: string;
  @Column({ name: 'chave_pix' }) chavePix!: string;
  @Column({ name: 'nome_titular' }) nomeTitular!: string;
  @Column({ name: 'cpf_cnpj_titular' }) cpfCnpjTitular?: string;
  @Column({ name: 'banco' }) banco?: string;
  @Column({ name: 'agencia' }) agencia?: string;
  @Column({ name: 'conta' }) conta?: string;
  @Column({ name: 'tipo_conta' }) tipoConta?: string;
  @Column({ name: 'token', hidden: true }) token!: string;
  @Column({ name: 'status' }) status: string = 'PENDENTE';
  @Column({ name: 'expira_em', type: 'timestamp' }) expiraEm?: Date;
  @Column({ name: 'criado_em', type: 'timestamp' }) criadoEm?: Date;
  @Column({ name: 'atualizado_em', type: 'timestamp' }) atualizadoEm?: Date;
  constructor(data?: any) { super(); this.fill(data); }
}
