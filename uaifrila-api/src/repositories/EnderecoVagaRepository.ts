import { BaseRepository } from './BaseRepository';
import { EnderecoVagaModel } from '../models/EnderecoVagaModel';
export class EnderecoVagaRepository extends BaseRepository<EnderecoVagaModel> {
  constructor() { super('enderecos_vaga', EnderecoVagaModel); }
  async listarPorVaga(vagaId: number): Promise<EnderecoVagaModel[]> {
    const result = await this.query(`SELECT * FROM enderecos_vaga WHERE vaga_id = $1 AND ativo = true`, [vagaId]);
    return this.mapRows(result.rows || result);
  }
  async listarPorEndereco(enderecoId: number): Promise<EnderecoVagaModel[]> {
    const result = await this.query(`SELECT * FROM enderecos_vaga WHERE endereco_id = $1`, [enderecoId]);
    return this.mapRows(result.rows || result);
  }
  async vincular(vagaId: number, enderecoId: number): Promise<EnderecoVagaModel> {
    const result = await this.query(`INSERT INTO enderecos_vaga (vaga_id, endereco_id, ativo) VALUES ($1,$2,true) ON CONFLICT (vaga_id, endereco_id) DO UPDATE SET ativo = true RETURNING *`, [vagaId, enderecoId]);
    return this.mapRow((result.rows||result)[0]);
  }
  async desvincular(vagaId: number, enderecoId: number): Promise<boolean> {
    const result = await this.query(`UPDATE enderecos_vaga SET ativo = false WHERE vaga_id = $1 AND endereco_id = $2`, [vagaId, enderecoId]);
    return (result.rowCount||0) > 0;
  }
}
