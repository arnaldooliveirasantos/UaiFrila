import { BaseRepository } from './BaseRepository';
import { DateUtil } from '../utils/DateUtil';

export interface CalculoVagaBackend {
  valor_servico: number;
  valor_transporte: number;
  base_calculo: number;
  horas_estimadas: number;
  valor_hora_bruto: number; // quanto freela recebe por hora antes de taxas? Na verdade bruto = base
  taxa_pix_percentual: number;
  taxa_cartao_percentual: number;
  comissao_percentual: number;
  taxa_pagamento: number;
  comissao_app: number;
  total_contratante: number; // o que contratante paga = base (sem taxas embutidas, taxas são do app)
  freela_recebe_bruto: number; // base
  freela_recebe_liquido: number; // base - taxas - comissao
  valor_hora_liquido: number;
  valor_hora_final: number; // alias para salvar em vagas.valor_hora
  valor_minimo_valido: boolean;
  mensagem_validacao?: string;
}

export class VagaRepository extends BaseRepository {

  private async buscarTaxas(): Promise<{ comissao: number, taxa_pix: number, taxa_cartao: number, valor_minimo: number }> {
    try {
      const rows = await this.query(`SELECT chave, valor_numerico, valor FROM variaveis_sistema WHERE chave IN ('COMISSAO_APLICATIVO','TAXA_PLATAFORMA_PERCENTUAL','COMISSAO_PERCENTUAL','TAXA_PIX_PERCENTUAL','TAXA_PAGAMENTO_PIX','TAXA_CARTAO_PERCENTUAL','TAXA_PAGAMENTO_CARTAO','VALOR_MINIMO_VAGA')`);
      const find = (keys: string[]) => {
        for (const k of keys) {
          const r = rows.find((x:any) => x.chave === k);
          if (r) return r;
        }
        return null;
      };
      const comissaoRow = find(['COMISSAO_APLICATIVO','TAXA_PLATAFORMA_PERCENTUAL','COMISSAO_PERCENTUAL']);
      const pixRow = find(['TAXA_PIX_PERCENTUAL','TAXA_PAGAMENTO_PIX']);
      const cartaoRow = find(['TAXA_CARTAO_PERCENTUAL','TAXA_PAGAMENTO_CARTAO']);
      const minimoRow = find(['VALOR_MINIMO_VAGA']);
      return {
        comissao: comissaoRow ? parseFloat(comissaoRow.valor_numerico || comissaoRow.valor) : 10,
        taxa_pix: pixRow ? parseFloat(pixRow.valor_numerico || pixRow.valor) : 1,
        taxa_cartao: cartaoRow ? parseFloat(cartaoRow.valor_numerico || cartaoRow.valor) : 4,
        valor_minimo: minimoRow ? parseFloat(minimoRow.valor_numerico || minimoRow.valor) : 75
      };
    } catch {
      return { comissao: 10, taxa_pix: 1, taxa_cartao: 4, valor_minimo: 75 };
    }
  }

  // FUNÇÃO ÚNICA DE CÁLCULO - FONTE DA VERDADE
  async calcularVaga(dados: { 
    valor_servico: number, 
    valor_transporte: number, 
    data_inicio_local: string, // wall time ex: 2026-10-29T18:00
    data_fim_local: string,
    timezone: string,
    meio_pagamento: 'pix'|'cartao'
  }): Promise<CalculoVagaBackend> {
    const taxas = await this.buscarTaxas();
    
    const vServ = Number(dados.valor_servico) || 0;
    const vTransp = Number(dados.valor_transporte) || 0;
    const base = vServ + vTransp;

    // Calcula horas a partir do wall time local + timezone -> UTC
    let inicioUTC = '', fimUTC = '';
    let horas = 0;
    try {
      inicioUTC = DateUtil.paraUTC0(dados.data_inicio_local, dados.timezone || 'America/Sao_Paulo');
      fimUTC = DateUtil.paraUTC0(dados.data_fim_local, dados.timezone || 'America/Sao_Paulo');
      horas = DateUtil.calcularHoras(inicioUTC, fimUTC);
      if (horas <= 0) horas = 0;
    } catch (e:any) {
      throw new Error(`Data inválida: ${e.message}`);
    }

    const taxaPercent = dados.meio_pagamento === 'cartao' ? taxas.taxa_cartao : taxas.taxa_pix;
    const taxaPagamento = base * taxaPercent / 100;
    const comissaoApp = base * taxas.comissao / 100;

    const totalContratante = base; // Contratante paga base, app retém taxas
    const freelaBruto = base;
    const freelaLiquido = base - taxaPagamento - comissaoApp;
    const valorHoraLiquido = horas > 0 ? freelaLiquido / horas : 0;
    const valorHoraFinal = horas > 0 ? freelaBruto / horas : freelaBruto; // Para exibir como R$/h bruto, mas salva liquido? Vamos salvar liquido por hora para mural

    return {
      valor_servico: vServ,
      valor_transporte: vTransp,
      base_calculo: base,
      horas_estimadas: horas,
      valor_hora_bruto: horas > 0 ? freelaBruto / horas : 0,
      taxa_pix_percentual: taxas.taxa_pix,
      taxa_cartao_percentual: taxas.taxa_cartao,
      comissao_percentual: taxas.comissao,
      taxa_pagamento: Math.round(taxaPagamento * 100) / 100,
      comissao_app: Math.round(comissaoApp * 100) / 100,
      total_contratante: Math.round(totalContratante * 100) / 100,
      freela_recebe_bruto: Math.round(freelaBruto * 100) / 100,
      freela_recebe_liquido: Math.round(freelaLiquido * 100) / 100,
      valor_hora_liquido: Math.round(valorHoraLiquido * 100) / 100,
      valor_hora_final: Math.round((horas > 0 ? freelaLiquido / horas : freelaLiquido) * 100) / 100,
      valor_minimo_valido: base >= taxas.valor_minimo,
      mensagem_validacao: base < taxas.valor_minimo ? `Valor mínimo R$ ${taxas.valor_minimo.toFixed(2)}` : undefined
    };
  }

  // Endereco - tabela corrigida para lower case
  async criarEnderecoVaga(dados: { vaga_id: number; endereco?: string; bairro?: string; cidade_id?: number; cep?: string; numero?: string; complemento?: string; lat?: number; lng?: number; }) {
    try {
      await this.query(`UPDATE enderecos_vaga SET is_ativo = false, atualizado_em = NOW() WHERE vaga_id = $1 AND is_ativo = true`, [dados.vaga_id]);
    } catch {}
    
    const sql = `INSERT INTO enderecos_vaga (vaga_id, endereco, bairro, cidade_id, cep, numero, complemento, lat, lng, is_ativo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true) RETURNING id, vaga_id, endereco, bairro, cidade_id, cep, numero, complemento, lat, lng`;
    const params = [dados.vaga_id, dados.endereco || null, dados.bairro || 'Centro', dados.cidade_id || 1, dados.cep || null, dados.numero || null, dados.complemento || null, dados.lat || null, dados.lng || null];
    const rows = await this.query(sql, params);
    return rows[0];
  }

  async atualizarEnderecoVaga(vagaId: number, dados: any) {
    const existente = await this.queryOne(`SELECT id FROM enderecos_vaga WHERE vaga_id = $1 AND is_ativo = true`, [vagaId]);
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
    const sql = `UPDATE enderecos_vaga SET ${campos.join(', ')}, atualizado_em = NOW() WHERE vaga_id = $${idx} AND is_ativo = true RETURNING id, endereco, bairro, cidade_id, cep, numero, complemento`;
    const rows = await this.query(sql, valores);
    return rows[0];
  }

  async buscarEnderecoPorVagaId(vagaId: number) {
    try {
      return await this.queryOne(`SELECT * FROM enderecos_vaga WHERE vaga_id = $1 AND is_ativo = true`, [vagaId]);
    } catch { return null; }
  }

  async criarVaga(dados: any) {
    const { contratante_id, titulo, descricao, funcao, data_inicio_local, data_fim_local, timezone, meio_pagamento, valor_servico, valor_transporte, endereco, bairro, cidade_id, cep, numero, complemento, lat, lng } = dados;

    // Validação obrigatória
    if (!data_inicio_local || !data_fim_local) throw new Error('data_inicio_local e data_fim_local obrigatórios (formato YYYY-MM-DDTHH:mm)');
    if (!timezone) throw new Error('timezone obrigatório (ex: America/Sao_Paulo)');

    // Calcula tudo no backend - fonte única
    const calculo = await this.calcularVaga({
      valor_servico: Number(valor_servico),
      valor_transporte: Number(valor_transporte),
      data_inicio_local,
      data_fim_local,
      timezone,
      meio_pagamento: meio_pagamento || 'pix'
    });

    if (!calculo.valor_minimo_valido) throw new Error(calculo.mensagem_validacao);

    // Converte para UTC para salvar
    const inicioUTC0 = DateUtil.paraUTC0(data_inicio_local, timezone);
    const fimUTC0 = DateUtil.paraUTC0(data_fim_local, timezone);

    // Salva todos os campos que existem no banco
    const sql = `INSERT INTO vagas (contratante_id, titulo, descricao, funcao, valor_hora, valor_servico, valor_transporte, total_freela, data_inicio, data_fim) 
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::timestamptz,$10::timestamptz) 
                 RETURNING id, valor_hora, valor_servico, valor_transporte, total_freela, 
                           to_char(data_inicio AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio, 
                           to_char(data_fim AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim`;

    const params = [
      contratante_id, 
      titulo, 
      descricao, 
      funcao || 'Garçom', 
      calculo.valor_hora_final, // valor_hora = freela liquido / hora
      calculo.valor_servico,
      calculo.valor_transporte,
      calculo.freela_recebe_bruto, // total_freela = bruto
      inicioUTC0, 
      fimUTC0
    ];
    
    const rows = await this.query(sql, params);
    const vagaId = rows[0].id;

    // Endereço
    if (endereco || bairro || cidade_id || cep) {
      try {
        await this.criarEnderecoVaga({ 
          vaga_id: vagaId, 
          endereco: endereco || null, 
          bairro: bairro || 'Centro', 
          cidade_id: cidade_id || 1, 
          cep: cep || null, 
          numero: numero || null, 
          complemento: complemento || null, 
          lat: lat || null, 
          lng: lng || null 
        });
      } catch (e: any) { console.error('[criarVaga] Erro endereco:', e.message); }
    }

    // Retorna com calculo completo
    try {
      const vagaCompleta = await this.queryOne(
        `SELECT v.*, 
                u.nome_completo as contratante_nome, 
                ev.endereco, ev.bairro, ev.cep, ev.numero, ev.complemento, ev.cidade_id, ev.lat, ev.lng,
                c.nome as cidade_nome
         FROM vagas v 
         JOIN usuarios u ON u.id = v.contratante_id 
         LEFT JOIN enderecos_vaga ev ON v.id = ev.vaga_id AND ev.is_ativo = true 
         LEFT JOIN cidades c ON c.id = ev.cidade_id 
         WHERE v.id = $1`, [vagaId]);
      return { ...vagaCompleta, _calculo: calculo };
    } catch {
      return { ...rows[0], _calculo: calculo };
    }
  }

  async listarVagas() {
    return await this.query(
      `SELECT v.*, u.nome_completo as contratante_nome, ev.endereco, ev.bairro, ev.cidade_id, ev.cep, ev.numero, ev.complemento, ev.lat, ev.lng,
              to_char(v.data_inicio AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio,
              to_char(v.data_fim AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim
       FROM vagas v 
       JOIN usuarios u ON u.id = v.contratante_id 
       LEFT JOIN enderecos_vaga ev ON v.id = ev.vaga_id AND ev.is_ativo = true 
       ORDER BY v.criado_em DESC LIMIT 100`
    );
  }

  async listarVagasPorContratante(contratanteId: number) {
    return await this.query(
      `SELECT v.*, ev.endereco, ev.bairro, ev.cidade_id, ev.cep, ev.numero, ev.complemento, ev.lat, ev.lng,
              to_char(v.data_inicio AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio,
              to_char(v.data_fim AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim
       FROM vagas v 
       LEFT JOIN enderecos_vaga ev ON ev.vaga_id = v.id AND ev.is_ativo = true 
       WHERE v.contratante_id = $1 ORDER BY v.criado_em DESC`, [contratanteId]);
  }

  async buscarPorId(id: number) {
    return await this.queryOne(
      `SELECT v.*, u.nome_completo as contratante_nome, u.email as contratante_email,
              ev.endereco, ev.bairro, ev.cep, ev.numero, ev.complemento, ev.cidade_id, ev.lat, ev.lng, c.nome as cidade_nome,
              to_char(v.data_inicio AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio,
              to_char(v.data_fim AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim
       FROM vagas v 
       JOIN usuarios u ON u.id = v.contratante_id 
       LEFT JOIN enderecos_vaga ev ON v.id = ev.vaga_id AND ev.is_ativo = true 
       LEFT JOIN cidades c ON c.id = ev.cidade_id 
       WHERE v.id = $1`, [id]);
  }

  async buscarMuralSemBloqueiosDeAvaliacao(usuarioId: number) {
    if (!usuarioId) {
      return await this.query(
        `SELECT v.*, u.nome_completo as contratante_nome, ev.endereco, ev.bairro, ev.cidade_id, ev.cep, ev.numero, ev.complemento,
                to_char(v.data_inicio AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio,
                to_char(v.data_fim AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim
         FROM vagas v 
         JOIN usuarios u ON u.id = v.contratante_id 
         LEFT JOIN enderecos_vaga ev ON v.id = ev.vaga_id AND ev.is_ativo = true 
         WHERE v.status IN ('ABERTA','PENDENTE') OR v.status IS NULL
         ORDER BY v.criado_em DESC LIMIT 100`);
    }
    return await this.query(
      `SELECT v.*, u.nome_completo as contratante_nome, ev.endereco, ev.bairro, ev.cidade_id, ev.cep, ev.numero, ev.complemento,
              to_char(v.data_inicio AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_inicio,
              to_char(v.data_fim AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"') as data_fim
       FROM vagas v 
       JOIN usuarios u ON u.id = v.contratante_id 
       LEFT JOIN enderecos_vaga ev ON v.id = ev.vaga_id AND ev.is_ativo = true 
       WHERE v.contratante_id != $1 AND (v.status IN ('ABERTA','PENDENTE') OR v.status IS NULL)
       ORDER BY v.criado_em DESC LIMIT 100`, [usuarioId]);
  }

  async buscarMuralVagas(usuarioId?: number) {
    return await this.buscarMuralSemBloqueiosDeAvaliacao(usuarioId || 0);
  }

  async atualizarVaga(id: number, dados: any) {
    // Se enviou datas novas, recalcula tudo
    let calculo: CalculoVagaBackend | null = null;
    const timezone = dados.timezone || 'America/Sao_Paulo';

    if (dados.valor_servico !== undefined || dados.valor_transporte !== undefined || dados.data_inicio_local || dados.data_fim_local) {
      const vagaAtual = await this.buscarPorId(id);
      if (!vagaAtual) throw new Error('Vaga não encontrada');
      
      const dataInicioLocal = dados.data_inicio_local || (vagaAtual.data_inicio ? new Date(vagaAtual.data_inicio).toISOString().slice(0,16) : null);
      const dataFimLocal = dados.data_fim_local || (vagaAtual.data_fim ? new Date(vagaAtual.data_fim).toISOString().slice(0,16) : null);
      
      if (dataInicioLocal && dataFimLocal) {
        calculo = await this.calcularVaga({
          valor_servico: dados.valor_servico ?? vagaAtual.valor_servico ?? 0,
          valor_transporte: dados.valor_transporte ?? vagaAtual.valor_transporte ?? 0,
          data_inicio_local: dataInicioLocal,
          data_fim_local: dataFimLocal,
          timezone,
          meio_pagamento: dados.meio_pagamento || 'pix'
        });
      }
    }

    const campos: string[] = []; const valores: any[] = []; let idx = 1;

    const permitidas = ['titulo','descricao','funcao'];
    for (const k of permitidas) {
      if (dados[k] !== undefined) { campos.push(`${k} = $${idx}`); valores.push(dados[k]); idx++; }
    }

    if (calculo) {
      campos.push(`valor_hora = $${idx}`); valores.push(calculo.valor_hora_final); idx++;
      campos.push(`valor_servico = $${idx}`); valores.push(calculo.valor_servico); idx++;
      campos.push(`valor_transporte = $${idx}`); valores.push(calculo.valor_transporte); idx++;
      campos.push(`total_freela = $${idx}`); valores.push(calculo.freela_recebe_bruto); idx++;
      const inicioUTC0 = DateUtil.paraUTC0(dados.data_inicio_local || new Date().toISOString(), timezone);
      const fimUTC0 = DateUtil.paraUTC0(dados.data_fim_local || new Date().toISOString(), timezone);
      if (dados.data_inicio_local) { campos.push(`data_inicio = $${idx}::timestamptz`); valores.push(inicioUTC0); idx++; }
      if (dados.data_fim_local) { campos.push(`data_fim = $${idx}::timestamptz`); valores.push(fimUTC0); idx++; }
    } else {
      // Atualização simples sem recalculo
      if (dados.valor_servico !== undefined) { campos.push(`valor_servico = $${idx}`); valores.push(dados.valor_servico); idx++; }
      if (dados.valor_transporte !== undefined) { campos.push(`valor_transporte = $${idx}`); valores.push(dados.valor_transporte); idx++; }
      if (dados.data_inicio) { 
        const utc0 = DateUtil.paraUTC0(dados.data_inicio, timezone);
        campos.push(`data_inicio = $${idx}::timestamptz`); valores.push(utc0); idx++; 
      }
      if (dados.data_fim) { 
        const utc0 = DateUtil.paraUTC0(dados.data_fim, timezone);
        campos.push(`data_fim = $${idx}::timestamptz`); valores.push(utc0); idx++; 
      }
    }

    if (dados.endereco || dados.bairro || dados.cidade_id || dados.cep) {
      try {
        await this.atualizarEnderecoVaga(id, dados);
      } catch (e:any) { console.error('[atualizarVaga] Erro endereco:', e.message); }
    }

    if (campos.length === 0) return await this.buscarPorId(id);

    valores.push(id);
    const sql = `UPDATE vagas SET ${campos.join(', ')}, atualizado_em = NOW() WHERE id = $${idx} RETURNING *`;
    const rows = await this.query(sql, valores);
    return rows[0];
  }

  async cancelarVaga(id: number) {
    return (await this.query(`UPDATE vagas SET status = 'CANCELADA', atualizado_em = NOW() WHERE id = $1 RETURNING id`, [id]))[0];
  }
  async deletarVaga(id: number) {
    try { await this.query(`DELETE FROM enderecos_vaga WHERE vaga_id = $1`, [id]); } catch {}
    await this.query(`DELETE FROM vagas WHERE id = $1`, [id]);
    return { id };
  }
  async deletar(id: number) { return await this.deletarVaga(id); }
}
