import { BaseRepository } from './BaseRepository';

export class VagaRepository extends BaseRepository {
  async criarVaga(dados: any) {
    const { contratante_id, titulo, descricao, valor, data_inicio, funcao, cidade_nome } = dados;
    try {
      return await this.query(
        `INSERT INTO vagas (contratante_id, titulo, descricao, valor, data_inicio, funcao, cidade_nome, status) 
         VALUES ($1,$2,$3,$4,$5,$6,$7,'ABERTA') RETURNING *`,
        [contratante_id, titulo, descricao, valor || 100, data_inicio || new Date(), funcao || 'Garçom', cidade_nome || 'Uberlândia']
      );
    } catch (e: any) {
      console.error('Erro criar vaga:', e.message);
      throw e;
    }
  }

  async listarVagas(filtros: any = {}) {
    try {
      return await this.query(`SELECT * FROM vagas WHERE status = 'ABERTA' ORDER BY criado_em DESC LIMIT 50`);
    } catch (e: any) {
      console.warn('Vagas table error, returning empty:', e.message);
      return [];
    }
  }

  async buscarPorId(id: number) {
    try {
      return await this.queryOne(`SELECT * FROM vagas WHERE id = $1`, [id]);
    } catch {
      return null;
    }
  }

  async buscarMuralSemBloqueiosDeAvaliacao(usuarioId: number) {
    try {
      // Se usuarioId 0 ou super admin, retorna tudo
      if (!usuarioId || usuarioId === 0) {
        return await this.listarVagas();
      }
      return await this.query(
        `SELECT v.*, u.nome_fantasia as contratante_nome, u.avaliacao_media as contratante_avaliacao
         FROM vagas v
         LEFT JOIN usuarios u ON v.contratante_id = u.id
         WHERE v.status = 'ABERTA' 
         AND (v.contratante_id != $1 OR $1 = 0)
         ORDER BY v.criado_em DESC
         LIMIT 50`,
        [usuarioId]
      );
    } catch (e: any) {
      console.warn('buscarMural error:', e.message);
      return await this.listarVagas();
    }
  }
}
