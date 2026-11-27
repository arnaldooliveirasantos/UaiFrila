import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
import { WorkerLogger } from './Logger';
import { geocodificar } from './Geocodificacao';
// WORKER DE GEOCODIFICACAO
// Papel: preencher latitude/longitude dos enderecos salvos SEM coordenadas
// (salvamento nunca trava por causa do Nominatim - ver GeocodificacaoService na API).
// Regras:
// - Busca em lote, com FOR UPDATE SKIP LOCKED: 2 instancias nao pegam o mesmo endereco.
// - Respeita o limite do Nominatim: 1 req/segundo (sleep 1100ms entre enderecos).
// - Backoff: so tenta de novo apos GEOCODIFICACAO_RETRY_MINUTOS desde a ultima tentativa.
//   Tentativa 1 falha as 10h -> proxima as 11h. Assim endereco ruim nao martela o Nominatim.
// - Desiste apos GEOCODIFICACAO_MAX_TENTATIVAS (padrao 10): fica com geocodificacao_erro
//   preenchido e sai da fila. Para reativar, zere geocodificacao_tentativas no banco.
// - Sucesso: grava lat/lng + limpa erro. Falha: incrementa tentativas + grava motivo + hora.
// - Nunca apaga coordenada existente, nunca toca em endereco que ja tem lat/lng validos.
// - Todo erro de tick/endereco gera log com erro. Sem fallback, sem inventar coordenada.
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
  : new Pool({ user: process.env.DB_USER, password: process.env.DB_PASSWORD, host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 5432, database: process.env.DB_NAME, max: 5 });
const log = new WorkerLogger(pool);
const INTERVAL = Number(process.env.GEOCODIFICACAO_INTERVAL_MS) || 60000;
const BATCH = Number(process.env.GEOCODIFICACAO_BATCH_SIZE) || 10;
const MAX_TENTATIVAS = Number(process.env.GEOCODIFICACAO_MAX_TENTATIVAS) || 10;
const RETRY_MINUTOS = Number(process.env.GEOCODIFICACAO_RETRY_MINUTOS) || 60;
let isProcessing = false;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
async function tick() {
  if (isProcessing) { await log.warn('tick ignorado: anterior ainda em execucao'); return; }
  isProcessing = true;
  const client = await pool.connect();
  try {
    const pendentes = await client.query(
      `WITH locked AS (
         SELECT id FROM enderecos
         WHERE (latitude IS NULL OR longitude IS NULL OR latitude = 0 OR longitude = 0)
           AND COALESCE(geocodificacao_tentativas, 0) < $1::int
           AND (geocodificacao_ultima_tentativa IS NULL OR geocodificacao_ultima_tentativa < NOW() - ($2::int || ' minutes')::interval)
         ORDER BY COALESCE(geocodificacao_ultima_tentativa, criado_em) ASC
         LIMIT $3::int FOR UPDATE SKIP LOCKED
       )
       SELECT e.id, e.logradouro, e.numero, e.bairro, e.cep, c.nome AS cidade_nome, es.sigla AS estado_sigla,
              COALESCE(e.geocodificacao_tentativas, 0) AS tentativas
       FROM enderecos e JOIN locked ON locked.id = e.id
       LEFT JOIN cidades c ON c.id = e.cidade_id
       LEFT JOIN estados es ON es.id = c.estado_id`,
      [MAX_TENTATIVAS, RETRY_MINUTOS, BATCH]);
    await log.info('tick inicio', { pendentes: pendentes.rows.length, batch: BATCH });
    let ok = 0, falhou = 0, desistiu = 0;
    for (const end of pendentes.rows) {
      try {
        const r = await geocodificar({ logradouro: end.logradouro, numero: end.numero, bairro: end.bairro, cidade: end.cidade_nome, estado: end.estado_sigla, cep: end.cep });
        if (r.coords) {
          await client.query(`UPDATE enderecos SET latitude=$2, longitude=$3, geocodificacao_tentativas=COALESCE(geocodificacao_tentativas,0)+1, geocodificacao_ultima_tentativa=NOW(), geocodificacao_erro=NULL, atualizado_em=NOW() WHERE id=$1`, [end.id, r.coords.latitude, r.coords.longitude]);
          ok++; await log.info('geocodificado', { endereco_id: end.id, cidade: end.cidade_nome, cep: end.cep });
        } else {
          const novaTentativa = Number(end.tentativas) + 1;
          await client.query(`UPDATE enderecos SET geocodificacao_tentativas=$2, geocodificacao_ultima_tentativa=NOW(), geocodificacao_erro=$3, atualizado_em=NOW() WHERE id=$1`, [end.id, novaTentativa, r.motivo]);
          falhou++;
          if (novaTentativa >= MAX_TENTATIVAS) { desistiu++; await log.warn('desistiu apos max tentativas', { endereco_id: end.id, cidade: end.cidade_nome, cep: end.cep, motivo: r.motivo, tentativas: novaTentativa }); }
          else await log.warn('falha, tenta de novo depois', { endereco_id: end.id, cidade: end.cidade_nome, cep: end.cep, motivo: r.motivo, tentativas: novaTentativa });
        }
      } catch (e: any) {
        falhou++; await log.error('erro ao processar endereco', { endereco_id: end.id, erro: String(e?.message || e).slice(0, 500) });
        try { await client.query(`UPDATE enderecos SET geocodificacao_tentativas=COALESCE(geocodificacao_tentativas,0)+1, geocodificacao_ultima_tentativa=NOW(), geocodificacao_erro='ERRO_WORKER', atualizado_em=NOW() WHERE id=$1`, [end.id]); } catch (e2: any) { await log.error('erro ao gravar falha', { endereco_id: end.id, erro: String(e2?.message || e2).slice(0, 500) }); }
      }
      await sleep(1100); // Nominatim: max ~1 req/segundo
    }
    await log.info('tick fim ok', { ok, falhou, desistiu });
  } catch (e: any) { await log.error('tick falhou', { erro: String(e?.message || e).slice(0, 500) }); }
  finally { client.release(); isProcessing = false; }
}
log.info('worker iniciado', { intervalMs: INTERVAL, batch: BATCH, maxTentativas: MAX_TENTATIVAS, retryMinutos: RETRY_MINUTOS });
tick(); setInterval(tick, INTERVAL);
