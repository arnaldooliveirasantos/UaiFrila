import { BaseRepository } from './BaseRepository';
import { PermissaoModel } from '../models/PermissaoModel';
// Fonte real: usuarios.permissoes (JSONB) + tipos_usuario. A versao antiga fazia
// SELECT na tabela `permissoes`, que NAO existe — toda query falhava e o controller
// devolvia [] silenciosamente. E a matriz do SistemaControllers era um stub
// ({ message: 'implementar' }). Agora a matriz vem de dados reais.
function normalizarEntrada(e: any): any {
  if (typeof e === 'string') return { chave: e, nome: e, categoria: 'geral' };
  if (e && typeof e === 'object') return { chave: e.chave || e.nome, nome: e.nome || e.chave, categoria: e.categoria || 'geral', descricao: e.descricao || null, ...e };
  return null;
}
export class PermissaoRepository extends BaseRepository<PermissaoModel> {
  constructor() { super('permissoes', PermissaoModel); }
  private async tipos(): Promise<any[]> {
    const r = await this.query(`SELECT id, chave, descricao FROM tipos_usuario ORDER BY id`);
    return r.rows || [];
  }
  private async permissoesPorTipo(): Promise<Map<number, any[]>> {
    const mapa = new Map<number, any[]>();
    const r = await this.query(`SELECT tipo_usuario_id, permissoes FROM usuarios WHERE permissoes IS NOT NULL`);
    for (const row of r.rows || []) {
      const lista = Array.isArray(row.permissoes) ? row.permissoes : [];
      const atual = mapa.get(Number(row.tipo_usuario_id)) || [];
      for (const e of lista) { const n = normalizarEntrada(e); if (n) atual.push(n); }
      mapa.set(Number(row.tipo_usuario_id), atual);
    }
    return mapa;
  }
  async matriz(): Promise<any[]> {
    const tipos = await this.tipos();
    const porTipo = await this.permissoesPorTipo();
    return tipos.map((t: any) => {
      const vistos = new Set<string>();
      const permissoes = (porTipo.get(Number(t.id)) || []).filter((p: any) => {
        if (vistos.has(p.chave)) return false; vistos.add(p.chave); return true;
      });
      return { role_id: t.id, id: t.id, tipo_id: t.id, role_nome: t.descricao || t.chave, nome: t.descricao || t.chave, chave: t.chave, tipo_chave: t.chave, permissoes };
    });
  }
  async listar(): Promise<any[]> {
    const m = await this.matriz();
    const out: any[] = [];
    for (const tipo of m) for (const p of tipo.permissoes) out.push({ ...p, tipo_id: tipo.id, tipo_nome: tipo.nome, tipo_chave: tipo.chave });
    return out;
  }
  async categorias(): Promise<string[]> {
    const lista = await this.listar();
    return [...new Set(lista.map((p: any) => p.categoria || 'geral'))].sort();
  }
  // Criar = acrescentar a permissao no JSONB de TODOS os usuarios do tipo informado.
  async criar(dados: { nome: string; chave: string; categoria?: string; descricao?: string; tipo_id: number }): Promise<any> {
    const tipoId = Number(dados.tipo_id);
    if (!tipoId || isNaN(tipoId)) throw new Error('tipo_id obrigatorio para criar uma permissao');
    const chave = dados.chave || dados.nome;
    if (!chave) throw new Error('chave/nome obrigatorio');
    const entrada = JSON.stringify({ chave, nome: dados.nome || chave, categoria: dados.categoria || 'geral', descricao: dados.descricao || null });
    const r = await this.query(
      `UPDATE usuarios SET permissoes = COALESCE(permissoes, '[]'::jsonb) || $1::jsonb
       WHERE tipo_usuario_id = $2 AND NOT (COALESCE(permissoes, '[]'::jsonb) @> $1::jsonb)`,
      [entrada, tipoId]);
    return { chave, nome: dados.nome || chave, categoria: dados.categoria || 'geral', descricao: dados.descricao || null, tipo_id: tipoId, usuarios_afetados: r.rowCount || 0 };
  }
  // Atualizar = renomear a chave em todos os JSONB que a contem (o :id da rota e a chave antiga).
  async atualizar(chaveAntiga: string, dados: { nome?: string; categoria?: string; descricao?: string; chave?: string }): Promise<any> {
    if (!chaveAntiga) throw new Error('chave antiga obrigatoria (parametro :id da rota)');
    const r = await this.query(`SELECT id, permissoes FROM usuarios WHERE permissoes IS NOT NULL AND permissoes::text ILIKE $1`, [`%${chaveAntiga}%`]);
    let atualizados = 0;
    for (const row of r.rows || []) {
      const lista = Array.isArray(row.permissoes) ? row.permissoes : [];
      let mudou = false;
      const nova = lista.map((e: any) => {
        const n = normalizarEntrada(e);
        if (!n || n.chave !== chaveAntiga) return e;
        mudou = true;
        return { ...n, chave: dados.chave || n.chave, nome: dados.nome || n.nome, categoria: dados.categoria || n.categoria, descricao: dados.descricao ?? n.descricao };
      });
      if (mudou) {
        await this.query(`UPDATE usuarios SET permissoes = $1::jsonb WHERE id = $2`, [JSON.stringify(nova), row.id]);
        atualizados++;
      }
    }
    if (!atualizados) throw new Error(`Permissao '${chaveAntiga}' nao encontrada em nenhum usuario`);
    return { chave: dados.chave || chaveAntiga, nome: dados.nome || null, categoria: dados.categoria || null, descricao: dados.descricao || null, usuarios_afetados: atualizados };
  }
}
