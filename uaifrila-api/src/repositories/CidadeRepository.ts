import { BaseRepository } from './BaseRepository';
export class CidadeRepository extends BaseRepository {
    public async buscarTodasComHierarquia(): Promise<any[]> {
        return await this.query(`SELECT c.id as cidade_id, c.nome as cidade_nome, c.ativo as cidade_ativa FROM cidades c`);
    }
    public async atualizarStatus(id: number, ativo: boolean): Promise<any[]> {
        return await this.query(`UPDATE cidades SET ativo = $1 WHERE id = $2 RETURNING *`, [ativo, id]);
    }
}
