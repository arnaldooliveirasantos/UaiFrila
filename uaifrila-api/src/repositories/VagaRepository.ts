// FILE: uaifrila-api/src/repositories/VagaRepository.ts
// SUBSTITUIR arquivo inteiro - corrige campos + paginação + transacao

import { BaseRepository } from './BaseRepository';

export class VagaRepository extends BaseRepository {
  async criarVaga(dados: any) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const res = await client.query(
        `INSERT INTO vagas (contratante_id, titulo, descricao, funcao, valor_hora, data_inicio, data_fim, cidade_id, cidade_nome, endereco_id, bairro, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'PENDENTE') RETURNING *`,
        [
          dados.contratante_id,
          dados.titulo,
          dados.descricao,
          dados.funcao || 'Garçom',
          dados.valor_hora || dados.valor || 20,
          dados.data_inicio,
          dados.data_fim,
          dados.cidade_id || null,
          dados.cidade_nome || 'Uberlândia',
          dados.endereco_id || null,
          dados.bairro || 'Centro'
        ]
      );

      await client.query('COMMIT');
      return res.rows;
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Erro criar vaga:', (e as any).message);
      throw e;
    } finally {
      client.release();
    }
  }

  async listarVagas(filtros: any = {}) {
    return this.query(`SELECT * FROM vagas WHERE status = 'PENDENTE' ORDER BY criado_em DESC LIMIT 50`);
  }

  async buscarPorId(id: number) {
    return this.queryOne(`SELECT * FROM vagas WHERE id = $1`, [id]);
  }

  // NOVO: paginado e com filtros - usar no MuralVagasService
  async buscarMuralPaginado(usuarioId: number, filtros: { pagina?: number, limite?: number, cidade?: string, funcao?: string, bairro?: string }) {
    const pagina = Math.max(1, filtros.pagina || 1);
    const limite = Math.min(50, filtros.limite || 12);
    const offset = (pagina - 1) * limite;

    let where = "WHERE v.status = 'PENDENTE' AND v.contratante_id != $1";
    const params: any[] = [usuarioId];
    let idx = 2;

    if (filtros.cidade) { where += ` AND LOWER(v.cidade_nome) = LOWER($${idx})`; params.push(filtros.cidade); idx++; }
    if (filtros.funcao) { where += ` AND LOWER(v.funcao) = LOWER($${idx})`; params.push(filtros.funcao); idx++; }
    if (filtros.bairro) { where += ` AND LOWER(v.bairro) = LOWER($${idx})`; params.push(filtros.bairro); idx++; }

    const vagas = await this.query(
      `SELECT v.*, u.nome_fantasia as contratante_nome, u.avaliacao_media as contratante_avaliacao,
              (SELECT COUNT(*)::int FROM candidaturas c WHERE c.vaga_id = v.id) as total_candidaturas
       FROM vagas v LEFT JOIN usuarios u ON v.contratante_id = u.id
       ${where}
       ORDER BY v.criado_em DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, limite, offset]
    );

    const totalRes = await this.query(`SELECT COUNT(*)::int as total FROM vagas v ${where}`, params);
    return { vagas, total: totalRes[0]?.total || 0, pagina, limite, totalPaginas: Math.ceil((totalRes[0]?.total || 0) / limite) };
  }

  async buscarMuralSemBloqueiosDeAvaliacao(usuarioId: number) {
    // compatibilidade: retorna formato antigo mas usa novo por baixo
    const res = await this.buscarMuralPaginado(usuarioId, { pagina: 1, limite: 50 });
    return res.vagas;
  }
}
