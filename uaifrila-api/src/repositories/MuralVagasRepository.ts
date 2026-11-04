import { BaseRepository } from './BaseRepository';

export class MuralVagasRepository extends BaseRepository {
  async buscarMural(usuarioId: number, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    // Corrigido: endereco é campo endereco, não endereco_completo, tabela enderecos_vaga lower case
    return await this.query(
      `SELECT v.id, v.titulo, v.descricao, v.funcao, v.valor_hora, v.valor_servico, v.valor_transporte, v.total_freela, v.status,
              to_char(v.data_inicio AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio,
              to_char(v.data_fim AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim,
              ev.endereco as endereco_completo, ev.bairro as endereco_bairro, c.nome as cidade_nome, e.sigla as estado,
              u.nome_completo as contratante_nome
       FROM vagas v
       LEFT JOIN enderecos_vaga ev ON ev.vaga_id=v.id AND ev.is_ativo=true
       LEFT JOIN cidades c ON c.id = ev.cidade_id
       LEFT JOIN estados e ON e.id = c.estado_id
       LEFT JOIN usuarios u ON u.id=v.contratante_id
       WHERE (v.status IN ('ABERTA','PENDENTE') OR v.status IS NULL) AND v.contratante_id != $1
       ORDER BY v.criado_em DESC LIMIT $2 OFFSET $3`,
      [usuarioId, limit, offset]
    );
  }
}
