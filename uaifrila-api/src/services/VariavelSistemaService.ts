
import { VariavelSistemaRepository } from '../repositories/VariavelSistemaRepository';
import { VariavelSistemaModel } from '../models/VariavelSistemaModel';
import { BaseService } from './BaseService';

export class VariavelSistemaService extends BaseService<VariavelSistemaModel> {
  protected repository: VariavelSistemaRepository;

  constructor() {
    super();
    this.repository = new VariavelSistemaRepository();
  }

  async listarPorCategoria(categoria: string): Promise<VariavelSistemaModel[]> {
    try {
      this.validateRequired({ categoria }, ['categoria']);
      return await this.repository.listarPorCategoria(categoria);
    } catch (e: any) {
      this.handleError(e, 'VariavelSistemaService.listarPorCategoria');
    }
  }

  async buscarPorChave(chave: string): Promise<VariavelSistemaModel | null> {
    try {
      this.validateRequired({ chave }, ['chave']);
      return await this.repository.buscarPorChave(chave);
    } catch (e: any) {
      this.handleError(e, 'VariavelSistemaService.buscarPorChave');
    }
  }

  async atualizarPorChave(chave: string, valor: any): Promise<VariavelSistemaModel | null> {
    try {
      this.validateRequired({ chave }, ['chave']);
      const existente = await this.repository.buscarPorChave(chave);
      if (!existente) throw new Error('Variável não encontrada');
      return await this.repository.atualizarGenerico(existente.id, { 
        valor: String(valor), 
        valorNumerico: isNaN(Number(valor)) ? null : Number(valor), 
        atualizadoEm: new Date() 
      });
    } catch (e: any) {
      this.handleError(e, 'VariavelSistemaService.atualizarPorChave');
    }
  }

  async getValorNumerico(chave: string, padrao: number): Promise<number> {
    try {
      const variavel = await this.buscarPorChave(chave);
      if (!variavel) return padrao;
      const num = (variavel as any).valorNumerico ?? (variavel as any).valor_numerico ?? (variavel as any).valor;
      const parsed = parseFloat(num);
      return isNaN(parsed) ? padrao : parsed;
    } catch {
      return padrao;
    }
  }
}
