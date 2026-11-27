import { BaseService } from './BaseService';
import { CategoriaFuncaoRepository } from '../repositories/CategoriaFuncaoRepository';
import { CategoriaFuncaoModel } from '../models/CategoriaFuncaoModel';
export class CategoriaFuncaoService extends BaseService<CategoriaFuncaoModel> {
  constructor() { super(new CategoriaFuncaoRepository()); }
  async listarAtivas(): Promise<CategoriaFuncaoModel[]> { return await (this.getRepo() as CategoriaFuncaoRepository).listarAtivas(); }
  async listarComFuncoes(): Promise<any[]> {
    const r = await (this.getRepo() as any).query(`SELECT cf.id AS categoria_id, cf.nome AS categoria_nome, cf.icone,
      f.id AS funcao_id, f.nome AS funcao_nome FROM categorias_funcao cf LEFT JOIN funcoes f ON f.categoria_id = cf.id AND f.ativa = true WHERE cf.ativa = true ORDER BY cf.nome, f.nome`);
    return r.rows || [];
  }
}
