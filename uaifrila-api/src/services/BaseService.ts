
export class BaseService {
  protected handleError(e: any, context: string) {
    console.error(`[${context}] Erro:`, e?.message || e);
    throw e;
  }
  protected validateRequired(dados: any, campos: string[]) {
    for (const campo of campos) {
      if (dados[campo] === undefined || dados[campo] === null || dados[campo] === '') {
        throw new Error(`Campo obrigatório: ${campo}`);
      }
    }
  }
}
