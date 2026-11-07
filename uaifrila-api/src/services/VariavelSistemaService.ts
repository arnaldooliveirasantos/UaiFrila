import { BaseService } from './BaseService';
import { VariavelSistemaRepository } from '../repositories/VariavelSistemaRepository';
import { VariavelSistemaModel } from '../models/VariavelSistemaModel';

// Tabela EXISTENTE: id, chave, valor, valor_numerico, categoria, descricao, atualizado_em
// NÃO tem grupo / tipo / ativo
export class VariavelSistemaService extends BaseService<VariavelSistemaModel> {
  constructor() { super(new VariavelSistemaRepository()); }

  async buscarValor(chave: string, fallback: string): Promise<string> {
    try {
      const r = this.getRepo() as VariavelSistemaRepository;
      if (typeof (r as any).buscarValor === 'function') return await (r as any).buscarValor(chave, fallback);
      const v: any = await (r as any).buscarPorChave(chave);
      return v ? (v.valor ?? fallback) : fallback;
    } catch { return fallback; }
  }

  async buscarNumero(chave: string, fallback: number): Promise<number> {
    try {
      const r = this.getRepo() as VariavelSistemaRepository;
      if (typeof (r as any).buscarNumero === 'function') return await (r as any).buscarNumero(chave, fallback);
      const v = await this.buscarValor(chave, String(fallback));
      const n = Number(v);
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
    try {
      const r = this.getRepo() as VariavelSistemaRepository;
      if (typeof (r as any).listarPorCategoria === 'function') return await (r as any).listarPorCategoria(categoria);
      return await this.listarPorCampo('categoria', categoria);
    } catch { return []; }
  }

  // Compat: código antigo chamava listarPorGrupo
  async listarPorGrupo(grupo: string): Promise<VariavelSistemaModel[]> {
    return this.listarPorCategoria(grupo);
  }

  async atualizarPorChave(chave: string, valor: string): Promise<VariavelSistemaModel | null> {
    const existente: any = await (this.getRepo() as any).buscarPorChave(chave);
    if (!existente) throw new Error(`Variável ${chave} não encontrada`);
    const num = parseFloat(valor);
    const payload: any = { valor: String(valor), atualizado_em: new Date() };
    if (!isNaN(num)) payload.valor_numerico = num;
    return await this.getRepo().atualizarGenerico(existente.id, payload);
  }
}
