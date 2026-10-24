import { BaseRepository } from './BaseRepository';
export class VagaRepository extends BaseRepository {
    public async buscarMuralSemBloqueiosDeAvaliacao(freelaId: number): Promise<any[]> {
        const sql = `SELECT v.* FROM vagas v WHERE v.status = 'PENDENTE' AND v.contratante_id NOT IN (SELECT avaliado_id FROM avaliacoes WHERE avaliador_id = $1 AND nota <= 2)`;
        return await this.query(sql, [freelaId]);
    }
    public async salvar(dados: any): Promise<any[]> {
        const sql = `INSERT INTO vagas (contratante_id, funcao, data_hora, horas_estimadas, valor_hora_limpo, ajuda_custo_transporte, endereco_completo) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        return await this.query(sql, [dados.contratanteId, dados.funcao, dados.dataHora, dados.horasEstimadas, dados.valorHoraLimpo, dados.ajudaCustoTransporte, dados.enderecoCompleto]);
    }
}
