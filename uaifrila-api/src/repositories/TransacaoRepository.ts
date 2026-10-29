
import { BaseRepository } from './BaseRepository';

export class TransacaoRepository extends BaseRepository {
  // Segue tabela transacoes do 00-CRIACAO-BANCO-NOVO-COMPLETO.sql
  async listarPorUsuario(usuarioId: number) {
    return await this.query(
      `SELECT t.*, v.titulo as vaga_titulo, c.nome as cidade_nome_real
       FROM transacoes t
       LEFT JOIN vagas v ON v.id=t.vaga_id
       LEFT JOIN cidades c ON c.id=t.cidade_id
       WHERE t.freela_id=$1 OR t.contratante_id=$1 OR t.usuario_id=$1
       ORDER BY t.criado_em DESC LIMIT 100`,
      [usuarioId]
    );
  }

  async listarTodas() {
    return await this.query(
      `SELECT t.*, v.titulo as vaga_titulo, c.nome as cidade_nome_real
       FROM transacoes t
       LEFT JOIN vagas v ON v.id=t.vaga_id
       LEFT JOIN cidades c ON c.id=t.cidade_id
       ORDER BY t.criado_em DESC LIMIT 100`
    );
  }

  async criar(dados: any) {
    // Geração de código via trigger fn_gerar_codigo_transacao
    const res = await this.query(
      `INSERT INTO transacoes (vaga_id, trampo_id, freela_id, contratante_id, cidade_id, cidade_nome, valor_base, taxa_percentual, taxa_valor, ajuda_custo, valor_total_contratante, valor_liquido_freela, status, metodo_pagamento, data_inicio, usuario_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'AGUARDANDO_PAGAMENTO',$13,$14,$15) RETURNING *`,
      [dados.vaga_id, dados.trampo_id, dados.freela_id, dados.contratante_id, dados.cidade_id, dados.cidade_nome, dados.valor_base, dados.taxa_percentual, dados.taxa_valor, dados.ajuda_custo, dados.valor_total_contratante, dados.valor_liquido_freela, dados.metodo_pagamento||'PIX', dados.data_inicio, dados.usuario_id]
    );
    return res[0];
  }
}
