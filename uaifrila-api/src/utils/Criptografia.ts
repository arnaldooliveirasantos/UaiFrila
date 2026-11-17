// Criptografia de segredos de provedores (AES-256-GCM, Node crypto nativo — sem dependência nova).
// Chave: PAGAMENTO_SEGREDO_CHAVE (64 hex = 32 bytes) no .env. Sem ela, erro explícito em vez de
// salvar segredo em texto puro. Formato: iv_hex:tag_hex:cifrado_hex.
import crypto from 'crypto';
function chave(): Buffer {
  const hex = process.env.PAGAMENTO_SEGREDO_CHAVE || '';
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) throw new Error('PAGAMENTO_SEGREDO_CHAVE não definida ou inválida (precisa de 64 hex = 32 bytes) — gere com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  return Buffer.from(hex, 'hex');
}
export function criptografar(texto: string): string {
  if (!texto) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', chave(), iv);
  const cifrado = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${cifrado.toString('hex')}`;
}
export function descriptografar(valor: string): string {
  if (!valor) return '';
  const [ivHex, tagHex, cifradoHex] = String(valor).split(':');
  if (!ivHex || !tagHex || !cifradoHex) throw new Error('Segredo criptografado em formato inválido');
  const decipher = crypto.createDecipheriv('aes-256-gcm', chave(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(cifradoHex, 'hex')), decipher.final()]).toString('utf8');
}
