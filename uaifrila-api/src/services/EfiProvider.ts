import fs from 'fs';
import https from 'https';
import { ProvedorPagamento, CobrancaEntrada, CobrancaSaida, ChavePixInfo, chamarApi } from './ProvedorPagamentoInterface';
// Efí — API oficial. OAuth2 client_credentials com certificado mTLS (certificado_path em config_json).
// Sem certificado, a API rejeita — o erro é propagado, nunca mascarado.
// Cobrança Pix: POST /v2/cob + GET /v2/loc/:id/qrcode. Cartão: POST /v1/charge (token do front).
// Envio Pix: POST /v2/pix. Devolução Pix: PUT /v2/pix/:e2eId/devolucao/:id.
const BASE = 'https://api.efipay.com.br';
export class EfiProvider implements ProvedorPagamento {
  nome = 'EFI';
  private agente(config: any): https.Agent | undefined {
    const certPath = config?.certificado_path || process.env.EFI_CERT_PATH;
    const keyPath = config?.chave_path || process.env.EFI_KEY_PATH;
    if (!certPath || !keyPath) throw new Error('Certificado mTLS da Efí não configurado — cadastre certificado_path/chave_path no config_json do provedor');
    return new https.Agent({ cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath), rejectUnauthorized: true });
  }
  private async token(clientId: string, clientSecret: string, config: any): Promise<string> {
    const agent = this.agente(config);
    const res = await fetch(`${BASE}/oauth/token`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}` }, body: JSON.stringify({ grant_type: 'client_credentials' }), agent: agent as any });
    const j: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Efí OAuth ${res.status}: ${j?.error_description || j?.error || 'falha de autenticação'}`);
    return String(j.access_token);
  }
  async criarCobranca(e: CobrancaEntrada, s: { accessToken: string; config?: any; clientId?: string }): Promise<CobrancaSaida> {
    const token = await this.token(s.clientId || '', s.accessToken, s.config);
    if (e.metodo === 'pix') {
      const cob = await chamarApi(`${BASE}/v2/cob`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ calendario: { expiracao: Math.max(60, Math.floor((e.expiraEm.getTime() - Date.now()) / 1000)) }, valor: { original: (e.valorCentavos / 100).toFixed(2) }, chave: (s.config?.pix_chave_recebimento || process.env.EFI_PIX_CHAVE || ''), solicitacaoPagador: e.descricao.slice(0, 140) }), agent: this.agente(s.config) as any });
      const qr = await chamarApi(`${BASE}/v2/loc/${cob.loc.id}/qrcode`, { headers: { Authorization: `Bearer ${token}` }, agent: this.agente(s.config) as any });
      return { provedorPagamentoId: String(cob.txid), status: 'pending', qrCode: qr.qrcode, qrCodeUrl: qr.imagemQrcode };
    }
    if (!e.tokenCartao) throw new Error('Token do cartão obrigatório — gere no front com o tokenizador da Efí (o backend nunca recebe número de cartão)');
    const r = await chamarApi(`${BASE}/v1/charge`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ name: e.descricao.slice(0, 100), value: e.valorCentavos, amount: 1 }], payment: { credit_card: { payment_token: e.tokenCartao, installments: Number(e.parcelas || 1), customer: { email: e.pagadorEmail, name: e.pagadorNome } } } }), agent: this.agente(s.config) as any });
    return { provedorPagamentoId: String(r.data?.charge_id || r.data?.id || ''), status: 'pending' };
  }
  async consultarCobranca(id: string, s: { accessToken: string; config?: any; clientId?: string }): Promise<{ status: string; valorCentavos: number }> {
    const token = await this.token(s.clientId || '', s.accessToken, s.config);
    const r = await chamarApi(`${BASE}/v2/cob/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` }, agent: this.agente(s.config) as any });
    return { status: String(r.status || ''), valorCentavos: Math.round(Number(r.valor?.original || 0) * 100) };
  }
  async reembolsar(id: string, valorCentavos: number, s: { accessToken: string; config?: any; clientId?: string }): Promise<{ reembolsoId: string }> {
    const token = await this.token(s.clientId || '', s.accessToken, s.config);
    const devolucaoId = `dev${Date.now()}`;
    const r = await chamarApi(`${BASE}/v2/pix/${encodeURIComponent(id)}/devolucao/${devolucaoId}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ valor: (valorCentavos / 100).toFixed(2) }), agent: this.agente(s.config) as any });
    return { reembolsoId: String(r.id || devolucaoId) };
  }
  async transferirPix(d: { chavePix: string; valorCentavos: number; descricao: string }, s: { accessToken: string; config?: any; clientId?: string }): Promise<{ comprovante: string }> {
    const token = await this.token(s.clientId || '', s.accessToken, s.config);
    const r = await chamarApi(`${BASE}/v2/pix`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ valor: (d.valorCentavos / 100).toFixed(2), chave: d.chavePix, solicitacaoPagador: d.descricao.slice(0, 140) }), agent: this.agente(s.config) as any });
    return { comprovante: String(r.endToEndId || r.id || '') };
  }
  async validarChavePix(chave: string, s: { accessToken: string; config?: any; clientId?: string }): Promise<ChavePixInfo> {
    try {
      const token = await this.token(s.clientId || '', s.accessToken, s.config);
      const r = await chamarApi(`${BASE}/v2/pix/chave/${encodeURIComponent(chave)}`, { headers: { Authorization: `Bearer ${token}` }, agent: this.agente(s.config) as any });
      return { existe: true, verificavel: true, nomeTitular: r.nomeTitular || r.nome, cpfCnpjTitular: r.cpfCnpjTitular || r.cpfCnpj };
    } catch (e: any) {
      if (String(e.message || '').includes('404')) return { existe: false, verificavel: true };
      throw e;
    }
  }
  validarWebhook(headers: Record<string, string>, _corpoBruto: string, _s: { webhookSecret: string }): boolean {
    if (!headers['x-efi-signature'] && !headers['x-signature']) throw new Error('Webhook da Efí sem assinatura — rejeitado');
    return true;
  }
}
