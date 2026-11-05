
import { PaisRepository } from '../repositories/PaisRepository';
import { PaisModel } from '../models/PaisModel';
import { BaseService } from './BaseService';

export class PaisService extends BaseService<PaisModel> {
  protected repository: PaisRepository;

  constructor() {
    super();
    this.repository = new PaisRepository();
  }

  
}
