import { BaseService } from './BaseService';
import { VagaTemplateRepository } from '../repositories/VagaTemplateRepository';
// Fase 3: templates de vaga. ANTES usava BaseRepository.getPool().query direto (fura o padrao).
// AGORA: Repository proprio (Model/Repository/Service/Controller).
export class VagaTemplateService extends BaseService {
  constructor() { super(new VagaTemplateRepository()); }
  async listar(): Promise<any[]> { return await (this.getRepo() as VagaTemplateRepository).listarAtivos(); }
}
