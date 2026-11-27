import { BaseService } from './BaseService';
import { StatusUsuarioRepository } from '../repositories/StatusUsuarioRepository';
import { StatusUsuarioModel } from '../models/StatusUsuarioModel';
// CORRIGIDO TS2611: sem 'get repository()' — BaseService ja declara 'repository' como propriedade.
// Cada metodo especifico usa getRepo() com cast local.
export class StatusUsuarioService extends BaseService<StatusUsuarioModel> {
  constructor() { super(new StatusUsuarioRepository()); }
  async buscarPorChave(chave: string): Promise<StatusUsuarioModel | null> {
    return await (this.getRepo() as StatusUsuarioRepository).buscarPorChave(chave);
  }
}
