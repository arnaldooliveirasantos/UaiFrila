import { BaseRepository } from './BaseRepository';
import { PermissaoModel } from '../models/PermissaoModel';
// Fonte: tabela permissoes (14B). Reutiliza BaseRepository (criarGenerico/atualizarGenerico/buscarTodos),
// sem SQL espalhado e sem varrer usuarios.permissoes (JSONB).
export class PermissaoRepository extends BaseRepository<PermissaoModel> {
  constructor() { super('permissoes', PermissaoModel); }
  async matriz(): Promise<any[]> {
    const r = await this.query(`SELECT tu.id AS tipo_id, tu.chave AS tipo_chave, tu.nome_exibicao AS tipo_nome, p.id, p.chave, p.nome, p.categoria, p.descricao FROM tipos_usuario tu LEFT JOIN permissoes p ON p.tipo_usuario_id = tu.id ORDER BY tu.id, p.chave`);
    const porTipo = new Map<number, any>();
    for (const row of r.rows || []) {
      if (!porTipo.has(row.tipo_id)) porTipo.set(row.tipo_id, { role_id: row.tipo_id, id: row.tipo_id, tipo_id: row.tipo_id, role_nome: row.tipo_nome, nome: row.tipo_nome, chave: row.tipo_chave, tipo_chave: row.tipo_chave, permissoes: [] });
      if (row.id) porTipo.get(row.tipo_id).permissoes.push({ id: row.id, chave: row.chave, nome: row.nome, categoria: row.categoria, descricao: row.descricao, tipo_id: row.tipo_id });
    }
    return [...porTipo.values()];
  }
  async listar(): Promise<any[]> { return await this.buscarTodos(); }
  async categorias(): Promise<string[]> {
    const r = await this.query(`SELECT DISTINCT categoria FROM permissoes ORDER BY categoria`);
    return (r.rows || []).map((x: any) => x.categoria);
  }
  async criar(dados: { nome: string; chave: string; categoria?: string; descricao?: string; tipo_id: number }): Promise<any> {
    const tipoId = Number((dados as any).tipo_id ?? (dados as any).tipo_usuario_id);
    if (!tipoId || isNaN(tipoId)) throw new Error('tipo_id obrigatorio para criar uma permissao');
    return await this.criarGenerico({ chave: dados.chave || dados.nome, nome: dados.nome || dados.chave, categoria: dados.categoria || 'geral', descricao: dados.descricao || null, tipo_usuario_id: tipoId });
  }
  // :id da rota = id da permissao (antes era a chave antiga). Atualiza a linha.
  async atualizar(id: number, dados: { nome?: string; categoria?: string; descricao?: string; chave?: string }): Promise<any> {
    const payload: any = {};
    if (dados.chave !== undefined) payload.chave = dados.chave;
    if (dados.nome !== undefined) payload.nome = dados.nome;
    if (dados.categoria !== undefined) payload.categoria = dados.categoria;
    if (dados.descricao !== undefined) payload.descricao = dados.descricao;
    payload.atualizado_em = new Date();
    return await this.atualizarGenerico(Number(id), payload);
  }
}
