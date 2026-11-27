import { BaseService } from './BaseService';
import { PermissaoRepository } from '../repositories/PermissaoRepository';
export class PermissaoService extends BaseService {
  constructor() { super(new PermissaoRepository()); }
  private repo = new PermissaoRepository();
  // Matriz RBAC: [{ role_id, role_nome, permissoes: [{chave, nome, categoria}] }] — formato
  // que o PainelPermissoesCategorias ja espera (item.role_id, item.role_nome, item.permissoes).
  async matriz(): Promise<any[]> { return await this.repo.matriz(); }
  async listar(): Promise<any[]> { return await this.repo.listar(); }
  async categorias(): Promise<string[]> { return await this.repo.categorias(); }
  async criar(dados: any): Promise<any> { return await this.repo.criar(dados); }
  async atualizar(id: number, dados: any): Promise<any> { return await this.repo.atualizar(Number(id), dados); }
}
