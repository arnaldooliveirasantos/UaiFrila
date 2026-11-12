import { PermissaoRepository } from '../repositories/PermissaoRepository';
export class PermissaoService {
  private repo = new PermissaoRepository();
  // Matriz RBAC: [{ role_id, role_nome, permissoes: [{chave, nome, categoria}] }] — formato
  // que o PainelPermissoesCategorias ja espera (item.role_id, item.role_nome, item.permissoes).
  async matriz(): Promise<any[]> { return await this.repo.matriz(); }
  async listar(): Promise<any[]> { return await this.repo.listar(); }
  async categorias(): Promise<string[]> { return await this.repo.categorias(); }
  async criar(dados: any): Promise<any> { return await this.repo.criar(dados); }
  async atualizar(chaveAntiga: string, dados: any): Promise<any> { return await this.repo.atualizar(chaveAntiga, dados); }
}
