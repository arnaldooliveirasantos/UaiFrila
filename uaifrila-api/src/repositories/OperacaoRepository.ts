import { BaseRepository } from './BaseRepository';

export class OperacaoRepository extends BaseRepository {
    
    public async checarAvaliacoesRuins(freelaId: number, vagaId: number): Promise<boolean> {
        const sql = `
            SELECT 1 FROM avaliacoes 
            WHERE ((avaliador_id = $1 AND avaliado_id = (SELECT contratante_id FROM vagas WHERE id = $2))
               OR (avaliador_id = (SELECT contratante_id FROM vagas WHERE id = $2) AND avaliado_id = $1))
              AND nota <= 2 LIMIT 1
        `;
        const rows = await this.query(sql, [freelaId, vagaId]);
        return rows.length > 0;
    }

    public async registrarCandidatura(vagaId: number, freelaId: number): Promise<void> {
        const sql = "INSERT INTO candidaturas (vaga_id, freela_id, status) VALUES (\$1, \$2, 'AGUARDANDO')";
        await this.query(sql, [vagaId, freelaId]);
    }

    public async iniciarTransacao(): Promise<void> { await this.query('BEGIN'); }
    public async confirmarTransacao(): Promise<void> { await this.query('COMMIT'); }
    public async cancelarTransacao(): Promise<void> { await this.query('ROLLBACK'); }

    public async aprovarCandidato(vagaId: number, freelaId: number): Promise<void> {
        await this.query("UPDATE candidaturas SET status = 'ACEITA' WHERE vaga_id = \$1 AND freela_id = \$2", [vagaId, freelaId]);
    }

    public async rejeitarDemaisCandidatos(vagaId: number, freelaId: number): Promise<void> {
        await this.query("UPDATE candidaturas SET status = 'RECUSADA' WHERE vaga_id = \$1 AND freela_id != \$2", [vagaId, freelaId]);
    }

    public async ativarStatusVaga(vagaId: number): Promise<void> {
        await this.query("UPDATE vagas SET status = 'ATIVA' WHERE id = \$1", [vagaId]);
    }

    public async criarTrampoAtivo(vagaId: number, freelaId: number, codInicio: string, codFim: string): Promise<any[]> {
        const sql = `
            INSERT INTO trampos (vaga_id, freela_id, codigo_inicio, codigo_fim, status) 
            VALUES ($1, $2, $3, $4, 'AGUARDANDO_PAGAMENTO') RETURNING *
        `;
        return await this.query(sql, [vagaId, freelaId, codInicio, codFim]);
    }

    public async registrarMensagemChat(vagaId: number, remetenteId: number, destId: number, conteudo: string): Promise<any[]> {
        const sql = `
            INSERT INTO mensagens_chat (vaga_id, remetente_id, destinatario_id, conteudo) 
            VALUES ($1, $2, $3, $4) RETURNING *
        `;
        return await this.query(sql, [vagaId, remetenteId, destId, conteudo]);
    }

    public async obterParticipantesVaga(vagaId: number): Promise<any> {
        const sql = "SELECT contratante_id, (SELECT freela_id FROM trampos WHERE vaga_id = \$1 LIMIT 1) as freela_id FROM vagas WHERE id = \$1";
        const rows = await this.query(sql, [vagaId]);
        return rows[0];
    }

    public async obterHistoricoMensagens(vagaId: number): Promise<any[]> {
        const sql = "SELECT * FROM mensagens_chat WHERE vaga_id = \$1 ORDER BY enviado_em ASC";
        return await this.query(sql, [vagaId]);
    }
}
