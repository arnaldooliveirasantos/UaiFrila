
import { BaseRepository } from './BaseRepository';

export class CandidaturaRepository extends BaseRepository {
  // Segue tabela candidaturas: id, vaga_id, usuario_id, freela_id, status, mensagem, criado_em
  async candidatar(vagaId: number, usuarioId: number, mensagem?: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const vaga = await client.query(`SELECT id, contratante_id, status FROM vagas WHERE id=$1 FOR UPDATE`, [vagaId]);
      if (vaga.rows.length === 0) throw new Error('Vaga não encontrada');
      if (vaga.rows[0].status === 'CANCELADA') throw new Error('Vaga cancelada');
      if (vaga.rows[0].contratante_id === usuarioId) throw new Error('Não pode candidatar na própria vaga');
      const existe = await client.query(`SELECT id FROM candidaturas WHERE vaga_id=$1 AND usuario_id=$2`, [vagaId, usuarioId]);
      if (existe.rows.length > 0) throw new Error('Você já se candidatou');
      const res = await client.query(
        `INSERT INTO candidaturas (vaga_id, usuario_id, freela_id, status, mensagem) VALUES ($1,$2,$2,'PENDENTE',$3) RETURNING *`,
        [vagaId, usuarioId, mensagem || null]
      );
      await client.query('COMMIT');
      return res.rows[0];
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }

  async listarPorVaga(vagaId: number) {
    return await this.query(
      `SELECT c.id, c.vaga_id, c.usuario_id, c.freela_id, c.status, c.mensagem, c.criado_em,
              u.nome_completo, u.avaliacao_media, u.funcao_principal, u.cidade_nome
       FROM candidaturas c JOIN usuarios u ON u.id=c.usuario_id WHERE c.vaga_id=$1 ORDER BY c.criado_em DESC`,
      [vagaId]
    );
  }

  async listarPorUsuario(usuarioId: number) {
    return await this.query(
      `SELECT c.*, v.titulo as vaga_titulo, v.funcao, v.valor_hora, v.status as vaga_status
       FROM candidaturas c JOIN vagas v ON v.id=c.vaga_id WHERE c.usuario_id=$1 ORDER BY c.criado_em DESC`,
      [usuarioId]
    );
  }

  async aceitar(vagaId: number, candidaturaId: number, contratanteId: number) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const vaga = await client.query(`SELECT id FROM vagas WHERE id=$1 AND contratante_id=$2 FOR UPDATE`, [vagaId, contratanteId]);
      if (vaga.rows.length === 0) throw new Error('Vaga não encontrada ou não é sua');
      await client.query(`UPDATE vagas SET status='PREENCHIDA', atualizado_em=NOW() WHERE id=$1`, [vagaId]);
      await client.query(`UPDATE candidaturas SET status='ACEITA', atualizado_em=NOW() WHERE id=$1 AND vaga_id=$2`, [candidaturaId, vagaId]);
      await client.query(`UPDATE candidaturas SET status='RECUSADA', atualizado_em=NOW() WHERE vaga_id=$1 AND id!=$2`, [vagaId, candidaturaId]);
      const cand = await client.query(`SELECT usuario_id FROM candidaturas WHERE id=$1`, [candidaturaId]);
      const freelaId = cand.rows[0].usuario_id;
      const trampo = await client.query(`INSERT INTO trampos (vaga_id, freela_id, contratante_id, status) VALUES ($1,$2,$3,'ACEITO') RETURNING *`, [vagaId, freelaId, contratanteId]);
      await client.query('COMMIT');
      return trampo.rows[0];
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }
}
