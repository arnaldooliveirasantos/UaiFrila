import { BaseRepository } from './BaseRepository';
import { UsuarioModel } from '../models/UsuarioModel';
// Enriquecido (funções/experiência): foto, experiência declarada e comprovada
// na função da vaga, outras funções, histórico no app e avaliação por função.
export class CandidatoRepository extends BaseRepository<UsuarioModel> {
  constructor() { super('usuarios', UsuarioModel); }
  async listarCandidatosPorVaga(vagaId: number): Promise<any[]> {
    const r = await this.query(`
      SELECT u.id AS freela_id, u.nome_completo AS nome, u.foto AS foto,
             COALESCE(AVG(a.nota), 5.0) AS media_avaliacao,
             COUNT(a.id) AS total_avaliacoes,
             v.funcao AS funcao_vaga,
             COALESCE(vc.trampos_concluidos, 0) AS trampos_funcao_comprovados,
             vc.media_avaliacao_funcao AS media_funcao,
             vc.ultimo_trampo_em AS ultimo_trampo_funcao_em,
             COALESCE(h.trampos_concluidos, 0) AS trampos_concluidos_app,
             COALESCE(h.candidaturas_canceladas, 0) AS candidaturas_canceladas,
             (SELECT COALESCE(json_agg(x), '[]'::json) FROM (
               SELECT f.nome AS funcao_nome, uf.tempo_experiencia_meses, uf.ainda_trabalha,
                      COALESCE(vc2.trampos_concluidos, 0) AS trampos_comprovados
               FROM usuario_funcoes uf JOIN funcoes f ON f.id = uf.funcao_id
               LEFT JOIN vw_experiencia_comprovada vc2 ON vc2.usuario_id = uf.usuario_id AND vc2.funcao_nome = f.nome
               WHERE uf.usuario_id = u.id ORDER BY uf.tempo_experiencia_meses DESC LIMIT 6) x) AS funcoes_declaradas,
             (SELECT COALESCE(json_agg(y), '[]'::json) FROM (
               SELECT a2.nota, a2.comentario, a2.criado_em FROM avaliacoes a2
               WHERE a2.avaliado_id = u.id ORDER BY a2.criado_em DESC LIMIT 2) y) AS avaliacoes_recentes
      FROM usuarios u
      LEFT JOIN candidaturas c ON c.usuario_id = u.id OR c.freela_id = u.id
      LEFT JOIN avaliacoes a ON a.avaliado_id = u.id
      LEFT JOIN vagas v ON v.id = $1
      LEFT JOIN vw_experiencia_comprovada vc ON vc.usuario_id = u.id AND vc.funcao_nome = v.funcao
      LEFT JOIN vw_historico_freela h ON h.usuario_id = u.id
      WHERE c.vaga_id = $1
      GROUP BY u.id, u.nome_completo, u.foto, v.funcao, vc.trampos_concluidos, vc.media_avaliacao_funcao, vc.ultimo_trampo_em, h.trampos_concluidos, h.candidaturas_canceladas
      ORDER BY media_avaliacao DESC, u.nome_completo ASC`, [vagaId]);
    return r.rows || [];
  }
}
