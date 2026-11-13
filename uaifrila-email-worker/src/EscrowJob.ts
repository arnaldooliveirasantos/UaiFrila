import { Pool } from 'pg';
import { WorkerLogger } from './Logger';
// Item 11 B: fonte unica de escrow = transacoes (pagamentos/pagamento_eventos foram dropados na migracao 01).
export async function liberarEscrowAutomatico(pool: Pool, log: WorkerLogger) {
  const r = await pool.query(`SELECT valor_numerico, valor FROM variaveis_sistema WHERE chave='ESCROW_LIBERACAO_AUTOMATICA_HORAS'`);
  if (!r.rows[0]) throw new Error('Variavel de sistema nao encontrada: ESCROW_LIBERACAO_AUTOMATICA_HORAS');
  const horas = Number(r.rows[0]?.valor_numerico ?? r.rows[0]?.valor);
  if (isNaN(horas)) throw new Error('Variavel de sistema sem valor numerico: ESCROW_LIBERACAO_AUTOMATICA_HORAS');
  const upd = await pool.query(`UPDATE transacoes SET status='LIBERADO', data_liberacao=NOW(), atualizado_em=NOW() WHERE status='EM_ESCROW' AND criado_em <= NOW() - ($1 || ' hours')::interval RETURNING id`, [String(horas)]);
  if (upd.rows.length) await log.info('escrow liberado automaticamente', { qtd: upd.rows.length, horas });
  return upd.rows;
}
