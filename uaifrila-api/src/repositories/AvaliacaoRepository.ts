
import { BaseRepository } from './BaseRepository';

export class AvaliacaoRepository extends BaseRepository {
  // Segue tabela avaliacoes: id, trampo_id, avaliador_id, avaliado_id, nota (1-5), comentario, criado_em
  async criar(dados: { trampo_id: number; avaliador_id: number; avaliado_id: number; nota: number; comentario?: string }) {
    if (dados.nota < 1 || dados.nota > 5) throw new Error('Nota deve ser de 1 a 5');
    const res = await this.query(
      `INSERT INTO avaliacoes (trampo_id, avaliador_id, avaliado_id, nota, comentario) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [dados.trampo_id, dados.avaliador_id, dados.avaliado_id, dados.nota, dados.comentario || null]
    );
    // Atualiza média do avaliado
    try {
      await this.query(
        `UPDATE usuarios SET avaliacao_media = (SELECT AVG(nota) FROM avaliacoes WHERE avaliado_id=$1), total_avaliacoes = (SELECT COUNT(*) FROM avaliacoes WHERE avaliado_id=$1) WHERE id=$1`,
        [dados.avaliado_id]
      );
    } catch {}
    return res[0];
  }

  async listarPorUsuario(usuarioId: number) {
    return await this.query(`SELECT a.*, u.nome_completo as avaliador_nome FROM avaliacoes a JOIN usuarios u ON u.id=a.avaliador_id WHERE a.avaliado_id=$1 ORDER BY a.criado_em DESC`, [usuarioId]);
  }
}
