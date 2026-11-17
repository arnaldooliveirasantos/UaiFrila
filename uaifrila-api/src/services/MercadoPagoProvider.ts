import { ProvedorPagamento, CobrancaEntrada, CobrancaSaida, ChavePixInfo, chamarApi, validarHmacAssinatura } from './ProvedorPagamentoInterface';
// Mercado Pago — API oficial v1. Access token = client_secret_criptografado (descriptografado no service).
// Pix: POST /v1/payments {payment_method_id: 'pix'} — resposta traz point_of_interaction.transaction_data.
// Cartão: usa token gerado no front (MP.js) — NUNCA número de cartão no backend.
// Reembolso: POST /v1/payments/:id/refunds. Repasse Pix: POST /v1/payments {payment_method_id:'pix'}.
// Webhook: header x-signature = HMAC-SHA256 do corpo com o webhook secret.
const BASE = 'https://api.mercadopago.com';
export class MercadoPagoProvider implements ProvedorPagamento {
  nome = 'MERCADO_PAGO';
  private headers(token: string, idempotencia?: string): Record<string, string> {
    const h: Record<string, string> = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    if (idempotencia) h['X-Idempotency-Key'] = idempotencia;
    return h;
  }
  async criarCobranca(e: CobrancaEntrada, s: { accessToken: string }): Promise<CobrancaSaida> {
    if (e.metodo === 'pix') {
      const r = await chamarApi(`${BASE}/v1/payments`, { method: 'POST', headers: this.headers(s.accessToken, e.chaveIdempotencia), body: JSON.stringify({ transaction_amount: e.valorCentavos / 100, payment_method_id: 'pix', payer: { email: e.pagadorEmail, first_name: e.pagadorNome }, description: e.descricao, external_reference: e.chaveIdempotencia, date_of_expiration: e.expiraEm.toISOString(), notification_url: process.env.MP_WEBHOOK_URL || undefined }) });
      const tx = r.point_of_interaction?.transaction_data || {};
      return { provedorPagamentoId: String(r.id), status: String(r.status || 'pending'), qrCode: tx.qr_code_base64, qrCodeUrl: tx.qr_code, checkoutUrl: tx.ticket_url };
    }
    if (!e.tokenCartao) throw new Error('Token do cartão obrigatório — gere no front com o MP.js do Mercado Pago (o backend nunca recebe número de cartão)');
    const r = await chamarApi(`${BASE}/v1/payments`, { method: 'POST', headers: this.headers(s.accessToken, e.chaveIdempotencia), body: JSON.stringify({ transaction_amount: e.valorCentavos / 100, token: e.tokenCartao, installments: Number(e.parcelas || 1), payment_method_id: 'master', payer: { email: e.pagadorEmail }, description: e.descricao, external_reference: e.chaveIdempotencia }) });
    return { provedorPagamentoId: String(r.id), status: String(r.status || 'pending') };
  }
  async consultarCobranca(id: string, s: { accessToken: string }): Promise<{ status: string; valorCentavos: number }> {
    const r = await chamarApi(`${BASE}/v1/payments/${encodeURIComponent(id)}`, { headers: this.headers(s.accessToken) });
    return { status: String(r.status), valorCentavos: Math.round(Number(r.transaction_amount || 0) * 100) };
  }
  async reembolsar(id: string, valorCentavos: number, s: { accessToken: string }): Promise<{ reembolsoId: string }> {
    const r = await chamarApi(`${BASE}/v1/payments/${encodeURIComponent(id)}/refunds`, { method: 'POST', headers: this.headers(s.accessToken), body: JSON.stringify({ amount: valorCentavos / 100 }) });
    return { reembolsoId: String(r.id ?? id) };
  }
  async transferirPix(d: { chavePix: string; tipoChave: string; valorCentavos: number; descricao: string }, s: { accessToken: string }): Promise<{ comprovante: string }> {
    const r = await chamarApi(`${BASE}/v1/payments`, { method: 'POST', headers: this.headers(s.accessToken, `repasse-${Date.now()}-${d.valorCentavos}`), body: JSON.stringify({ transaction_amount: d.valorCentavos / 100, payment_method_id: 'pix', payer: { email: process.env.MP_PAGADOR_EMAIL || 'pagamentos@uaifrila.com.br' }, description: d.descricao, external_reference: d.descricao }) });
    return { comprovante: String(r.id) };
  }
  async validarChavePix(_chave: string, _s: any): Promise<ChavePixInfo> {
    // Mercado Pago NÃO expõe consulta pública de chave Pix de terceiros.
    return { existe: null, verificavel: false };
  }
  validarWebhook(headers: Record<string, string>, corpoBruto: string, s: { webhookSecret: string }): boolean {
    const assinatura = headers['x-signature'] || headers['x-hub-signature-256'];
    if (!assinatura) throw new Error('Webhook do Mercado Pago sem assinatura — rejeitado');
    return validarHmacAssinatura(assinatura, corpoBruto, s.webhookSecret);
  }
}
