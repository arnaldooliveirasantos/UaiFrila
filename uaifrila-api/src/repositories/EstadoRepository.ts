
import { BaseRepository } from './BaseRepository';

export class EstadoRepository extends BaseRepository {
  async listarTodos() {
    try {
      // Retorna todos os estados, mas com flag ativo - frontend filtra se quiser só ativos
      return await this.query(`SELECT e.*, p.nome as pais_nome, p.sigla as pais_sigla FROM estados e LEFT JOIN paises p ON p.id = e.pais_id ORDER BY e.ativo DESC, e.nome ASC`);
    } catch {
      return await this.query(`SELECT * FROM estados ORDER BY ativo DESC, nome ASC`);
    }
  }

  async listarAtivos() {
    try {
      return await this.query(`SELECT e.*, p.nome as pais_nome, p.sigla as pais_sigla FROM estados e LEFT JOIN paises p ON p.id = e.pais_id WHERE e.ativo=true ORDER BY e.nome ASC`);
    } catch {
      return await this.query(`SELECT * FROM estados WHERE ativo=true ORDER BY nome ASC`);
    }
  }

  async buscarPorId(id: number) {
    return await this.queryOne(`SELECT * FROM estados WHERE id=$1`, [id]);
  }

  async buscarPorSigla(sigla: string) {
    return await this.queryOne(`SELECT * FROM estados WHERE UPPER(sigla)=UPPER($1) LIMIT 1`, [sigla]);
  }

  async listarComCidades() {
    try {
      return await this.query(`
        SELECT e.*, COUNT(c.id) as total_cidades, COUNT(CASE WHEN c.ativa=true THEN 1 END) as cidades_ativas
        FROM estados e
        LEFT JOIN cidades c ON c.estado_id = e.id
        WHERE e.ativo=true
        GROUP BY e.id
        ORDER BY e.nome ASC
      `);
    } catch {
      return await this.listarAtivos();
    }
  }

  async ativarEstado(sigla: string) {
    return await this.query(`UPDATE estados SET ativo=true WHERE UPPER(sigla)=UPPER($1) RETURNING *`, [sigla]);
  }

  async desativarEstado(sigla: string) {
    return await this.query(`UPDATE estados SET ativo=false WHERE UPPER(sigla)=UPPER($1) RETURNING *`, [sigla]);
  }
}
