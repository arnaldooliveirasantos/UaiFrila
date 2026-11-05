import { BaseRepository } from '../repositories/BaseRepository';
import { BaseModel } from '../models/BaseModel';

export abstract class BaseService<T extends BaseModel = any> {
  protected repository!: BaseRepository<T>;

  protected handleError(e: any, context: string): never {
    console.error(`[${context}] Erro:`, e?.message || e);
    // Preserva mensagem amigável
    if (e.message?.includes('não encontrado') || e.message?.includes('obrigatório') || e.message?.includes('já cadastrado') || e.message?.includes('inválido') || e.message?.includes('expirado')) {
      throw e;
    }
    throw new Error(e.message || 'Erro interno');
  }

  protected validateRequired(dados: any, campos: string[]) {
    for (const campo of campos) {
      if (dados[campo] === undefined || dados[campo] === null || dados[campo] === '') {
        throw new Error(`Campo obrigatório: ${campo}`);
      }
    }
  }

  protected validateEmail(email: string) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) throw new Error('E-mail inválido');
  }

  // ===== CHAMADAS PADRÕES - Todo service herda =====

  async listar(): Promise<T[]> {
    try {
      return await this.repository.buscarTodos();
    } catch (e: any) {
      this.handleError(e, `${this.constructor.name}.listar`);
    }
  }

  async listarTodos(): Promise<T[]> {
    return this.listar();
  }

  async buscarPorId(id: number): Promise<T> {
    try {
      if (!id) throw new Error('ID obrigatório');
      const result = await this.repository.buscarPorId(id);
      if (!result) throw new Error('Registro não encontrado');
      return result;
    } catch (e: any) {
      this.handleError(e, `${this.constructor.name}.buscarPorId`);
    }
  }

  async buscarPorIdComRelacoes(id: number): Promise<T | null> {
    try {
      return await this.repository.buscarPorIdComRelacoes(id);
    } catch (e: any) {
      this.handleError(e, `${this.constructor.name}.buscarPorIdComRelacoes`);
    }
  }

  async buscarPorIdOuNull(id: number): Promise<T | null> {
    try {
      return await this.repository.buscarPorId(id);
    } catch {
      return null;
    }
  }

  async criar(dados: any): Promise<T> {
    try {
      return await this.repository.criarGenerico(dados);
    } catch (e: any) {
      this.handleError(e, `${this.constructor.name}.criar`);
    }
  }

  async atualizar(id: number, dados: any): Promise<T | null> {
    try {
      if (!id) throw new Error('ID obrigatório para atualizar');
      // Verifica se existe
      const existente = await this.repository.buscarPorId(id);
      if (!existente) throw new Error('Registro não encontrado para atualizar');
      return await this.repository.atualizarGenerico(id, dados);
    } catch (e: any) {
      this.handleError(e, `${this.constructor.name}.atualizar`);
    }
  }

  async deletar(id: number): Promise<boolean> {
    try {
      if (!id) throw new Error('ID obrigatório para deletar');
      const existente = await this.repository.buscarPorId(id);
      if (!existente) throw new Error('Registro não encontrado para deletar');
      return await this.repository.deletarPorId(id);
    } catch (e: any) {
      this.handleError(e, `${this.constructor.name}.deletar`);
    }
  }

  async deletarPorId(id: number): Promise<boolean> {
    return this.deletar(id);
  }

  // Helpers para services que precisam de queries customizadas
  protected async buscarPorCampo(campo: string, valor: any): Promise<T | null> {
    try {
      const result = await (this.repository as any).query(`SELECT * FROM ${(this.repository as any).tableName} WHERE ${campo} = $1 LIMIT 1`, [valor]);
      const rows = result.rows || result;
      return rows[0] ? (this.repository as any).mapRow(rows[0]) : null;
    } catch (e: any) {
      this.handleError(e, `${this.constructor.name}.buscarPorCampo`);
    }
  }

  protected async listarPorCampo(campo: string, valor: any): Promise<T[]> {
    try {
      const result = await (this.repository as any).query(`SELECT * FROM ${(this.repository as any).tableName} WHERE ${campo} = $1 ORDER BY id`, [valor]);
      return (this.repository as any).mapRows(result.rows || result);
    } catch (e: any) {
      this.handleError(e, `${this.constructor.name}.listarPorCampo`);
    }
  }
}
