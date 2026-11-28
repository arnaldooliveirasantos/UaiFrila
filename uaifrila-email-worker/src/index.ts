// email-worker V3.4 FINAL - esquema real + placeholders {{CODIGO}} etc
import { Pool } from "pg";
const log = (nivel: string, msg: string, data?: unknown) => {
  console.log(`[email-worker] [${nivel}] ${msg}${data ? " " + JSON.stringify(data) : ""}`);
};
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5 });
const API_URL = (process.env.API_URL || "https://hom-api.uaifrila.com.br").replace(/\/$/, "");
const WORKER_SECRET = process.env.WORKER_SECRET || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM_PADRAO = process.env.EMAIL_FROM || "UaiFrila <noreply@uaifrila.com.br>";
const FRONTEND_URL = (process.env.FRONTEND_URL || "https://hom.uaifrila.com.br").replace(/\/$/, "");
const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS || 10000);
const BATCH = Number(process.env.WORKER_BATCH || 10);
const MAX_TENTATIVAS = Number(process.env.MAX_TENTATIVAS || 3);
let emExecucao = false;
let statusMap: Record<string, number> = {};
async function carregarStatus() {
  const { rows } = await pool.query(`SELECT id, chave, nome FROM email_status ORDER BY id`);
  statusMap = {};
  for (const r of rows) statusMap[String(r.chave).toUpperCase()] = Number(r.id);
  log("INFO", "email_status carregado", { status: rows.map((r: any) => `${r.id}=${r.chave}`).join(", ") });
  return statusMap;
}
function acharStatusId(candidatos: string[]): number | null {
  for (const c of candidatos) if (statusMap[c] !== undefined) return statusMap[c];
  return null;
}
async function chamarApi(path: string, method: "GET" | "POST" = "GET", body?: unknown) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(`${API_URL}${path}`, { method, signal: ctrl.signal, headers: { "Content-Type": "application/json", "x-worker-secret": WORKER_SECRET }, body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json().catch(() => ({}));
  } finally { clearTimeout(t); }
}
async function enviarViaResend(para: string, assunto: string, html: string, remetente?: string | null) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY nao configurada");
  const from = remetente ? remetente : EMAIL_FROM_PADRAO;
  const fromFinal = from.includes("@") && !from.includes("<") ? `UaiFrila <${from}>` : from;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch("https://api.resend.com/emails", { method: "POST", signal: ctrl.signal, headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: fromFinal, to: [para], subject: assunto, html }) });
    const texto = await res.text();
    if (!res.ok) throw new Error(`Resend HTTP ${res.status}: ${texto.slice(0, 500)}`);
    return texto;
  } catch (e: unknown) {
    const err = e as Error;
    if (err?.name === "AbortError") throw new Error("Timeout 15s - Resend nao respondeu");
    throw e;
  } finally { clearTimeout(t); }
}
function mascarar(email: string) {
  const p = email.split("@");
  if (p.length !== 2) return "***";
  return `${(p[0] ?? "").slice(0, 2)}***@${p[1]}`;
}
// Substitui {{CODIGO}}, {{NOME}}, {{TEMPO_EXPIRACAO}}, {{LINK_VALIDAR}}, {{LINK_CANCELAR}}, {{FRONTEND_URL}} - case-insensitive
function aplicarPlaceholders(texto: string, vars: Record<string, string>): string {
  let out = texto;
  for (const [chave, valor] of Object.entries(vars)) {
    const re = new RegExp(`\\{\\{\\s*${chave}\\s*\\}\\}`, "gi");
    out = out.replace(re, valor);
  }
  return out;
}
function montarVariaveis(row: any): Record<string, string> {
  const dados = (row.dados_cadastro && typeof row.dados_cadastro === "object") ? row.dados_cadastro : {};
  // dados_cadastro pode vir como string JSON
  let dadosObj: any = dados;
  if (typeof row.dados_cadastro === "string") { try { dadosObj = JSON.parse(row.dados_cadastro); } catch { dadosObj = {}; } }
  const upper: Record<string, string> = {};
  for (const [k, v] of Object.entries(dadosObj)) upper[String(k).toUpperCase()] = String(v ?? "");
  return {
    CODIGO: String(row.codigo_verificacao ?? upper["CODIGO"] ?? upper["CODIGO_VERIFICACAO"] ?? ""),
    CODIGO_VERIFICACAO: String(row.codigo_verificacao ?? ""),
    NOME: String(upper["NOME"] ?? upper["NOME_USUARIO"] ?? upper["USUARIO"] ?? ""),
    TEMPO_EXPIRACAO: String(upper["TEMPO_EXPIRACAO"] ?? upper["TEMPO"] ?? upper["EXPIRACAO_MINUTOS"] ?? "10"),
    LINK_VALIDAR: String(upper["LINK_VALIDAR"] ?? upper["LINK_VALIDACAO"] ?? upper["LINK"] ?? ""),
    LINK_CANCELAR: String(upper["LINK_CANCELAR"] ?? upper["LINK_CANCELAMENTO"] ?? ""),
    FRONTEND_URL: String(upper["FRONTEND_URL"] ?? FRONTEND_URL),
    EMAIL: String(row.email_destinatario ?? ""),
  };
}
function resolverConteudo(row: any): { assunto: string; html: string; faltando: string[] } {
  const vars = montarVariaveis(row);
  let assunto = row.titulo_final || row.titulo_assunto || "Codigo - UaiFrila";
  let html = row.conteudo_final || row.conteudo_corpo || "";
  assunto = aplicarPlaceholders(assunto, vars);
  html = aplicarPlaceholders(html, vars);
  const faltando: string[] = [];
  const resto = html.match(/\{\{\s*[A-Z_]+\s*\}\}/g);
  if (resto) faltando.push(...resto);
  // Se ainda nao tem codigo no html e tem codigo, anexa para nao mandar e-mail sem codigo
  if (vars.CODIGO && !html.includes(vars.CODIGO)) {
    html += `<p>Seu codigo: <b>${vars.CODIGO}</b></p>`;
  }
  return { assunto, html, faltando };
}
async function processar() {
  if (Object.keys(statusMap).length === 0) await carregarStatus();
  const idPendente = acharStatusId(["EM_ESPERA"]);
  const idEnviado = acharStatusId(["ENVIADO"]);
  const idFalha = acharStatusId(["FALHA"]);
  if (idPendente == null || idEnviado == null || idFalha == null) {
    log("ERROR", "status EM_ESPERA/ENVIADO/FALHA nao encontrados", { statusMap });
    return;
  }
  const { rows } = await pool.query(
    `SELECT h.id, h.email_destinatario, h.titulo_final, h.conteudo_final, h.codigo_verificacao,
            h.tentativas, h.email_remetente, h.expira_em, h.dados_cadastro,
            t.titulo_assunto, t.conteudo_corpo, t.email_remetente AS template_remetente
     FROM email_historico_disparos h
     LEFT JOIN email_templates t ON t.id = h.template_id
     WHERE h.status_id = $1
     ORDER BY h.id ASC LIMIT $2`,
    [idPendente, BATCH]
  );
  log("INFO", "em_espera encontrados", { qtd: rows.length, tabela: "email_historico_disparos", status_id_pendente: idPendente });
  for (const row of rows) {
    const { assunto, html, faltando } = resolverConteudo(row);
    if (faltando.length > 0) log("WARN", "placeholders nao substituidos", { id: row.id, faltando });
    const remetente = row.email_remetente || row.template_remetente || null;
    log("INFO", "enviando", { id: row.id, destinatario: mascarar(String(row.email_destinatario)), assunto });
    try {
      if (!html) throw new Error("conteudo_final e conteudo_corpo vazios");
      await enviarViaResend(String(row.email_destinatario), assunto, html, remetente);
      await pool.query(`UPDATE email_historico_disparos SET status_id = $2, enviado_em = NOW(), ultima_tentativa = NOW(), atualizado_em = NOW(), ultimo_erro = NULL WHERE id = $1`, [row.id, idEnviado]);
      log("INFO", "enviado ok", { id: row.id });
    } catch (erro: unknown) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      const tent = (row.tentativas ?? 0) + 1;
      const novoStatus = tent >= MAX_TENTATIVAS ? idFalha : idPendente;
      log("ERROR", "falha no envio", { id: row.id, erro: msg, tentativas: tent });
      await pool.query(`UPDATE email_historico_disparos SET status_id = $2, tentativas = $3, ultimo_erro = $4, ultima_tentativa = NOW(), atualizado_em = NOW() WHERE id = $1`, [row.id, novoStatus, tent, msg]);
    }
  }
}
async function tick() {
  if (emExecucao) { log("WARN", "tick ignorado: anterior ainda em execucao"); return; }
  emExecucao = true;
  try {
    log("INFO", "tick inicio", { batch: BATCH, tabela: "email_historico_disparos" });
    await processar();
    try { await chamarApi("/api/worker/pagamentos", "GET"); } catch (e: unknown) { log("ERROR", "pagamentos falharam", { erro: e instanceof Error ? e.message : String(e) }); }
    try { await chamarApi("/api/worker/repasses", "GET"); } catch (e: unknown) { log("ERROR", "repasses falharam", { erro: e instanceof Error ? e.message : String(e) }); }
    log("INFO", "tick fim ok");
  } catch (e: unknown) { log("ERROR", "tick falhou", { erro: e instanceof Error ? e.message : String(e) }); }
  finally { emExecucao = false; }
}
async function iniciar() {
  log("INFO", "worker V3.4 FINAL - EM_ESPERA/ENVIADO/FALHA + placeholders {{CODIGO}}", { intervalMs: INTERVAL_MS, batch: BATCH, maxTentativas: MAX_TENTATIVAS, apiUrl: API_URL, frontendUrl: FRONTEND_URL });
  await carregarStatus();
  setInterval(() => { void tick(); }, INTERVAL_MS);
  await tick();
}
process.on("SIGTERM", async () => { await pool.end(); process.exit(0); });
process.on("SIGINT", async () => { await pool.end(); process.exit(0); });
void iniciar();
