export abstract class BaseService {
  protected handleError(error: any, context: string): never {
    console.error(`[${context}]`, error.message);
    throw error;
  }

  protected validateRequired(data: any, fields: string[]) {
    for (const field of fields) {
      if (!data[field]) {
        throw new Error(`Campo obrigatório: ${field}`);
      }
    }
  }
}
