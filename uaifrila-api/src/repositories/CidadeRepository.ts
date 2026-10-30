import { BaseRepository } from './BaseRepository';

export class CidadeRepository extends BaseRepository {
  async listarTodas() {
    return await this.query(`SELECT * FROM cidades ORDER BY ativa DESC, nome ASC`);
  }

  async listarAtivas() {
    return await this.query(`SELECT * FROM cidades WHERE ativa=true ORDER BY nome ASC`);
  }

  async buscarPorId(id: number) {
    return await this.queryOne(`SELECT * FROM cidades WHERE id=$1`, [id]);
  }

  async criar(dados: any) {
    const res = await this.query(
      `INSERT INTO cidades (nome, estado, codigo_ibge, ativa, lat, lng, raio_km, populacao, regiao, status_expansao) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [dados.nome, dados.estado, dados.codigo_ibge, true, dados.lat, dados.lng, dados.raio_km||20, dados.populacao, dados.regiao, 'ATIVA']
    );
    return res[0];
  }

  async buscarTodasComHierarquia() {
    return await this.query('SELECT * FROM cidades ORDER BY nome');
  }

  async atualizarStatus(id: number, ativo: boolean) {
    const rows = await this.query('UPDATE cidades SET ativa=$2, atualizado_em=NOW() WHERE id=$1 RETURNING *', [id, ativo]);
    return rows[0] || null;
  }
}
