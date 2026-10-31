
import { BaseRepository } from './BaseRepository';
import { DateUtil } from '../utils/DateUtil';

export class VagaRepository extends BaseRepository {

  // Modelo: endereco VARCHAR(150), bairro, cidade_id, cep, numero, complemento, lat, lng
  async criarEnderecoVaga(dados: { vaga_id: number; endereco?: string; bairro?: string; cidade_id?: number; cep?: string; numero?: string; complemento?: string; lat?: number; lng?: number; }) {
    try {
      await this.query(`UPDATE enderecos_Vaga SET is_ativo = false, atualizado_em = NOW() WHERE vaga_id = $1 AND is_ativo = true`, [dados.vaga_id]);
    } catch {}
    
    const sql = `INSERT INTO enderecos_Vaga (vaga_id, endereco, bairro, cidade_id, cep, numero, complemento, lat, lng, is_ativo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true) RETURNING id, vaga_id, endereco, bairro, cidade_id, cep, numero, complemento, lat, lng`;
    const params = [dados.vaga_id, dados.endereco || null, dados.bairro || 'Centro', dados.cidade_id || 1, dados.cep || null, dados.numero || null, dados.complemento || null, dados.lat || null, dados.lng || null];
    const rows = await this.query(sql, params);
    return rows[0];
  }

  async atualizarEnderecoVaga(vagaId: number, dados: any) {
    const existente = await this.queryOne(`SELECT id FROM enderecos_Vaga WHERE vaga_id = $1 AND is_ativo = true`, [vagaId]);
    if (!existente) {
      if (dados.endereco || dados.bairro || dados.cidade_id || dados.cep) {
        return await this.criarEnderecoVaga({ vaga_id: vagaId, endereco: dados.endereco, bairro: dados.bairro, cidade_id: dados.cidade_id, cep: dados.cep, numero: dados.numero, complemento: dados.complemento, lat: dados.lat, lng: dados.lng });
      }
      return null;
    }
    const permitidas = ['endereco','bairro','cidade_id','cep','numero','complemento','lat','lng'];
    const campos: string[] = []; const valores: any[] = []; let idx = 1;
    for (const k of permitidas) {
      const v = (dados as any)[k];
      if (v !== undefined) { campos.push(`${k} = $${idx}`); valores.push(v); idx++; }
    }
    if (campos.length === 0) return existente;
    valores.push(vagaId);
    const sql = `UPDATE enderecos_Vaga SET ${campos.join(', ')}, atualizado_em = NOW() WHERE vaga_id = $${idx} AND is_ativo = true RETURNING id, endereco, bairro, cidade_id, cep, numero, complemento`;
    const rows = await this.query(sql, valores);
    return rows[0];
  }

  async buscarEnderecoPorVagaId(vagaId: number) {
    try {
      return await this.queryOne(`SELECT * FROM enderecos_Vaga WHERE vaga_id = $1 AND is_ativo = true`, [vagaId]);
    } catch { return null; }
  }

  async criarVaga(dados: any) {
    const { contratante_id, titulo, descricao, funcao, valor_hora, valor_servico, valor_transporte, total_freela, data_inicio, data_fim, timezone, meio_pagamento, endereco, bairro, cidade_id, cep, numero, complemento, lat, lng } = dados;
    const deviceTz = timezone || 'America/Sao_Paulo';
    let inicioUTC0: string; let fimUTC0: string;
    try { inicioUTC0 = DateUtil.paraUTC0(data_inicio, deviceTz); fimUTC0 = DateUtil.paraUTC0(data_fim, deviceTz); } catch (e: any) { throw new Error(`Data inválida: ${e.message}`); }

    let vHora = Number(valor_hora || 0); let horas = 1;
    try { const d1 = new Date(inicioUTC0); const d2 = new Date(fimUTC0); horas = Math.round(((d2.getTime() - d1.getTime()) / (1000*60*60)) * 100) / 100; if (horas <= 0) horas = 1; } catch { horas = 1; }
    if (!vHora || vHora <= 0) {
      const vServ = Number(valor_servico || 75); const vTransp = Number(valor_transporte || 0); const base = vServ + vTransp;
      const taxaPercent = meio_pagamento === 'cartao' ? 0.04 : 0.01; const freelaRecebe = base - (base * taxaPercent) - (base * 0.10); vHora = freelaRecebe / horas;
    }
    const vServFinal = Number(valor_servico || 75);
    const vTranspFinal = Number(valor_transporte || 0);
    const totalFreela = Number(total_freela || vServFinal + vTranspFinal);

    const sql = `INSERT INTO vagas (contratante_id, titulo, descricao, funcao, valor_hora, valor_servico, valor_transporte, total_freela, data_inicio, data_fim) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::timestamptz,$10::timestamptz) RETURNING id, valor_hora, valor_servico, valor_transporte, total_freela, to_char(data_inicio AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio, to_char(data_fim AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim`;
    const params = [contratante_id, titulo, descricao, funcao || 'Garçom', vHora, vServFinal, vTranspFinal, totalFreela, inicioUTC0, fimUTC0];
    const rows = await this.query(sql, params);
    const vagaId = rows[0].id;

    if (endereco || bairro || cidade_id || cep) {
      try {
        await this.criarEnderecoVaga({ vaga_id: vagaId, endereco: endereco || null, bairro: bairro || 'Centro', cidade_id: cidade_id || 1, cep: cep || null, numero: numero || null, complemento: complemento || null, lat: lat || null, lng: lng || null });
      } catch (e: any) { console.error('[criarVaga] Erro endereco:', e.message); }
    }

    try {
      return await this.queryOne(`SELECT v.*, u.nome_completo as contratante_nome, u.email as contratante_email, c.nome as cidade_nome_real, ev.endereco, ev.bairro, ev.cep, ev.numero, ev.complemento, ev.cidade_id, ev.lat, ev.lng FROM vagas v JOIN usuarios u ON u.id = v.contratante_id LEFT JOIN enderecos_Vaga ev ON v.id = ev.vaga_id AND ev.is_ativo = true LEFT JOIN cidades c ON c.id = ev.cidade_id WHERE id = $1`, [vagaId]);
    } catch {
      try {
        return await this.queryOne(`SELECT v.*, ev.endereco, ev.bairro, ev.cidade_id, ev.cep, ev.numero, ev.complemento, ev.lat, ev.lng, to_char(v.data_inicio AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio, to_char(v.data_fim AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim FROM vagas v LEFT JOIN enderecos_Vaga ev ON ev.vaga_id = v.id AND ev.is_ativo = true WHERE v.id = $1`, [vagaId]);
      } catch { return rows[0]; }
    }
  }

  // Usa VIEW vw_mural_vagas para leitura
  async listarVagas() {
    try {
      return await this.query(`SELECT v.*, u.nome_completo as contratante_nome, u.email as contratante_email, c.nome as cidade_nome_real, ev.endereco, ev.bairro, ev.cep, ev.numero, ev.complemento, ev.cidade_id, ev.lat, ev.lng FROM vagas v JOIN usuarios u ON u.id = v.contratante_id LEFT JOIN enderecos_Vaga ev ON v.id = ev.vaga_id AND ev.is_ativo = true LEFT JOIN cidades c ON c.id = ev.cidade_id ORDER BY criado_em DESC LIMIT 100`);
    } catch (e:any) {
      console.log('[listarVagas] Fallback view:', e.message);
      return await this.query(`SELECT v.*, ev.endereco, ev.bairro, ev.cidade_id, ev.cep, ev.numero, ev.complemento, ev.lat, ev.lng, to_char(v.data_inicio AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio, to_char(v.data_fim AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim FROM vagas v LEFT JOIN enderecos_Vaga ev ON ev.vaga_id = v.id AND ev.is_ativo = true ORDER BY v.criado_em DESC LIMIT 100`);
    }
  }

  async listarVagasPorContratante(contratanteId: number) {
    try {
      return await this.query(`SELECT v.*, u.nome_completo as contratante_nome, u.email as contratante_email, c.nome as cidade_nome_real, ev.endereco, ev.bairro, ev.cep, ev.numero, ev.complemento, ev.cidade_id, ev.lat, ev.lng FROM vagas v JOIN usuarios u ON u.id = v.contratante_id LEFT JOIN enderecos_Vaga ev ON v.id = ev.vaga_id AND ev.is_ativo = true LEFT JOIN cidades c ON c.id = ev.cidade_id WHERE contratante_id = $1 ORDER BY criado_em DESC`, [contratanteId]);
    } catch {
      return await this.query(`SELECT v.*, ev.endereco, ev.bairro, ev.cidade_id, ev.cep, ev.numero, ev.complemento, ev.lat, ev.lng, to_char(v.data_inicio AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio, to_char(v.data_fim AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim FROM vagas v LEFT JOIN enderecos_Vaga ev ON ev.vaga_id = v.id AND ev.is_ativo = true WHERE v.contratante_id = $1 ORDER BY v.criado_em DESC`, [contratanteId]);
    }
  }

  async buscarPorId(id: number) {
    try {
      return await this.queryOne(`SELECT v.*, u.nome_completo as contratante_nome, u.email as contratante_email, c.nome as cidade_nome_real, ev.endereco, ev.bairro, ev.cep, ev.numero, ev.complemento, ev.cidade_id, ev.lat, ev.lng FROM vagas v JOIN usuarios u ON u.id = v.contratante_id LEFT JOIN enderecos_Vaga ev ON v.id = ev.vaga_id AND ev.is_ativo = true LEFT JOIN cidades c ON c.id = ev.cidade_id WHERE id = $1`, [id]);
    } catch {
      try {
        return await this.queryOne(`SELECT v.*, ev.id as endereco_vaga_id, ev.endereco, ev.bairro, ev.cidade_id, ev.cep, ev.numero, ev.complemento, ev.lat, ev.lng, to_char(v.data_inicio AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio, to_char(v.data_fim AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim FROM vagas v LEFT JOIN enderecos_Vaga ev ON ev.vaga_id = v.id AND ev.is_ativo = true WHERE v.id = $1`, [id]);
      } catch {
        return await this.queryOne(`SELECT v.*, to_char(v.data_inicio AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio, to_char(v.data_fim AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim FROM vagas v WHERE v.id = $1`, [id]);
      }
    }
  }

  // Mural - usa VIEW vw_mural_vagas
  async buscarMuralSemBloqueiosDeAvaliacao(usuarioId: number) {
    try {
      if (!usuarioId) return await this.query(`SELECT v.*, u.nome_completo as contratante_nome, u.email as contratante_email, c.nome as cidade_nome_real, ev.endereco, ev.bairro, ev.cep, ev.numero, ev.complemento, ev.cidade_id, ev.lat, ev.lng FROM vagas v JOIN usuarios u ON u.id = v.contratante_id LEFT JOIN enderecos_Vaga ev ON v.id = ev.vaga_id AND ev.is_ativo = true LEFT JOIN cidades c ON c.id = ev.cidade_id ORDER BY criado_em DESC LIMIT 100`);
      return await this.query(`SELECT v.*, u.nome_completo as contratante_nome, u.email as contratante_email, c.nome as cidade_nome_real, ev.endereco, ev.bairro, ev.cep, ev.numero, ev.complemento, ev.cidade_id, ev.lat, ev.lng FROM vagas v JOIN usuarios u ON u.id = v.contratante_id LEFT JOIN enderecos_Vaga ev ON v.id = ev.vaga_id AND ev.is_ativo = true LEFT JOIN cidades c ON c.id = ev.cidade_id WHERE contratante_id != $1 ORDER BY criado_em DESC LIMIT 100`, [usuarioId]);
    } catch (e:any) {
      console.log('[mural] Fallback view:', e.message);
      if (!usuarioId) return await this.listarVagas();
      return await this.query(`SELECT v.*, u.nome_fantasia as contratante_nome, ev.endereco, ev.bairro, ev.cidade_id, ev.cep, ev.numero, ev.complemento, to_char(v.data_inicio AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio, to_char(v.data_fim AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim FROM vagas v LEFT JOIN usuarios u ON v.contratante_id = u.id LEFT JOIN enderecos_Vaga ev ON ev.vaga_id = v.id AND ev.is_ativo = true WHERE v.contratante_id != $1 ORDER BY v.criado_em DESC LIMIT 100`, [usuarioId]);
    }
  }

  async buscarMuralVagas(usuarioId?: number) {
    return await this.buscarMuralSemBloqueiosDeAvaliacao(usuarioId || 0);
  }

  async atualizarVaga(id: number, dados: any) {
    const deviceTz = dados.timezone || 'America/Sao_Paulo';
    const permitidasVagas = ['titulo','descricao','funcao','valor_hora','valor_servico','valor_transporte','total_freela'];
    const campos: string[] = []; const valores: any[] = []; let idx = 1;

    let valorHoraCalculado: number | null = null;
    if (dados.valor_servico !== undefined || dados.valor_transporte !== undefined || dados.data_inicio || dados.data_fim || dados.meio_pagamento) {
      try {
        const vagaAtual = await this.buscarPorId(id);
        const vServ = dados.valor_servico ?? vagaAtual?.valor_servico ?? 75; 
        const vTransp = dados.valor_transporte ?? vagaAtual?.valor_transporte ?? 0; 
        const base = Number(vServ) + Number(vTransp);
        const meioPag = dados.meio_pagamento || 'pix'; const taxaPercent = meioPag === 'cartao' ? 0.04 : 0.01; 
        const freela = base - (base * taxaPercent) - (base * 0.10);
        const inicio = dados.data_inicio || vagaAtual?.data_inicio; const fim = dados.data_fim || vagaAtual?.data_fim;
        if (inicio && fim) { const inicioUTC0 = DateUtil.paraUTC0(inicio, deviceTz); const fimUTC0 = DateUtil.paraUTC0(fim, deviceTz); const horas = (new Date(fimUTC0).getTime() - new Date(inicioUTC0).getTime()) / (1000*60*60); if (horas > 0) valorHoraCalculado = freela / horas; }
      } catch {}
    }

    for (const k of permitidasVagas) { const v = (dados as any)[k]; if (v !== undefined) { campos.push(`${k} = $${idx}`); valores.push(v); idx++; } }
    if (valorHoraCalculado !== null && !campos.some(c => c.startsWith('valor_hora'))) { campos.push(`valor_hora = $${idx}`); valores.push(valorHoraCalculado); idx++; }
    if (dados.data_inicio) { const utc0 = DateUtil.paraUTC0(dados.data_inicio, deviceTz); campos.push(`data_inicio = $${idx}::timestamptz`); valores.push(utc0); idx++; }
    if (dados.data_fim) { const utc0 = DateUtil.paraUTC0(dados.data_fim, deviceTz); campos.push(`data_fim = $${idx}::timestamptz`); valores.push(utc0); idx++; }

    if (dados.endereco || dados.bairro || dados.cidade_id || dados.cep || dados.numero || dados.complemento) {
      try {
        await this.atualizarEnderecoVaga(id, { endereco: dados.endereco, bairro: dados.bairro, cidade_id: dados.cidade_id, cep: dados.cep, numero: dados.numero, complemento: dados.complemento, lat: dados.lat, lng: dados.lng });
      } catch (e: any) { console.error('[atualizarVaga] Erro endereco:', e.message); }
    }

    if (campos.length === 0) { return await this.buscarPorId(id); }
    valores.push(id);
    const sql = `UPDATE vagas SET ${campos.join(', ')}, atualizado_em = NOW() WHERE id = $${idx} RETURNING id, valor_hora, valor_servico, valor_transporte, to_char(data_inicio AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio, to_char(data_fim AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim`;
    const rows = await this.query(sql, valores);
    try {
      return await this.queryOne(`SELECT v.*, u.nome_completo as contratante_nome, u.email as contratante_email, c.nome as cidade_nome_real, ev.endereco, ev.bairro, ev.cep, ev.numero, ev.complemento, ev.cidade_id, ev.lat, ev.lng FROM vagas v JOIN usuarios u ON u.id = v.contratante_id LEFT JOIN enderecos_Vaga ev ON v.id = ev.vaga_id AND ev.is_ativo = true LEFT JOIN cidades c ON c.id = ev.cidade_id WHERE id = $1`, [id]);
    } catch { return rows[0]; }
  }

  async cancelarVaga(id: number) {
    try { return (await this.query(`UPDATE vagas SET status = 'CANCELADA', atualizado_em = NOW() WHERE id = $1 RETURNING id`, [id]))[0]; } catch { return { id }; }
  }
  async deletarVaga(id: number) {
    try { await this.query(`DELETE FROM enderecos_Vaga WHERE vaga_id = $1`, [id]); } catch {}
    await this.query(`DELETE FROM vagas WHERE id = $1`, [id]);
    return { id };
  }
  async deletar(id: number) { return await this.deletarVaga(id); }
}
