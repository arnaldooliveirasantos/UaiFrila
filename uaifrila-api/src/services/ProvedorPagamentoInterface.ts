// Interface dos provedores (Mercado Pago / Efí). Implementações fazem HTTP REAL na API
// oficial — sem SDK, sem mock, sem fallback. Erro do provedor = erro para o chamador.
import crypto from 'crypto';
export interface CobrancaEntrada {
  descricao: string; valorCentavos: number; metodo: 'pix' | 'cartao';
  pagadorEmail: string; pagadorNome: string; expiraEm: Date;
  chaveIdempotencia: string; tokenCartao?: string; parcelas?: number;
}
export interface CobrancaSaida { provedorPagamentoId: string; status: string; qrCode?: string; qrCodeUrl?: string; checkoutUrl?: string; }
export interface ChavePixInfo { existe: boolean | null; nomeTitular?: string; cpfCnpjTitular?: string; verificavel: boolean }
export interface ProvedorPagamento {
  nome: string;
  criarCobranca(e: CobrancaEntrada, segredos: { accessToken: string }): Promise<CobrancaSaida>;
  consultarCobranca(provedorPagamentoId: string, segredos: { accessToken: string }): Promise<{ status: string; valorCentavos: number }>;
  reembolsar(provedorPagamentoId: string, valorCentavos: number, segredos: { accessToken: string }): Promise<{ reembolsoId: string }>;
  transferirPix(dados: { chavePix: string; tipoChave: string; valorCentavos: number; descricao: string }, segredos: { accessToken: string; config?: any }): Promise<{ comprovante: string }>;
  validarChavePix(chave: string, segredos: { accessToken: string; config?: any }): Promise<ChavePixInfo>;
  validarWebhook(headers: Record<string, string>, corpoBruto: string, segredos: { webhookSecret: string }): boolean;
}
export async function chamarApi(url: string, init: RequestInit): Promise<any> {
  const res = await fetch(url, init);
  const texto = await res.text();
  let json: any = null; try { json = JSON.parse(texto); } catch { /* corpo não-JSON */ }
  if (!res.ok) {
    const msg = json?.message || json?.mensagem || json?.error || texto.slice(0, 400) || `HTTP ${res.status}`;
    throw new Error(`Provedor retornou ${res.status}: ${msg}`);
  }
  return json ?? {};
}
export function validarHmacAssinatura(assinatura: string | undefined, corpoBruto: string, segredo: string): boolean {
  if (!segredo) throw new Error('Webhook secret não configurado para este provedor — cadastre no admin');
  if (!assinatura) return false;
  const esperado = crypto.createHmac('sha256', segredo).update(corpoBruto).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(assinatura)); } catch { return false; }
}
