import { AsyncLocalStorage } from 'async_hooks';
import { PoolClient } from 'pg';
// Contexto da transacao unica por request. BaseRepository.query() usa este client
// quando presente; fora de request (worker/jobs) usa o pool.
export const txStorage = new AsyncLocalStorage<PoolClient | null>();
export function clienteAtual(): PoolClient | null { return txStorage.getStore() ?? null; }
