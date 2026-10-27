import { BaseRepository } from './BaseRepository';
import { DateUtil } from '../utils/DateUtil';

export class VagaRepository extends BaseRepository {

  async criarVaga(dados: any) {
    const { contratante_id, titulo, descricao, valor_hora, valor, data_inicio, data_fim, funcao, cidade_nome, cidade_id, endereco_id, bairro, timezone } = dados;
    const vHora = valor_hora || valor || 20;
    const deviceTz = timezone || 'America/Sao_Paulo';

    console.log(`\n[REPO criar] UTC0 - Recebido: ${data_inicio} tz=${deviceTz}`);
    
    const inicioUTC0 = DateUtil.paraUTC0(data_inicio, deviceTz);
    const fimUTC0 = DateUtil.paraUTC0(data_fim, deviceTz);
    
    console.log(`[REPO criar] ${data_inicio} (${deviceTz}) => ${inicioUTC0} UTC0`);

    const sql = `
      WITH nova_vaga AS (
        INSERT INTO vagas (contratante_id, titulo, descricao, valor_hora, data_inicio, data_fim, funcao, cidade_nome, cidade_id, endereco_id, bairro, status) 
        VALUES ($1,$2,$3,$4,$5::timestamptz,$6::timestamptz,$7,$8,$9,$10,$11,'ABERTA') 
        RETURNING *
      )
      SELECT 
        nova_vaga.*,
        to_char(nova_vaga.data_inicio AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio,
        to_char(nova_vaga.data_fim AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim,
        to_char(nova_vaga.criado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as criado_em,
        to_char(nova_vaga.atualizado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as atualizado_em
      FROM nova_vaga
    `;
    const params = [contratante_id, titulo, descricao, vHora, inicioUTC0, fimUTC0, funcao || 'Garçom', cidade_nome || 'Uberlândia', cidade_id || 1, endereco_id || null, bairro || 'Centro'];
    
    const rows = await this.query(sql, params);
    console.log(`[REPO criar] UTC0: ${rows[0]?.data_inicio}`);
    
    return rows[0];
  }

  async listarVagas(filtros: any = {}) {
    const sql = `
      SELECT 
        v.*,
        to_char(v.data_inicio AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio,
        to_char(v.data_fim AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim,
        to_char(v.criado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as criado_em,
        to_char(v.atualizado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as atualizado_em
      FROM vagas v 
      WHERE v.status IN ('ABERTA','PENDENTE') OR v.status IS NULL 
      ORDER BY v.criado_em DESC LIMIT 100
    `;
    return await this.query(sql);
  }

  async listarVagasPorContratante(contratanteId: number) {
    if (!contratanteId) return await this.listarVagas();
    const sql = `
      SELECT 
        v.*,
        (SELECT COUNT(*) FROM candidaturas c WHERE c.vaga_id = v.id) as total_candidaturas,
        to_char(v.data_inicio AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio,
        to_char(v.data_fim AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim,
        to_char(v.criado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as criado_em,
        to_char(v.atualizado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as atualizado_em
      FROM vagas v 
      WHERE v.contratante_id = $1 
      ORDER BY v.criado_em DESC
    `;
    return await this.query(sql, [contratanteId]);
  }

  async buscarPorId(id: number) {
    const sql = `
      SELECT 
        v.*,
        to_char(v.data_inicio AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio,
        to_char(v.data_fim AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim,
        to_char(v.criado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as criado_em,
        to_char(v.atualizado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as atualizado_em
      FROM vagas v 
      WHERE v.id = $1
    `;
    const row = await this.queryOne(sql, [id]);
    if (row) {
      console.log(`[REPO buscarPorId #${id}] UTC0: ${row.data_inicio}`);
    }
    return row || null;
  }

  async buscarMuralSemBloqueiosDeAvaliacao(usuarioId: number) {
    if (!usuarioId) return await this.listarVagas();
    const sql = `
      SELECT 
        v.*,
        u.nome_fantasia as contratante_nome,
        to_char(v.data_inicio AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio,
        to_char(v.data_fim AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim,
        to_char(v.criado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as criado_em,
        to_char(v.atualizado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as atualizado_em
      FROM vagas v 
      LEFT JOIN usuarios u ON v.contratante_id = u.id 
      WHERE (v.status IN ('ABERTA','PENDENTE') OR v.status IS NULL) AND v.contratante_id != $1 
      ORDER BY v.criado_em DESC LIMIT 100
    `;
    return await this.query(sql, [usuarioId]);
  }

  async atualizarVaga(id: number, dados: any) {
    const deviceTz = dados.timezone || 'America/Sao_Paulo';
    console.log(`\n[REPO atualizar #${id}] UTC0 - Recebido: ${dados.data_inicio} tz=${deviceTz}`);

    const permitidas = ['titulo','descricao','funcao','valor_hora','cidade_nome','cidade_id','endereco_id','bairro','status'];
    const campos: string[] = []; const valores: any[] = []; let idx = 1;
    for (const k of permitidas) {
      let v = (dados as any)[k]; if (k === 'valor_hora' && v === undefined) v = (dados as any).valor;
      if (v !== undefined) { campos.push(`${k} = $${idx}`); valores.push(v); idx++; }
    }

    if (dados.data_inicio) {
      const utc0 = DateUtil.paraUTC0(dados.data_inicio, deviceTz);
      console.log(`[REPO atualizar] ${dados.data_inicio} (${deviceTz}) => ${utc0} UTC0`);
      campos.push(`data_inicio = $${idx}::timestamptz`); valores.push(utc0); idx++;
    }
    if (dados.data_fim) {
      const utc0 = DateUtil.paraUTC0(dados.data_fim, deviceTz);
      console.log(`[REPO atualizar] ${dados.data_fim} (${deviceTz}) => ${utc0} UTC0`);
      campos.push(`data_fim = $${idx}::timestamptz`); valores.push(utc0); idx++;
    }

    if (campos.length === 0) throw new Error('Nenhum campo válido');
    valores.push(id);
    const sql = `
      UPDATE vagas SET ${campos.join(', ')}, atualizado_em = NOW() 
      WHERE id = $${idx} 
      RETURNING 
        id,
        to_char(data_inicio AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio,
        to_char(data_fim AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim,
        to_char(criado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as criado_em,
        to_char(atualizado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as atualizado_em
    `;
    const rows = await this.query(sql, valores);
    console.log(`[REPO atualizar #${id}] Novo UTC0: ${rows[0]?.data_inicio}`);
    
    return await this.buscarPorId(id);
  }

  async cancelarVaga(id: number) {
    const sql = `
      UPDATE vagas SET status = 'CANCELADA', atualizado_em = NOW() 
      WHERE id = $1 
      RETURNING 
        id, status,
        to_char(data_inicio AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio,
        to_char(data_fim AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim,
        to_char(atualizado_em AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as atualizado_em
    `;
    const rows = await this.query(sql, [id]);
    return rows[0];
  }
  async deletarVaga(id: number) { return await this.cancelarVaga(id); }
  async deletar(id: number) { return await this.cancelarVaga(id); }
}
