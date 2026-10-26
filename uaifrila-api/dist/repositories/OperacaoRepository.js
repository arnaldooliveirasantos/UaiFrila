"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperacaoRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class OperacaoRepository extends BaseRepository_1.BaseRepository {
    async checarAvaliacoesRuins(freelaId, vagaId) {
        const sql = `
            SELECT 1 FROM avaliacoes 
            WHERE ((avaliador_id = $1 AND avaliado_id = (SELECT contratante_id FROM vagas WHERE id = $2))
               OR (avaliador_id = (SELECT contratante_id FROM vagas WHERE id = $2) AND avaliado_id = $1))
              AND nota <= 2 LIMIT 1
        `;
        const rows = await this.query(sql, [freelaId, vagaId]);
        return rows.length > 0;
    }
    async registrarCandidatura(vagaId, freelaId) {
        const sql = "INSERT INTO candidaturas (vaga_id, freela_id, status) VALUES (\$1, \$2, 'AGUARDANDO')";
        await this.query(sql, [vagaId, freelaId]);
    }
    async iniciarTransacao() { await this.query('BEGIN'); }
    async confirmarTransacao() { await this.query('COMMIT'); }
    async cancelarTransacao() { await this.query('ROLLBACK'); }
    async aprovarCandidato(vagaId, freelaId) {
        await this.query("UPDATE candidaturas SET status = 'ACEITA' WHERE vaga_id = \$1 AND freela_id = \$2", [vagaId, freelaId]);
    }
    async rejeitarDemaisCandidatos(vagaId, freelaId) {
        await this.query("UPDATE candidaturas SET status = 'RECUSADA' WHERE vaga_id = \$1 AND freela_id != \$2", [vagaId, freelaId]);
    }
    async ativarStatusVaga(vagaId) {
        await this.query("UPDATE vagas SET status = 'ATIVA' WHERE id = \$1", [vagaId]);
    }
    async criarTrampoAtivo(vagaId, freelaId, codInicio, codFim) {
        const sql = `
            INSERT INTO trampos (vaga_id, freela_id, codigo_inicio, codigo_fim, status) 
            VALUES ($1, $2, $3, $4, 'AGUARDANDO_PAGAMENTO') RETURNING *
        `;
        return await this.query(sql, [vagaId, freelaId, codInicio, codFim]);
    }
    async registrarMensagemChat(vagaId, remetenteId, destId, conteudo) {
        const sql = `
            INSERT INTO mensagens_chat (vaga_id, remetente_id, destinatario_id, conteudo) 
            VALUES ($1, $2, $3, $4) RETURNING *
        `;
        return await this.query(sql, [vagaId, remetenteId, destId, conteudo]);
    }
    async obterParticipantesVaga(vagaId) {
        const sql = "SELECT contratante_id, (SELECT freela_id FROM trampos WHERE vaga_id = \$1 LIMIT 1) as freela_id FROM vagas WHERE id = \$1";
        const rows = await this.query(sql, [vagaId]);
        return rows[0];
    }
    async obterHistoricoMensagens(vagaId) {
        const sql = "SELECT * FROM mensagens_chat WHERE vaga_id = \$1 ORDER BY enviado_em ASC";
        return await this.query(sql, [vagaId]);
    }
}
exports.OperacaoRepository = OperacaoRepository;
