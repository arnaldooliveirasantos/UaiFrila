"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransacaoRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class TransacaoRepository extends BaseRepository_1.BaseRepository {
    async listarPorPeriodo(filtros) {
        const page = filtros.page || 1;
        const limit = filtros.limit || 20;
        const offset = (page - 1) * limit;
        let where = 'WHERE 1=1';
        const params = [];
        let idx = 1;
        if (filtros.inicio) {
            where += ` AND t.criado_em >= $${idx}`;
            params.push(filtros.inicio);
            idx++;
        }
        if (filtros.fim) {
            where += ` AND t.criado_em <= $${idx}`;
            params.push(filtros.fim);
            idx++;
        }
        if (filtros.status && filtros.status !== 'todos') {
            where += ` AND t.status = $${idx}`;
            params.push(filtros.status.toUpperCase());
            idx++;
        }
        if (filtros.cidade && filtros.cidade !== 'todas') {
            where += ` AND t.cidade_nome ILIKE $${idx}`;
            params.push(`%${filtros.cidade}%`);
            idx++;
        }
        const countQuery = `SELECT COUNT(*) as total FROM transacoes t ${where}`;
        const countResult = await this.query(countQuery, params);
        const total = parseInt(countResult[0]?.total || '0');
        const dataQuery = `
      SELECT 
        t.*,
        u1.nome_completo as freela_nome,
        u1.email as freela_email,
        u2.nome_completo as contratante_nome,
        u2.email as contratante_email,
        c.nome as cidade_nome_full
      FROM transacoes t
      LEFT JOIN usuarios u1 ON u1.id = t.freela_id
      LEFT JOIN usuarios u2 ON u2.id = t.contratante_id
      LEFT JOIN cidades c ON c.id = t.cidade_id
      ${where}
      ORDER BY t.criado_em DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `;
        params.push(limit, offset);
        const transacoes = await this.query(dataQuery, params);
        // Totais por período
        const totaisQuery = `
      SELECT 
        COUNT(*) as total_transacoes,
        COALESCE(SUM(t.valor_base),0) as total_base,
        COALESCE(SUM(t.taxa_valor),0) as total_taxas,
        COALESCE(SUM(t.valor_total_contratante),0) as total_contratante,
        COALESCE(SUM(t.valor_liquido_freela),0) as total_freela,
        COUNT(CASE WHEN t.status='FINALIZADA' THEN 1 END) as finalizadas,
        COUNT(CASE WHEN t.status='CANCELADA' THEN 1 END) as canceladas,
        COUNT(CASE WHEN t.status='PAGO_ESCROW' THEN 1 END) as em_escrow
      FROM transacoes t ${where}
    `;
        // Remove limit params for totais
        const totaisParams = params.slice(0, -2);
        const totais = await this.query(totaisQuery, totaisParams);
        return {
            transacoes,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totais: totais[0]
        };
    }
    async obterEstatisticas() {
        try {
            const stats = await this.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status='FINALIZADA' THEN 1 END) as finalizadas,
          COUNT(CASE WHEN status='PAGO_ESCROW' THEN 1 END) as escrow,
          COUNT(CASE WHEN status='CANCELADA' THEN 1 END) as canceladas,
          COUNT(CASE WHEN criado_em >= NOW() - INTERVAL '7 days' THEN 1 END) as ultimos_7dias,
          COUNT(CASE WHEN criado_em >= NOW() - INTERVAL '30 days' THEN 1 END) as ultimos_30dias,
          COALESCE(SUM(valor_total_contratante),0) as volume_total,
          COALESCE(SUM(taxa_valor),0) as taxas_total,
          COALESCE(AVG(valor_base),0) as ticket_medio
        FROM transacoes
      `);
            return stats[0];
        }
        catch (e) {
            return { total: 0, finalizadas: 0, escrow: 0, canceladas: 0, volume_total: 0, taxas_total: 0, ticket_medio: 0 };
        }
    }
    async obterPorStatus() {
        return await this.query(`
      SELECT status, COUNT(*) as quantidade, SUM(valor_total_contratante) as volume
      FROM transacoes GROUP BY status ORDER BY quantidade DESC
    `);
    }
    async obterPorCidade() {
        return await this.query(`
      SELECT cidade_nome, COUNT(*) as quantidade, SUM(valor_total_contratante) as volume
      FROM transacoes WHERE cidade_nome IS NOT NULL
      GROUP BY cidade_nome ORDER BY quantidade DESC LIMIT 10
    `);
    }
}
exports.TransacaoRepository = TransacaoRepository;
