// email-worker - COMPLETO - envio via API HTTP do Resend
import { Pool } from "pg";

const log = (nivel: string, msg: string, data?: unknown) => {
  console.log(`[email-worker] [${nivel}] ${msg}${data ? " " + JSON.stringify(data) : ""}`);
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

const API_URL = (process.env.API_URL || "https://hom-api.uaifrila.com.br").replace(/\/$/, "");
const WORKER_SECRET = process.env.WORKER_SECRET || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "UaiFrila <noreply@uaifrila.com.br>";
const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS || 10000);
const BATCH = Number(process.env.WORKER_BATCH || 10);
const MAX_TENTATIVAS = Number(process.env.MAX_TENTATIVAS || 3);

let emExecucao = false;
let tentativasDeBancoConsecutivas = 0;

async function chamarApi(path: string, method: "GET" | "POST" = "GET", body?: unknown) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        "x-worker-secret": WORKER_SECRET,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json().catch(() => ({}));
  } finally {
    clearTimeout(t);
  }
}

async function enviarViaResend(para: string, assunto: string, html: string) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY nao configurada no Railway");
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: EMAIL_FROM, to: [para], subject: assunto, html }),
    });
    const texto = await res.text();
    if (!res.ok) throw new Error(`Resend HTTP ${res.status}: ${texto.slice(0, 500)}`);
    return texto;
  } catch (e: unknown) {
    const err = e as Error;
    if (err?.name === "AbortError") throw new Error("Timeout 15s - Resend nao respondeu");
    throw e;
  } finally {
    clearTimeout(t);
  }
}

function mascararEmail(email: string) {
  const partes = email.split("@");
  if (partes.length !== 2) return "***";
  const nome = partes[0] ?? "";
  return `${nome.slice(0, 2)}***@${partes[1]}`;
}

async function processarEmailsPendentes() {
  const { rows } = await pool.query(
    `SELECT id, destinatario, assunto, corpo_html, tentativas
     FROM emails_pendentes
     WHERE status = 'em_espera'
     ORDER BY id ASC
     LIMIT $1`,
    [BATCH]
  );
  log("INFO", "em_espera encontrados", { qtd: rows.length });
  for (const email of rows) {
    log("INFO", "enviando", { id: email.id, destinatario: mascararEmail(email.destinatario) });
    try {
      await enviarViaResend(email.destinatario, email.assunto, email.corpo_html);
      await pool.query(
        `UPDATE emails_pendentes SET status = 'enviado', enviado_em = NOW(), ultimo_erro = NULL WHERE id = $1`,
        [email.id]
      );
      log("INFO", "enviado ok", { id: email.id });
    } catch (erro: unknown) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      log("ERROR", "falha no envio", { id: email.id, erro: msg });
      await pool.query(
        `UPDATE emails_pendentes
         SET tentativas = tentativas + 1,
             status = CASE WHEN tentativas + 1 >= $2 THEN 'falhou' ELSE 'em_espera' END,
             ultimo_erro = $3
         WHERE id = $1`,
        [email.id, MAX_TENTATIVAS, msg]
      );
    }
  }
}

async function tick() {
  if (emExecucao) {
    log("WARN", "tick ignorado: anterior ainda em execucao");
    return;
  }
  emExecucao = true;
  try {
    log("INFO", "tick inicio", { batch: BATCH });
    await processarEmailsPendentes();
    tentativasDeBancoConsecutivas = 0;
    try {
      await chamarApi("/api/worker/pagamentos", "GET");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      log("ERROR", "pagamentos falharam", { erro: msg });
    }
    try {
      await chamarApi("/api/worker/repasses", "GET");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      log("ERROR", "repasses falharam", { erro: msg });
    }
    log("INFO", "tick fim ok");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    log("ERROR", "tick falhou", { erro: msg });
    tentativasDeBancoConsecutivas += 1;
    if (tentativasDeBancoConsecutivas >= 5) {
      log("ERROR", "banco falhou 5 vezes seguidas - verifique DATABASE_URL no Railway");
    }
  } finally {
    emExecucao = false;
  }
}

async function iniciar() {
  log("INFO", "worker V3 COMPLETO - envio via Resend HTTP", {
    intervalMs: INTERVAL_MS,
    batch: BATCH,
    maxTentativas: MAX_TENTATIVAS,
    apiUrl: API_URL,
    temResendKey: Boolean(RESEND_API_KEY),
    emailFrom: EMAIL_FROM,
    temWorkerSecret: Boolean(WORKER_SECRET),
    temDatabaseUrl: Boolean(process.env.DATABASE_URL),
  });
  if (!process.env.DATABASE_URL) log("ERROR", "DATABASE_URL nao configurada - worker nao vai processar e-mails");
  if (!RESEND_API_KEY) log("ERROR", "RESEND_API_KEY nao configurada - envio vai falhar");
  if (!WORKER_SECRET) log("ERROR", "WORKER_SECRET nao configurada - pagamentos/repasses vao falhar");
  setInterval(() => { void tick(); }, INTERVAL_MS);
  await tick();
}

process.on("SIGTERM", async () => { log("INFO", "SIGTERM - encerrando"); await pool.end(); process.exit(0); });
process.on("SIGINT", async () => { log("INFO", "SIGINT - encerrando"); await pool.end(); process.exit(0); });

void iniciar();
