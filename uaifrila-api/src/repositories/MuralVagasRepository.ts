
import { BaseRepository } from './BaseRepository';

export class MuralVagasRepository extends BaseRepository {
  async buscarMural(usuarioId: number, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await this.query(
      `SELECT v.id, v.titulo, v.descricao, v.funcao, v.valor_hora, v.valor_servico, v.valor_transporte, v.total_freela, v.status,
              to_char(v.data_inicio AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio,
              to_char(v.data_fim AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim,
              ev.endereco_completo, ev.bairro as endereco_bairro, ev.cidade_nome, ev.estado,
              u.nome_completo as contratante_nome
       FROM vagas v
       LEFT JOIN enderecos_Vaga ev ON ev.vaga_id=v.id AND ev.is_ativo=true
       LEFT JOIN usuarios u ON u.id=v.contratante_id
       WHERE v.status IN ('ABERTA','PENDENTE') AND v.contratante_id != $1
       ORDER BY v.criado_em DESC LIMIT $2 OFFSET $3`,
      [usuarioId, limit, offset]
    );
  }
}
