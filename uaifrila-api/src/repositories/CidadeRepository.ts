import { BaseRepository } from './BaseRepository';

export class CidadeRepository extends BaseRepository {

  async garantirTabela() {
    try {
      await this.query(`
        CREATE TABLE IF NOT EXISTS cidades (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(100) NOT NULL,
          estado VARCHAR(2) DEFAULT 'MG',
          codigo_ibge VARCHAR(10),
          ativa BOOLEAN DEFAULT true,
          lat DOUBLE PRECISION,
          lng DOUBLE PRECISION,
          raio_km INT DEFAULT 20,
          populacao INT,
          regiao VARCHAR(50),
          criado_em TIMESTAMP DEFAULT NOW(),
          atualizado_em TIMESTAMP DEFAULT NOW()
        )
      `);
    } catch {}
    try { await this.query(`ALTER TABLE cidades ADD COLUMN IF NOT EXISTS ativa BOOLEAN DEFAULT true`); } catch {}
    try { await this.query(`ALTER TABLE cidades ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION`); } catch {}
    try { await this.query(`ALTER TABLE cidades ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION`); } catch {}
    try { await this.query(`ALTER TABLE cidades ADD COLUMN IF NOT EXISTS raio_km INT DEFAULT 20`); } catch {}
  }

  async buscarTodasComHierarquia() {
    await this.garantirTabela();
    try {
      return await this.query(`SELECT id, nome, estado, ativa, lat, lng, raio_km, codigo_ibge, populacao, regiao, criado_em FROM cidades ORDER BY estado, nome`);
    } catch {
      return [];
    }
  }

  async buscarAtivas() {
    await this.garantirTabela();
    return await this.query(`SELECT id, nome, estado, lat, lng, raio_km, codigo_ibge, regiao FROM cidades WHERE ativa = true ORDER BY nome`);
  }

  async atualizarStatus(id: number, ativo: boolean) {
    await this.garantirTabela();
    const rows = await this.query(`UPDATE cidades SET ativa = $1, atualizado_em = NOW() WHERE id = $2 RETURNING *`, [ativo, id]);
    return rows[0];
  }

  async criarOuAtualizar(dados: any) {
    await this.garantirTabela();
    const existe = await this.queryOne(`SELECT id FROM cidades WHERE LOWER(nome) = LOWER($1) AND estado = $2`, [dados.nome, dados.estado || 'MG']);
    if (existe) {
      return await this.query(`UPDATE cidades SET ativa = $1, lat = COALESCE($2, lat), lng = COALESCE($3, lng), raio_km = COALESCE($4, raio_km), atualizado_em = NOW() WHERE id = $5 RETURNING *`,
        [dados.ativa ?? true, dados.lat, dados.lng, dados.raio_km, existe.id]);
    } else {
      return await this.query(`INSERT INTO cidades (nome, estado, ativa, lat, lng, raio_km, codigo_ibge, regiao) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [dados.nome, dados.estado || 'MG', dados.ativa ?? true, dados.lat, dados.lng, dados.raio_km || 20, dados.codigo_ibge, dados.regiao]);
    }
  }
}