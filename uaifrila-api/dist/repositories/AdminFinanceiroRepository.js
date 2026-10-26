"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminFinanceiroRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class AdminFinanceiroRepository extends BaseRepository_1.BaseRepository {
    async listarVariaveisSistema() {
        return await this.query('SELECT * FROM variaveis_sistema ORDER BY categoria, chave');
    }
    async listarVariaveisAmbiente() {
        // DEPRECATED - agora usa variaveis_sistema
        return await this.listarVariaveisSistema();
    }
    async atualizarVariavelSistema(chave, valor, valorNumerico) {
        return await this.query('UPDATE variaveis_sistema SET valor = $1, valor_numerico = $3, atualizado_em = NOW() WHERE chave = $2 RETURNING *', [valor, chave, valorNumerico || null]);
    }
    async atualizarVariavelAmbiente(chave, valor) {
        // DEPRECATED - agora usa variaveis_sistema
        return await this.atualizarVariavelSistema(chave, valor);
    }
    async buscarVariavel(chave) {
        const rows = await this.query('SELECT * FROM variaveis_sistema WHERE chave = $1', [chave]);
        return rows[0] || null;
    }
    async buscarTransacoesPorPeriodo(dataInicio, dataFim) {
        const sql = `
            SELECT t.id AS transacao_id, v.funcao, v.data_hora AS data,
                   u_cli.nome_fantasia AS contratante, u_fre.nome_completo AS freela,
                   ((v.horas_estimadas * v.valor_hora_limpo) + v.ajuda_custo_transporte) AS valor_cheio_usuario,
                   ROUND(((v.horas_estimadas * v.valor_hora_limpo) + v.ajuda_custo_transporte) * 0.10, 2) AS comissao_plataforma,
                   t.status
            FROM trampos t
            JOIN vagas v ON t.vaga_id = v.id
            JOIN usuarios u_cli ON v.contratante_id = u_cli.id
            JOIN usuarios u_fre ON t.freela_id = u_fre.id
            WHERE v.data_hora >= $1 AND v.data_hora <= $2
            ORDER BY v.data_hora DESC
        `;
        return await this.query(sql, [dataInicio, dataFim]);
    }
}
exports.AdminFinanceiroRepository = AdminFinanceiroRepository;
