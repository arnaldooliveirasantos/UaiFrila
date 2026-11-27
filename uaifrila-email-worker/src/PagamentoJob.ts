// Worker — PagamentoJob: chama os endpoints internos da API (X-Worker-Secret).
// O worker NÃO chama provedores nem descriptografa segredos: isso é da API.
// API_URL = http://localhost:3000 (ou a URL da API). WORKER_SECRET deve ser igual nos dois.
export async function processarPagamentos(log: any): Promise<void> {
  const base = (process.env.API_URL || 'http://localhost:3000').replace(/\/$/, '');
  const secret = process.env.WORKER_SECRET || '';
  if (!secret) { await log.error('pagamentos: WORKER_SECRET não definido — job ignorado'); return; }
  try {
    const res = await fetch(`${base}/api/interno/pagamentos/processar`, { method: 'POST', headers: { 'X-Worker-Secret': secret, 'Content-Type': 'application/json' } });
    const j: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.message || `HTTP ${res.status}`);
    await log.info('pagamentos processados', j?.data || {});
  } catch (e: any) { await log.error('pagamentos falharam', { erro: String(e.message || e).slice(0, 500) }); }
}
