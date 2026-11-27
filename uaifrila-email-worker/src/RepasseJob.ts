// Worker — RepasseJob + AutoConfirmacaoJob: chamam os endpoints internos da API.
// Repasse executa na API (provedor + segredos). Auto-confirmação é SQL puro aqui.
// EscrowJob NÃO é chamado para transacoes com pagamento_id (ver EscrowJob.ts).
export async function processarRepasses(log: any): Promise<void> {
  const base = (process.env.API_URL || 'http://localhost:3000').replace(/\/$/, '');
  const secret = process.env.WORKER_SECRET || '';
  if (!secret) { await log.error('repasses: WORKER_SECRET não definido — job ignorado'); return; }
  try {
    const res = await fetch(`${base}/api/interno/repasses/processar`, { method: 'POST', headers: { 'X-Worker-Secret': secret, 'Content-Type': 'application/json' } });
    const j: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.message || `HTTP ${res.status}`);
    await log.info('repasses processados', j?.data || {});
  } catch (e: any) { await log.error('repasses falharam', { erro: String(e.message || e).slice(0, 500) }); }
}
export async function autoConfirmarTurnos(pool: any, log: any): Promise<void> {
  const r = await pool.query(`SELECT valor_numerico, valor FROM variaveis_sistema WHERE chave='AUTOCONFIRMACAO_TURNO_HORAS'`);
  const horas = Number(r.rows[0]?.valor_numerico ?? r.rows[0]?.valor ?? 24);
  // Auto-confirmação chama a API? Não: aqui só marca, e o repasse é agendado pela API no próximo
  // tick de repasses? NÃO — o repasse precisa do agendamento. Por isso este job usa o endpoint
  // interno de repasses APÓS marcar, e a API agenda repasses para turnos CONFIRMADOS sem repasse.
  // Implementação: marca CONFIRMADO; a API (RepasseService.processarVencidos) cria o repasse
  // faltante quando processa — ver RepasseService: turnos CONFIRMADO sem repasse são agendados.
  const upd = await pool.query(`UPDATE trampo_turnos SET status='CONFIRMADO', confirmado_em=NOW(), atualizado_em=NOW() WHERE status='AGUARDANDO_CONFIRMACAO' AND checkout_em <= NOW() - ($1 || ' hours')::interval RETURNING id`, [String(horas)]);
  if (upd.rows.length) await log.info('turnos auto-confirmados', { qtd: upd.rows.length, horas });
}
