import { BaseService } from './BaseService';
import { FuncaoRepository } from '../repositories/FuncaoRepository';
import { FuncaoModel } from '../models/FuncaoModel';
// CORRIGIDO TS2611: sem 'get repository()' — BaseService ja declara 'repository' como propriedade.
// Cada metodo especifico usa getRepo() com cast local.
export class FuncaoService extends BaseService<FuncaoModel> {
  constructor() { super(new FuncaoRepository()); }
  async listarAtivas(): Promise<FuncaoModel[]> {
    return await (this.getRepo() as FuncaoRepository).listarAtivas();
  }
  async buscarPorNome(nome: string): Promise<FuncaoModel | null> {
    return await (this.getRepo() as FuncaoRepository).buscarPorNome(nome);
  }
}
