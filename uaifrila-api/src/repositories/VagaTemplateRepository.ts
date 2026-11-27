import { BaseRepository } from './BaseRepository';
import { VagaTemplateModel } from '../models/VagaTemplateModel';
export class VagaTemplateRepository extends BaseRepository<VagaTemplateModel> {
  constructor() { super('vaga_templates', VagaTemplateModel); }
  async listarAtivos(): Promise<any[]> {
    const r = await this.query(`SELECT vt.*, f.nome as funcao_nome FROM vaga_templates vt LEFT JOIN funcoes f ON f.id = vt.funcao_id WHERE vt.ativo = true ORDER BY vt.nome`);
    return r.rows || [];
  }
}
