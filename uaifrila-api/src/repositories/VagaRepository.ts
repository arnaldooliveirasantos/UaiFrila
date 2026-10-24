import { BaseRepository } from './BaseRepository';
export class VagaRepository extends BaseRepository {
    public async buscarMuralSemBloqueiosDeAvaliacao(freelaId: number): Promise<any[]> {
        return await this.query(`SELECT v.* FROM vagas v WHERE v.status = 'PENDENTE' AND v.contratante_id NOT IN (SELECT avaliado_id FROM avaliacoes WHERE avaliador_id = $1 AND nota <= 2)`, [freelaId]);
    }
}
