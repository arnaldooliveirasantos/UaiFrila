import { BaseService } from './BaseService';
import { TipoUsuarioRepository } from '../repositories/TipoUsuarioRepository';
import { TipoUsuarioModel } from '../models/TipoUsuarioModel';
// CORRIGIDO TS2611: sem 'get repository()' — BaseService ja declara 'repository' como propriedade.
// Cada metodo especifico usa getRepo() com cast local.
export class TipoUsuarioService extends BaseService<TipoUsuarioModel> {
  constructor() { super(new TipoUsuarioRepository()); }
  async buscarPorChave(chave: string): Promise<TipoUsuarioModel | null> {
    return await (this.getRepo() as TipoUsuarioRepository).buscarPorChave(chave);
  }
}
