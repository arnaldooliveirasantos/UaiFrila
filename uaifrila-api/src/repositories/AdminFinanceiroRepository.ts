import { BaseRepository } from './BaseRepository';

export class AdminFinanceiroRepository extends BaseRepository {
    
    public async listarVariaveisAmbiente(): Promise<any[]> {
        return await this.query('SELECT * FROM variaveis_ambiente ORDER BY chave');
    }

    public async atualizarVariavelAmbiente(chave: string, valor: string): Promise<any[]> {
        return await this.query('UPDATE variaveis_ambiente SET valor = \$1 WHERE chave = \$2 RETURNING *', [valor, chave]);
    }

    public async buscarTransacoesPorPeriodo(dataInicio: string, dataFim: string): Promise<any[]> {
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
