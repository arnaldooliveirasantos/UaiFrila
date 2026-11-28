// email-worker/src/Index.ts - CORRIGIDO
// - Envio via API HTTP do Resend (sem SMTP, que a Railway bloqueia)
// - Pagamentos/Repasses via GET (corrige HTTP 405)
// - Timeout de 15s no envio para nao travar o tick
// - Lock com finally para nao ficar "tick ignorado" para sempre
import { Pool } from "pg";

const log = (nivel: string, msg: string, data?: any) => {
  console.log(`[email-worker] [${nivel}] ${msg}${data ? " " + JSON.stringify(data) : ""}`);
};

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const API_URL = (process.env.API_URL || "https://hom-api.uaifrila.com.br").replace(/\/$/, "");
const WORKER_SECRET = process.env.WORKER_SECRET || "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "UaiFrila <noreply@uaifrila.com.br>";
const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS || 10000);
const BATCH = Number(process.env.WORKER_BATCH || 10);

let emExecucao = false;

async function chamarApi(path: string, method: "GET" | "POST" = "GET", body?: any) {
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
  } catch (e: any) {
    if (e?.name === "AbortError") throw new Error("Connection timeout (15s) - Resend nao respondeu");
    throw e;
  } finally {
    clearTimeout(t);
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
    const { rows } = await pool.query(
      `SELECT id, destinatario, assunto, corpo_html, tentativas FROM emails_pendentes WHERE status = 'em_espera' ORDER BY id ASC LIMIT $1`,
      [BATCH]
    );
    log("INFO", "em_espera encontrados", { qtd: rows.length });

    for (const email of rows) {
      log("INFO", "enviando", { id: email.id, destinatario: email.destinatario.replace(/(.{2}).*(@.*)/, "$1***$2") });
      try {
        await enviarViaResend(email.destinatario, email.assunto, email.corpo_html);
        await pool.query(`UPDATE emails_pendentes SET status='enviado', enviado_em=NOW() WHERE id=$1`, [email.id]);
        log("INFO", "enviado ok", { id: email.id });
      } catch (erro: any) {
        log("ERROR", "falha no envio", { id: email.id, erro: erro?.message || String(erro) });
        await pool.query(
          `UPDATE emails_pendentes SET tentativas = tentativas + 1, status = CASE WHEN tentativas + 1 >= 3 THEN 'falhou' ELSE 'em_espera' END, ultimo_erro = $2 WHERE id = $1`,
          [email.id, erro?.message || String(erro)]
        );
      }
    }

    // CORRECAO 405: essas rotas sao GET, nao POST
    try {
      await chamarApi("/api/worker/pagamentos", "GET");
    } catch (e: any) {
      log("ERROR", "pagamentos falharam", { erro: e?.message || String(e) });
    }
    try {
      await chamarApi("/api/worker/repasses", "GET");
    } catch (e: any) {
      log("ERROR", "repasses falharam", { erro: e?.message || String(e) });
    }

    log("INFO", "tick fim ok");
  } catch (e: any) {
    log("ERROR", "tick falhou", { erro: e?.message || String(e) });
  } finally {
    emExecucao = false;
  }
}

log("INFO", "worker iniciado", { intervalMs: INTERVAL_MS, batch: BATCH, maxTentativas: 3 });
setInterval(tick, INTERVAL_MS);
tick();
