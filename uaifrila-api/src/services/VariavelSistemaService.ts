import { BaseService } from './BaseService';
import { VariavelSistemaRepository } from '../repositories/VariavelSistemaRepository';
import { VariavelSistemaModel } from '../models/VariavelSistemaModel';
// Tabela EXISTENTE: id, chave, valor, valor_numerico, categoria, descricao, atualizado_em
// CORRECAO: faltava buscarPorChave — o VariavelSistemaController novo chama this.service.buscarPorChave().
export class VariavelSistemaService extends BaseService<VariavelSistemaModel> {
  constructor() { super(new VariavelSistemaRepository()); }
  private get repoVar(): VariavelSistemaRepository { return this.getRepo() as VariavelSistemaRepository; }
  async buscarPorChave(chave: string): Promise<VariavelSistemaModel | null> {
    return await this.repoVar.buscarPorChave(chave);
  }
  async buscarValorObrigatorio(chave: string): Promise<string> {
    const v = await this.buscarPorChave(chave);
    if (!v || v.valor == null) throw new Error(`Variavel de sistema nao encontrada: ${chave}`);
    return v.valor;
  }
  async buscarValor(chave: string, fallback: string): Promise<string> {
    try {
      const r = this.repoVar;
      if (typeof (r as any).buscarValor === 'function') return await (r as any).buscarValor(chave, fallback);
      const v: any = await (r as any).buscarPorChave(chave);
      return v ? (v.valor ?? fallback) : fallback;
    } catch { return fallback; }
  }
  async buscarNumero(chave: string, fallback: number): Promise<number> {
    try {
      const v = await this.buscarPorChave(chave);
      if (!v) return fallback;
      const n = parseFloat((v as any).valor_numerico ?? (v as any).valorNumerico ?? (v as any).valor);
      return isNaN(n) ? fallback : n;
    } catch { return fallback; }
  }
  async buscarBoolean(chave: string, fallback: boolean): Promise<boolean> {
    const v = await this.buscarValor(chave, String(fallback));
    return v === 'true' || v === '1';
  }
  async getConfigCancelamento() {
    const prazoHoras = await this.buscarNumero('PRAZO_CANCELAMENTO_CANDIDATURA_HORAS', 24);
    const prazoVagaHoras = await this.buscarNumero('PRAZO_CANCELAMENTO_VAGA_HORAS', 24);
    const motivoMin = await this.buscarNumero('MOTIVO_CANCELAMENTO_MIN_CARACTERES', 10);
    const notificar = await this.buscarBoolean('NOTIFICAR_CANCELAMENTO', true);
    return { prazoHoras, prazoVagaHoras, motivoMin, notificar };
  }
  async listarPorCategoria(categoria: string): Promise<VariavelSistemaModel[]> {
    try { return await this.repoVar.listarPorCategoria(categoria); }
    catch { return await this.listarPorCampo('categoria', categoria); }
  }
  async listarPorGrupo(grupo: string): Promise<VariavelSistemaModel[]> { return this.listarPorCategoria(grupo); }
  async atualizarPorChave(chave: string, valor: string): Promise<VariavelSistemaModel | null> {
    const existente: any = await this.repoVar.buscarPorChave(chave);
    if (!existente) throw new Error(`Variavel ${chave} nao encontrada`);
    const num = parseFloat(valor);
    const payload: any = { valor: String(valor), atualizado_em: new Date() };
    if (!isNaN(num)) payload.valor_numerico = num;
    return await this.getRepo().atualizarGenerico(existente.id, payload);
  }
}
