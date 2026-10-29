
import { BaseRepository } from './BaseRepository';
import { DateUtil } from '../utils/DateUtil';

export class VagaRepository extends BaseRepository {

  async criarEnderecoVaga(dados: { vaga_id: number; endereco_completo: string; bairro?: string; cidade_id?: number; cidade_nome: string; estado?: string; lat?: number; lng?: number; }){
    try{ await this.query(`UPDATE enderecos_Vaga SET is_ativo=false WHERE vaga_id=$1 AND is_ativo=true`, [dados.vaga_id]); }catch{}
    const rows = await this.query(`INSERT INTO enderecos_Vaga (vaga_id, endereco_completo, bairro, cidade_id, cidade_nome, estado, lat, lng, is_ativo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true) RETURNING *`, [dados.vaga_id, dados.endereco_completo, dados.bairro||'Centro', dados.cidade_id||1, dados.cidade_nome||'Uberlândia', dados.estado||'MG', dados.lat||null, dados.lng||null]);
    return rows[0];
  }

  // CRIA VAGA - segue exatamente as colunas do 00-CRIACAO-BANCO-NOVO-COMPLETO.sql
  async criarVaga(dados: any){
    const client = await this.pool.connect();
    try{
      await client.query('BEGIN');
      const { contratante_id, titulo, descricao, funcao, valor_servico, valor_transporte, valor_hora, data_inicio, data_fim, timezone, endereco_completo, bairro, cidade_id, cidade_nome, estado, lat, lng, numero } = dados;
      const tz = timezone || 'America/Sao_Paulo';
      const inicioUTC0 = DateUtil.paraUTC0(data_inicio, tz);
      const fimUTC0 = DateUtil.paraUTC0(data_fim, tz);

      // Calculo alinhado com variaveis_sistema: TAXA_PIX 1%, TAXA_CARTAO 4%, COMISSAO 10%
      const d1 = new Date(inicioUTC0); const d2 = new Date(fimUTC0);
      let horas = (d2.getTime() - d1.getTime()) / (1000*60*60);
      if (horas <=0 || isNaN(horas)) horas = 8;

      const vServ = Number(valor_servico || 75);
      const vTransp = Number(valor_transporte || 15);
      const base = vServ + vTransp;

      // Busca taxas do banco se existirem
      let taxaPix = 1, taxaCartao = 4, comissao = 10;
      try{
        const vars = await client.query(`SELECT chave, valor_numerico FROM variaveis_sistema WHERE chave IN ('TAXA_PIX_PERCENTUAL','TAXA_CARTAO_PERCENTUAL','COMISSAO_APLICATIVO')`);
        for(const r of vars.rows){
          if(r.chave==='TAXA_PIX_PERCENTUAL') taxaPix = Number(r.valor_numerico);
          if(r.chave==='TAXA_CARTAO_PERCENTUAL') taxaCartao = Number(r.valor_numerico);
          if(r.chave==='COMISSAO_APLICATIVO') comissao = Number(r.valor_numerico);
        }
      }catch{}

      const meio = dados.meio_pagamento || 'pix';
      const taxaPct = meio === 'cartao' ? taxaCartao : taxaPix;
      const freelaRecebe = base - (base*taxaPct/100) - (base*comissao/100);
      const vHoraFinal = Number(valor_hora || 0) >0 ? Number(valor_hora) : (freelaRecebe / horas);

      // INSERT com colunas REAIS do banco: valor_servico, valor_transporte, total_freela, valor_hora
      const res = await client.query(
        `INSERT INTO vagas (contratante_id, titulo, descricao, funcao, valor_hora, valor_servico, valor_transporte, total_freela, status, data_inicio, data_fim) 
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ABERTA',$9::timestamptz,$10::timestamptz) RETURNING *`,
        [contratante_id, titulo, descricao, funcao||'Garçom', vHoraFinal, vServ, vTransp, freelaRecebe, inicioUTC0, fimUTC0]
      );
      const vagaId = res.rows[0].id;

      if(endereco_completo){
        const enderecoFinal = numero ? `${endereco_completo}, ${numero}` : endereco_completo;
        await client.query(`UPDATE enderecos_Vaga SET is_ativo=false WHERE vaga_id=$1`, [vagaId]);
        await client.query(`INSERT INTO enderecos_Vaga (vaga_id, endereco_completo, bairro, cidade_id, cidade_nome, estado, lat, lng, is_ativo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)`, [vagaId, enderecoFinal, bairro||'Centro', cidade_id||1, cidade_nome||'Uberlândia', estado||'MG', lat||null, lng||null]);
      }

      await client.query('COMMIT');
      return await this.queryOne(`SELECT v.*, ev.endereco_completo, ev.bairro as endereco_bairro, ev.cidade_nome, ev.estado FROM vagas v LEFT JOIN enderecos_Vaga ev ON ev.vaga_id=v.id AND ev.is_ativo=true WHERE v.id=$1`, [vagaId]);
    }catch(e){ await client.query('ROLLBACK'); throw e; }finally{ client.release(); }
  }

  async listarVagasPorContratante(contratanteId: number){
    return await this.query(
      `SELECT v.id, v.titulo, v.descricao, v.funcao, v.valor_hora, v.valor_servico, v.valor_transporte, v.total_freela, v.status, 
              to_char(v.data_inicio AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio,
              to_char(v.data_fim AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim,
              v.criado_em, ev.endereco_completo, ev.bairro as endereco_bairro, ev.cidade_nome, ev.estado
       FROM vagas v LEFT JOIN enderecos_Vaga ev ON ev.vaga_id=v.id AND ev.is_ativo=true 
       WHERE v.contratante_id=$1 ORDER BY v.criado_em DESC`, [contratanteId]
    );
  }

  async buscarMuralSemBloqueiosDeAvaliacao(usuarioId: number, page=1, limit=20){
    const offset = (page-1)*limit;
    return await this.query(
      `SELECT v.id, v.titulo, v.descricao, v.funcao, v.valor_hora, v.valor_servico, v.valor_transporte, v.total_freela, v.status,
              to_char(v.data_inicio AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio,
              to_char(v.data_fim AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim,
              ev.endereco_completo, ev.bairro as endereco_bairro, ev.cidade_nome, ev.estado, u.nome_completo as contratante_nome
       FROM vagas v 
       LEFT JOIN enderecos_Vaga ev ON ev.vaga_id=v.id AND ev.is_ativo=true 
       LEFT JOIN usuarios u ON u.id=v.contratante_id
       WHERE v.status IN ('ABERTA','PENDENTE') AND v.contratante_id != $1
       ORDER BY v.criado_em DESC LIMIT $2 OFFSET $3`, [usuarioId, limit, offset]
    );
  }

  async buscarPorId(id: number){
    return await this.queryOne(
      `SELECT v.*, ev.endereco_completo, ev.bairro as endereco_bairro, ev.cidade_id, ev.cidade_nome, ev.estado, ev.lat, ev.lng,
              to_char(v.data_inicio AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio,
              to_char(v.data_fim AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim
       FROM vagas v LEFT JOIN enderecos_Vaga ev ON ev.vaga_id=v.id AND ev.is_ativo=true WHERE v.id=$1`, [id]
    );
  }

  async atualizarVaga(id: number, dados: any){
    const client = await this.pool.connect();
    try{
      await client.query('BEGIN');
      const cur = await client.query(`SELECT * FROM vagas WHERE id=$1`, [id]);
      if(cur.rows.length===0) throw new Error('Vaga não encontrada');
      const v = cur.rows[0];

      const titulo = dados.titulo ?? v.titulo;
      const descricao = dados.descricao ?? v.descricao;
      const funcao = dados.funcao ?? v.funcao;
      const vServ = Number(dados.valor_servico ?? v.valor_servico ?? 75);
      const vTransp = Number(dados.valor_transporte ?? v.valor_transporte ?? 15);
      const meio = dados.meio_pagamento ?? 'pix';
      const taxaPct = meio === 'cartao' ? 4 : 1;
      const totalFreela = (vServ + vTransp) - ((vServ+vTransp)*taxaPct/100) - ((vServ+vTransp)*10/100);
      
      let dataInicio = dados.data_inicio || v.data_inicio;
      let dataFim = dados.data_fim || v.data_fim;
      let horas = 8;
      try{ const d1 = new Date(dataInicio); const d2 = new Date(dataFim); horas = (d2.getTime()-d1.getTime())/(1000*60*60); }catch{}
      if(horas<=0) horas=8;
      const vHora = totalFreela / horas;

      await client.query(
        `UPDATE vagas SET titulo=$1, descricao=$2, funcao=$3, valor_hora=$4, valor_servico=$5, valor_transporte=$6, total_freela=$7, data_inicio=$8::timestamptz, data_fim=$9::timestamptz, atualizado_em=NOW() WHERE id=$10`,
        [titulo, descricao, funcao, vHora, vServ, vTransp, totalFreela, dataInicio, dataFim, id]
      );

      if(dados.endereco_completo){
        await client.query(`UPDATE enderecos_Vaga SET is_ativo=false WHERE vaga_id=$1`, [id]);
        await client.query(`INSERT INTO enderecos_Vaga (vaga_id, endereco_completo, bairro, cidade_id, cidade_nome, estado, lat, lng, is_ativo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)`, [id, dados.endereco_completo, dados.bairro||'Centro', dados.cidade_id||1, dados.cidade_nome||'Uberlândia', dados.estado||'MG', dados.lat||null, dados.lng||null]);
      }

      await client.query('COMMIT');
      return await this.queryOne(`SELECT v.*, ev.endereco_completo FROM vagas v LEFT JOIN enderecos_Vaga ev ON ev.vaga_id=v.id AND ev.is_ativo=true WHERE v.id=$1`, [id]);
    }catch(e){ await client.query('ROLLBACK'); throw e; }finally{ client.release(); }
  }

  async cancelarVaga(id: number){
    return await this.query(`UPDATE vagas SET status='CANCELADA', atualizado_em=NOW() WHERE id=$1`, [id]);
  }

  async deletarVaga(id: number){
    return await this.query(`DELETE FROM vagas WHERE id=$1`, [id]);
  }
}
