import { BaseModel, Column } from './BaseModel';
// provedores_pagamento. Segredos ficam criptografados (nunca em texto puro, nunca no JSON).
export class ProvedorPagamentoModel extends BaseModel {
  static tableName = 'provedores_pagamento';
  @Column({ name: 'id', primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: 'provedor' }) provedor!: string;
  @Column({ name: 'ativo' }) ativo: boolean = false;
  @Column({ name: 'ambiente' }) ambiente: string = 'sandbox';
  @Column({ name: 'taxa_pix_percentual', type: 'decimal' }) taxaPixPercentual: number = 1;
  @Column({ name: 'taxa_cartao_percentual', type: 'decimal' }) taxaCartaoPercentual: number = 4;
  @Column({ name: 'client_id' }) clientId?: string;
  @Column({ name: 'client_secret_criptografado', hidden: true }) clientSecretCriptografado?: string;
  @Column({ name: 'webhook_secret_criptografado', hidden: true }) webhookSecretCriptografado?: string;
  @Column({ name: 'pix_chave_recebimento' }) pixChaveRecebimento?: string;
  @Column({ name: 'config_json' }) configJson?: any;
  @Column({ name: 'criado_em', type: 'timestamp' }) criadoEm?: Date;
  @Column({ name: 'atualizado_em', type: 'timestamp' }) atualizadoEm?: Date;
  constructor(data?: any) { super(); this.fill(data); }
  toPublicAdmin(): any {
    const j: any = this.toJSON();
    delete j.clientSecretCriptografado; delete j.webhookSecretCriptografado;
    j.tem_client_secret = !!this.clientSecretCriptografado;
    j.tem_webhook_secret = !!this.webhookSecretCriptografado;
    return j;
  }
}
