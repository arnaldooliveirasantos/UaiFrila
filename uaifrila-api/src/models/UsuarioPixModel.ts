import { BaseModel, Column } from './BaseModel';

// Tabela usuario_pix - dados PIX do usuario para receber os trampos realizados.
// 1 chave ativa por usuario (as antigas ficam ativo=false, historico preservado).
// ATENCAO toPublic(): o BaseModel.toJSON() devolve camelCase (tipoChave, chavePix...),
// mas o front (DadosPix.tsx) le snake_case (tipo_chave, chave_pix...).
// Por isso o toPublic() abaixo devolve AS DUAS chaves, para nao quebrar nenhum consumidor.
export class UsuarioPixModel extends BaseModel {
  static tableName = 'usuario_pix';
  @Column({ name: 'id', primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: 'usuario_id', type: 'int' }) usuarioId!: number;
  @Column({ name: 'tipo_chave' }) tipoChave!: string; // CPF | CNPJ | EMAIL | TELEFONE | ALEATORIA
  @Column({ name: 'chave_pix' }) chavePix!: string;
  @Column({ name: 'nome_titular' }) nomeTitular!: string;
  @Column({ name: 'cpf_cnpj_titular' }) cpfCnpjTitular?: string;
  @Column({ name: 'banco' }) banco?: string;
  @Column({ name: 'agencia' }) agencia?: string;
  @Column({ name: 'conta' }) conta?: string;
  @Column({ name: 'tipo_conta' }) tipoConta?: string; // CORRENTE | POUPANCA
  @Column({ name: 'ativo', type: 'boolean' }) ativo: boolean = true;
  @Column({ name: 'criado_em', type: 'timestamp' }) criadoEm?: Date;
  @Column({ name: 'atualizado_em', type: 'timestamp' }) atualizadoEm?: Date;
  constructor(data?: any) { super(); this.fill(data); }
  toPublic(_viewerId?: number, _isAdmin?: boolean): any {
    const base: any = super.toPublic(_viewerId, _isAdmin);
    // Emite snake_case + camelCase (front usa snake_case, outros modulos podem usar camelCase)
    return {
      ...base,
      id: this.id,
      usuario_id: this.usuarioId, usuarioId: this.usuarioId,
      tipo_chave: this.tipoChave, tipoChave: this.tipoChave,
      chave_pix: this.chavePix, chavePix: this.chavePix,
      nome_titular: this.nomeTitular, nomeTitular: this.nomeTitular,
      cpf_cnpj_titular: this.cpfCnpjTitular ?? null, cpfCnpjTitular: this.cpfCnpjTitular ?? null,
      banco: this.banco ?? null,
      agencia: this.agencia ?? null,
      conta: this.conta ?? null,
      tipo_conta: this.tipoConta ?? null, tipoConta: this.tipoConta ?? null,
      ativo: this.ativo,
      criado_em: this.criadoEm ?? null, criadoEm: this.criadoEm ?? null,
      atualizado_em: this.atualizadoEm ?? null, atualizadoEm: this.atualizadoEm ?? null,
    };
  }
}
