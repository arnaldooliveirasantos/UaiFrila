import { BaseRepository } from './BaseRepository';
import { UsuarioFuncaoModel } from '../models/UsuarioFuncaoModel';
export class UsuarioFuncaoRepository extends BaseRepository<UsuarioFuncaoModel> {
  constructor() { super('usuario_funcoes', UsuarioFuncaoModel); }
  async listarPorUsuario(usuarioId: number): Promise<any[]> {
    const r = await this.query(`SELECT uf.*, f.nome AS funcao_nome, f.categoria_id, cf.nome AS categoria_nome,
      vc.trampos_concluidos AS trampos_comprovados, vc.media_avaliacao_funcao, vc.ultimo_trampo_em
      FROM usuario_funcoes uf JOIN funcoes f ON f.id = uf.funcao_id
      LEFT JOIN categorias_funcao cf ON cf.id = f.categoria_id
      LEFT JOIN vw_experiencia_comprovada vc ON vc.usuario_id = uf.usuario_id AND vc.funcao_nome = f.nome
      WHERE uf.usuario_id = $1 ORDER BY uf.ainda_trabalha DESC, uf.tempo_experiencia_meses DESC`, [usuarioId]);
    return r.rows || [];
  }
  async salvar(usuarioId: number, dados: any): Promise<any> {
    const funcaoId = Number(dados.funcao_id ?? dados.funcaoId);
    if (!funcaoId) throw new Error('funcao_id obrigatorio');
    const meses = Math.max(0, Number(dados.tempo_experiencia_meses ?? dados.tempoExperienciaMeses ?? 0) || 0);
    const r = await this.query(`INSERT INTO usuario_funcoes (usuario_id, funcao_id, tempo_experiencia_meses, onde_trabalhou, ainda_trabalha, origem, atualizado_em)
      VALUES ($1,$2,$3,$4,$5,'DECLARADA',NOW())
      ON CONFLICT (usuario_id, funcao_id) DO UPDATE SET tempo_experiencia_meses=EXCLUDED.tempo_experiencia_meses, onde_trabalhou=EXCLUDED.onde_trabalhou, ainda_trabalha=EXCLUDED.ainda_trabalha, atualizado_em=NOW() RETURNING *`,
      [usuarioId, funcaoId, meses, dados.onde_trabalhou ?? dados.ondeTrabalhou ?? null, dados.ainda_trabalha ?? dados.aindaTrabalha ?? true]);
    return r.rows?.[0] || null;
  }
  async remover(usuarioId: number, funcaoId: number): Promise<boolean> {
    const r = await this.query(`DELETE FROM usuario_funcoes WHERE usuario_id=$1 AND funcao_id=$2`, [usuarioId, funcaoId]);
    return (r.rowCount || 0) > 0;
  }
}
