
import { BaseRepository } from './BaseRepository';

export class EnderecoVagaRepository extends BaseRepository {
  async criar(dados: { vaga_id: number; endereco_completo: string; bairro?: string; cidade_id?: number; cidade_nome: string; estado?: string; lat?: number; lng?: number; }) {
    await this.query(`UPDATE enderecos_Vaga SET is_ativo=false WHERE vaga_id=$1 AND is_ativo=true`, [dados.vaga_id]);
    const rows = await this.query(`INSERT INTO enderecos_Vaga (vaga_id, endereco_completo, bairro, cidade_id, cidade_nome, estado, lat, lng, is_ativo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true) RETURNING *`, [dados.vaga_id, dados.endereco_completo, dados.bairro||'Centro', dados.cidade_id||1, dados.cidade_nome||'Uberlândia', dados.estado||'MG', dados.lat||null, dados.lng||null]);
    return rows[0];
  }

  async listarPorVaga(vagaId: number) {
    return await this.query(`SELECT * FROM enderecos_Vaga WHERE vaga_id=$1 ORDER BY is_ativo DESC, criado_em DESC`, [vagaId]);
  }

  async buscarAtivo(vagaId: number) {
    return await this.queryOne(`SELECT * FROM enderecos_Vaga WHERE vaga_id=$1 AND is_ativo=true`, [vagaId]);
  }
}
