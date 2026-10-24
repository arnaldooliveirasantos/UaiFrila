import { BaseRepository } from './BaseRepository';

export class TermoRepository extends BaseRepository {
    
    public async buscarTermoAtivoPorPerfil(tipoId: number): Promise<any[]> {
        const sql = `
            SELECT t.id as termo_id, t.versao, t.tipo_usuario_id,
                   i.id as item_id, i.texto_item, i.ordem, i.ativo_no_termo
            FROM termos_aceite t
            JOIN itens_termo_aceite i ON t.id = i.termo_id
            WHERE t.ativo = TRUE AND t.tipo_usuario_id = $1
            ORDER BY i.ordem ASC
        `;
        return await this.query(sql, [tipoId]);
    }

    public async desativarTermoAnterior(tipoId: number): Promise<void> {
        const sql = 'UPDATE termos_aceite SET ativo = FALSE WHERE tipo_usuario_id = \$1 AND ativo = TRUE';
        await this.query(sql, [tipoId]);
    }

    public async obterProximaVersao(tipoId: number): Promise<number> {
        const sql = 'SELECT COALESCE(MAX(versao), 0) as max_v FROM termos_aceite WHERE tipo_usuario_id = \$1';
        const rows = await this.query(sql, [tipoId]);
        return Number(rows[0].max_v) + 1;
    }

    public async criarNovoTermoPai(versao: number, tipoId: number): Promise<any> {
        const sql = 'INSERT INTO termos_aceite (versao, tipo_usuario_id, ativo) VALUES (\$1, \$2, TRUE) RETURNING id';
        const rows = await this.query(sql, [versao, tipoId]);
        return rows[0];
    }

    public async salvarItemDoTermo(termoId: number, texto: string, ordem: number): Promise<void> {
        const sql = 'INSERT INTO itens_termo_aceite (termo_id, texto_item, ordem, ativo_no_termo) VALUES (\$1, \$2, \$3, TRUE)';
        await this.query(sql, [termoId, texto, ordem]);
    }
}
