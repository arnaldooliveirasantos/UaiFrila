import { BaseRepository } from '../repositories/BaseRepository';
import { BaseModel } from '../models/BaseModel';

// BaseService ÚNICO - unifica as 2 versões que estavam misturadas:
// - versão antiga: this.repo, constructor(repo), sem handleError/validateRequired
// - versão nova: this.repository, handleError, validateRequired, validateEmail
// Esta versão suporta AMBAS: repo e repository são aliases do mesmo objeto.

export abstract class BaseService<T extends BaseModel = any> {
  // Alias duplo: repo e repository apontam para o mesmo repositório
  protected repo: any;
  protected repository: any;
  // NÃO declare 'protected variavelService' aqui - subclasses que precisarem
  // devem usar nome diferente (ex: variavelSvc) para não conflitar com TS2415

  constructor(repo?: any) {
    if (repo) {
      this.repo = repo;
      this.repository = repo;
    }
  }

  // Se a subclasse setou só repository ou só repo no constructor, sincroniza
  protected getRepo(): any {
    return this.repo || this.repository;
  }

  protected handleError(e: any, context: string): never {
    console.error(`[${context}] Erro:`, e?.message || e);
    if (e?.message?.includes('não encontrado') || e?.message?.includes('obrigatório') || e?.message?.includes('já cadastrado') || e?.message?.includes('inválido') || e?.message?.includes('expirado')) {
      throw e;
    }
    throw new Error(e?.message || 'Erro interno');
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
    if (!re.test(email || '')) throw new Error('E-mail inválido');
  }

  protected isValidId(id: any): boolean {
    const n = Number(id);
    return !isNaN(n) && n > 0;
  }

  protected toNumberObrigatorio(v: any, campo = 'valor'): number { const n = Number(v); if (isNaN(n)) throw new Error(`Valor numerico invalido: ${campo}`); return n; }

  protected now(): Date { return new Date(); }

  async listar(): Promise<T[]> {
    try { return await this.getRepo().buscarTodos(); }
    catch (e: any) { this.handleError(e, `${this.constructor.name}.listar`); }
  }

  async listarTodos(): Promise<T[]> { return this.listar(); }

  async buscarPorId(id: number): Promise<T> {
    try {
      if (!id) throw new Error('ID obrigatório');
      const result = await this.getRepo().buscarPorId(id);
      if (!result) throw new Error('Registro não encontrado');
      return result;
    } catch (e: any) { this.handleError(e, `${this.constructor.name}.buscarPorId`); }
  }

  // Alias usado por AuthController / UsuarioController
  async buscarPorIdComRelacoes(id: number): Promise<T | null> {
    try {
      const r = this.getRepo();
      if (typeof r.buscarPorIdComRelacoes === 'function') return await r.buscarPorIdComRelacoes(id);
      return await r.buscarPorId(id);
    } catch (e: any) { this.handleError(e, `${this.constructor.name}.buscarPorIdComRelacoes`); }
  }

  async buscarPorIdOuNull(id: number): Promise<T | null> {
    try { return await this.getRepo().buscarPorId(id); } catch { return null; }
  }

  // Assinatura compatível: criar(dados, usuarioId?) - segundo arg opcional
  // Corrige TS2416 em CandidaturaService.criar(dados, usuarioId)
  async criar(dados: any, _usuarioId?: number): Promise<T> {
    try { return await this.getRepo().criarGenerico(dados); }
    catch (e: any) { this.handleError(e, `${this.constructor.name}.criar`); }
  }

  async atualizar(id: number, dados: any): Promise<T | null> {
    try {
      if (!id) throw new Error('ID obrigatório para atualizar');
      const existente = await this.getRepo().buscarPorId(id);
      if (!existente) throw new Error('Registro não encontrado para atualizar');
      return await this.getRepo().atualizarGenerico(id, dados);
    } catch (e: any) { this.handleError(e, `${this.constructor.name}.atualizar`); }
  }

  async deletar(id: number): Promise<boolean> {
    try {
      if (!id) throw new Error('ID obrigatório para deletar');
      const existente = await this.getRepo().buscarPorId(id);
      if (!existente) throw new Error('Registro não encontrado para deletar');
      return await this.getRepo().deletarPorId(id);
    } catch (e: any) { this.handleError(e, `${this.constructor.name}.deletar`); }
  }

  async deletarPorId(id: number): Promise<boolean> { return this.deletar(id); }

  protected async buscarPorCampo(campo: string, valor: any): Promise<T | null> {
    try {
      const r = this.getRepo();
      const result = await r.query(`SELECT * FROM ${r.tableName} WHERE ${campo} = $1 LIMIT 1`, [valor]);
      const rows = result.rows || result;
      return rows[0] ? r.mapRow(rows[0]) : null;
    } catch (e: any) { this.handleError(e, `${this.constructor.name}.buscarPorCampo`); }
  }

  protected async listarPorCampo(campo: string, valor: any): Promise<T[]> {
    try {
      const r = this.getRepo();
      const result = await r.query(`SELECT * FROM ${r.tableName} WHERE ${campo} = $1 ORDER BY id`, [valor]);
      return r.mapRows(result.rows || result);
    } catch (e: any) { this.handleError(e, `${this.constructor.name}.listarPorCampo`); }
  }
}
