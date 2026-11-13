import { BaseRepository } from './BaseRepository';
import { EnderecoVagaModel } from '../models/EnderecoVagaModel';

export class EnderecoVagaRepository extends BaseRepository<EnderecoVagaModel> {
  constructor() { super('enderecos_vaga', EnderecoVagaModel); }

  async buscarAtivoPorVaga(vagaId: number): Promise<any> {
    const r = await this.query(`SELECT ev.*, e.*, c.nome as cidade_nome, e2.sigla as cidade_estado FROM enderecos_vaga ev JOIN enderecos e ON e.id = ev.endereco_id LEFT JOIN cidades c ON c.id = e.cidade_id LEFT JOIN estados e2 ON e2.id = c.estado_id WHERE ev.vaga_id = $1 AND ev.ativo = true LIMIT 1`, [vagaId]);
    const rows = r.rows || r;
    return rows[0] || null;
  }

  async listarPorVaga(vagaId: number): Promise<EnderecoVagaModel[]> {
    const r = await this.query(`SELECT * FROM enderecos_vaga WHERE vaga_id = $1 AND ativo = true ORDER BY id`, [vagaId]);
    return this.mapRows(r.rows || r);
  }

  async listarPorEndereco(enderecoId: number): Promise<EnderecoVagaModel[]> {
    const r = await this.query(`SELECT * FROM enderecos_vaga WHERE endereco_id = $1 AND ativo = true ORDER BY id`, [enderecoId]);
    return this.mapRows(r.rows || r);
  }

  async vincular(vagaId: number, enderecoId: number): Promise<EnderecoVagaModel> {
    // Desativa vínculos antigos da vaga e cria o novo
    await this.query(`UPDATE enderecos_vaga SET ativo = false WHERE vaga_id = $1`, [vagaId]);
    return await this.criarGenerico({ vaga_id: vagaId, endereco_id: enderecoId, ativo: true });
  }

  async desvincular(vagaId: number, enderecoId: number): Promise<boolean> {
    const r = await this.query(`UPDATE enderecos_vaga SET ativo = false WHERE vaga_id = $1 AND endereco_id = $2 RETURNING id`, [vagaId, enderecoId]);
    const rows = r.rows || r;
    return rows.length > 0;
  }
}
