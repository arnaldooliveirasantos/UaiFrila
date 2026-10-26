import { BaseRepository } from './BaseRepository';

export class AdminFinanceiroRepository extends BaseRepository {
    
    public async listarVariaveisSistema(): Promise<any[]> {
        return await this.query('SELECT * FROM variaveis_sistema ORDER BY categoria, chave');
    }

    public async listarVariaveisAmbiente(): Promise<any[]> {
        return await this.listarVariaveisSistema();
    }

    // REUTILIZAÇÃO - alias para compatibilidade com service antigo
    public async listarVariaveis(): Promise<any[]> {
        return await this.listarVariaveisSistema();
    }

    public async atualizarVariavelSistema(chave: string, valor: string, valorNumerico?: number): Promise<any[]> {
        return await this.query('UPDATE variaveis_sistema SET valor = $1, valor_numerico = $3, atualizado_em = NOW() WHERE chave = $2 RETURNING *', [valor, chave, valorNumerico || null]);
    }

    public async atualizarVariavelAmbiente(chave: string, valor: string): Promise<any[]> {
        return await this.atualizarVariavelSistema(chave, valor);
    }

    // REUTILIZAÇÃO - alias para salvarVariavel
    public async salvarVariavel(dados: any): Promise<any> {
        const { chave, valor, valor_numerico, descricao } = dados;
        const existing = await this.queryOne(`SELECT id FROM variaveis_sistema WHERE chave = $1`, [chave]);
        if (existing) {
            const rows = await this.atualizarVariavelSistema(chave, valor, valor_numerico);
            return rows[0] || null;
        } else {
            const rows = await this.query(`INSERT INTO variaveis_sistema (chave, valor, valor_numerico, descricao) VALUES ($1,$2,$3,$4) RETURNING *`, [chave, valor, valor_numerico || null, descricao || null]);
            return rows[0] || null;
        }
    }

    public async buscarVariavel(chave: string): Promise<any> {
        const rows = await this.query('SELECT * FROM variaveis_sistema WHERE chave = $1', [chave]);
        return rows[0] || null;
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

    // REUTILIZAÇÃO - alias para relatorioTransacoes
    public async relatorioTransacoes(filtros: any = {}): Promise<any[]> {
        const { dataInicio, dataFim } = filtros;
        if (dataInicio && dataFim) {
            return await this.buscarTransacoesPorPeriodo(dataInicio, dataFim);
        }
        try {
            return await this.query(`SELECT * FROM transacoes ORDER BY criado_em DESC LIMIT 100`);
        } catch {
            // Fallback para trampos se transacoes não existir
            return await this.query(`SELECT t.*, v.titulo, u.nome_completo as freela_nome FROM trampos t LEFT JOIN vagas v ON t.vaga_id = v.id LEFT JOIN usuarios u ON t.freela_id = u.id ORDER BY t.criado_em DESC LIMIT 100`);
        }
    }
}
