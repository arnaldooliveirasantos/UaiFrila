import { BaseService } from './BaseService';
import { TipoEnderecoRepository } from '../repositories/TipoEnderecoRepository';
import { TipoEnderecoModel } from '../models/TipoEnderecoModel';
// CORRIGIDO TS2611: sem 'get repository()' — BaseService ja declara 'repository' como propriedade.
// Cada metodo especifico usa getRepo() com cast local.
export class TipoEnderecoService extends BaseService<TipoEnderecoModel> {
  constructor() { super(new TipoEnderecoRepository()); }
  async listarAtivos(): Promise<TipoEnderecoModel[]> {
    return await (this.getRepo() as TipoEnderecoRepository).listarAtivos();
  }
  async buscarPorChave(chave: string): Promise<TipoEnderecoModel | null> {
    return await (this.getRepo() as TipoEnderecoRepository).buscarPorChave(chave);
  }
}
