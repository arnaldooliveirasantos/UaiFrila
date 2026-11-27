import { BaseModel, Column } from './BaseModel';
// pagamentos: 1 cobrança por candidatura aceita. Valores em CENTAVOS (inteiro).
export class PagamentoModel extends BaseModel {
  static tableName = 'pagamentos';
  @Column({ name: 'id', primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: 'candidatura_id', type: 'int' }) candidaturaId!: number;
  @Column({ name: 'vaga_id', type: 'int' }) vagaId!: number;
  @Column({ name: 'contratante_id', type: 'int' }) contratanteId!: number;
  @Column({ name: 'freela_id', type: 'int' }) freelaId!: number;
  @Column({ name: 'provedor' }) provedor!: string;
  @Column({ name: 'provedor_pagamento_id' }) provedorPagamentoId?: string;
  @Column({ name: 'metodo' }) metodo: string = 'pix';
  @Column({ name: 'status' }) status: string = 'AGUARDANDO_PAGAMENTO';
  @Column({ name: 'chave_idempotencia' }) chaveIdempotencia!: string;
  @Column({ name: 'valor_servico_centavos', type: 'int' }) valorServicoCentavos: number = 0;
  @Column({ name: 'valor_transporte_centavos', type: 'int' }) valorTransporteCentavos: number = 0;
  @Column({ name: 'comissao_centavos', type: 'int' }) comissaoCentavos: number = 0;
  @Column({ name: 'taxa_centavos', type: 'int' }) taxaCentavos: number = 0;
  @Column({ name: 'total_centavos', type: 'int' }) totalCentavos: number = 0;
  @Column({ name: 'qr_code' }) qrCode?: string;
  @Column({ name: 'qr_code_url' }) qrCodeUrl?: string;
  @Column({ name: 'checkout_url' }) checkoutUrl?: string;
  @Column({ name: 'expira_em', type: 'timestamp' }) expiraEm?: Date;
  @Column({ name: 'notificacao_60min_enviada' }) notificacao60minEnviada: boolean = false;
  @Column({ name: 'pago_em', type: 'timestamp' }) pagoEm?: Date;
  @Column({ name: 'reembolsado_em', type: 'timestamp' }) reembolsadoEm?: Date;
  @Column({ name: 'erro' }) erro?: string;
  @Column({ name: 'tentativas', type: 'int' }) tentativas: number = 0;
  @Column({ name: 'criado_em', type: 'timestamp' }) criadoEm?: Date;
  @Column({ name: 'atualizado_em', type: 'timestamp' }) atualizadoEm?: Date;
  constructor(data?: any) { super(); this.fill(data); }
  // Visão NÃO-admin: só totais. Comissão e taxa NUNCA vazam para freela/contratante/dual.
  toPublic(): any {
    return {
      id: this.id, candidatura_id: this.candidaturaId, vaga_id: this.vagaId,
      contratante_id: this.contratanteId, freela_id: this.freelaId, provedor: this.provedor,
      metodo: this.metodo, status: this.status,
      total_pix: this.metodo === 'pix' ? this.totalCentavos / 100 : undefined,
      total_cartao: this.metodo === 'cartao' ? this.totalCentavos / 100 : undefined,
      total: this.totalCentavos / 100,
      qr_code: this.qrCode, qr_code_url: this.qrCodeUrl, checkout_url: this.checkoutUrl,
      expira_em: this.expiraEm, pago_em: this.pagoEm,
    };
  }
  toPublicAdmin(): any { return { ...this.toPublic(), comissao_centavos: this.comissaoCentavos, taxa_centavos: this.taxaCentavos, valor_servico_centavos: this.valorServicoCentavos, valor_transporte_centavos: this.valorTransporteCentavos, provedor_pagamento_id: this.provedorPagamentoId, erro: this.erro }; }
}
