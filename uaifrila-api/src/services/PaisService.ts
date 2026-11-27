import { BaseService } from './BaseService';
import { PaisRepository } from '../repositories/PaisRepository';
import { PaisModel } from '../models/PaisModel';
// CORRIGIDO TS2611: sem 'get repository()' — BaseService ja declara 'repository' como propriedade.
// Cada metodo especifico usa getRepo() com cast local.
export class PaisService extends BaseService<PaisModel> {
  constructor() { super(new PaisRepository()); }
  async buscarPorSigla(sigla: string): Promise<PaisModel | null> {
    return await (this.getRepo() as PaisRepository).buscarPorSigla(sigla);
  }
}
