import { VagaRepository } from '../repositories/VagaRepository';
import { VagaModel } from '../models/VagaModel';
import { BaseRepository } from '../repositories/BaseRepository';

export class VagaService {
  private repo: VagaRepository;
  constructor() { 
    this.repo = new VagaRepository(); 
  }

  async listar(): Promise<VagaModel[]> { 
    try { return await this.repo.buscarTodos(); }
    catch { return []; }
  }
  
  async listarAbertas(): Promise<VagaModel[]> { 
    try { return await this.repo.listarAbertas(); }
    catch { return []; }
  }
  
  async listarPorContratante(contratanteId: number): Promise<VagaModel[]> { 
    const id = Number(contratanteId);
    if (!id || isNaN(id)) return [];
    try { return await this.repo.listarPorContratante(id); }
    catch (e: any) { console.warn('[VagaService.listarPorContratante]', e.message); return []; }
  }
  
  async listarComFiltro(filtro: any): Promise<VagaModel[]> { 
    try { return await this.repo.listarComFiltro(filtro); }
    catch { return []; }
  }
  
  async buscarPorId(id: number): Promise<VagaModel> { 
    const v = await this.repo.buscarPorId(id); 
    if (!v) throw new Error('Vaga não encontrada'); 
    return v; 
  }
  
  async buscarCompletaPorId(id: number): Promise<VagaModel | null> { 
    const idNum = Number(id);
    if (!idNum || isNaN(idNum)) return null;
    try { return await this.repo.buscarCompletaPorId(idNum); }
    catch { 
      try { return await this.repo.buscarPorId(idNum); }
      catch { return null; }
    }
  }
  
  async buscarPorIdComRelacoes(id: number): Promise<VagaModel | null> { 
    return await this.buscarCompletaPorId(id); 
  }

  async calcular(dados: any): Promise<any> {
    const valorServico = Number(dados.valor_servico) || 0;
    const valorTransporte = Number(dados.valor_transporte) || 0;
    const base = valorServico + valorTransporte;
    
    const taxaPix = 0.01;
    const taxaCartao = 0.04;
    const comissao = 0.10;
    
    const taxaPercent = dados.meio_pagamento === 'cartao' ? taxaCartao : taxaPix;
    const taxaPagamento = base * taxaPercent;
    const comissaoApp = base * comissao;
    const totalContratante = base + taxaPagamento + comissaoApp;
    const freelaRecebe = base;
    const freelaLiquido = base - comissaoApp;
    
    let horas = 4;
    try {
      if (dados.data_inicio_local && dados.data_fim_local) {
        const ini = new Date(dados.data_inicio_local);
        const fim = new Date(dados.data_fim_local);
        horas = Math.max(0.5, (fim.getTime() - ini.getTime()) / (1000 * 60 * 60));
      } else if (dados.data_inicio && dados.data_fim) {
        const ini = new Date(dados.data_inicio);
        const fim = new Date(dados.data_fim);
        horas = Math.max(0.5, (fim.getTime() - ini.getTime()) / (1000 * 60 * 60));
      }
    } catch {}
    
    return {
      valor_servico: valorServico,
      valor_transporte: valorTransporte,
      base_calculo: base,
      horas_estimadas: horas,
      valor_hora_bruto: horas > 0 ? base / horas : 0,
      taxa_pix_percentual: 1,
      taxa_cartao_percentual: 4,
      comissao_percentual: 10,
      taxa_pagamento: taxaPagamento,
      comissao_app: comissaoApp,
      total_contratante: totalContratante,
      freela_recebe_bruto: freelaRecebe,
      freela_recebe_liquido: freelaLiquido,
      valor_hora_liquido: horas > 0 ? freelaLiquido / horas : 0,
      valor_hora_final: horas > 0 ? freelaLiquido / horas : 0,
      valor_minimo_valido: valorServico >= 75,
      mensagem_validacao: valorServico < 75 ? 'Valor mínimo R$ 75,00' : undefined
    };
  }

  async criar(dados: any): Promise<VagaModel> { 
    // Extrai endereco_id que NÃO existe na tabela vagas, mas sim em enderecos_vaga
    const enderecoIdRaw = dados.endereco_id || dados.enderecoId;
    const enderecoId = enderecoIdRaw ? Number(enderecoIdRaw) : null;
    
    // Remove campos que não existem na tabela vagas
    const payload: any = { ...dados };
    delete payload.endereco_id;
    delete payload.enderecoId;
    delete payload.endereco_ativo;
    delete payload.enderecoAtivo;
    delete payload.data_inicio_local;
    delete payload.data_fim_local;
    delete payload.timezone;
    delete payload.meio_pagamento;
    delete payload.meioPagamento;
    delete payload.calculo;
    
    const contratanteId = Number(payload.contratanteId || payload.contratante_id || payload.usuario_id);
    if (!contratanteId || isNaN(contratanteId)) throw new Error('contratanteId obrigatório');
    payload.contratante_id = contratanteId;
    delete payload.contratanteId;
    delete payload.usuario_id;

    // Datas
    if (dados.data_inicio_local && !payload.data_inicio) {
      try { payload.data_inicio = new Date(dados.data_inicio_local).toISOString(); }
      catch { payload.data_inicio = dados.data_inicio_local; }
    }
    if (dados.data_fim_local && !payload.data_fim) {
      try { payload.data_fim = new Date(dados.data_fim_local).toISOString(); }
      catch { payload.data_fim = dados.data_fim_local; }
    }
    if (!payload.data_inicio) payload.data_inicio = new Date().toISOString();
    if (!payload.data_fim) payload.data_fim = new Date(Date.now() + 4*3600*1000).toISOString();

    payload.status = payload.status || 'ABERTA';
    
    // Garante campos obrigatórios da tabela vagas
    if (!payload.titulo) throw new Error('Título obrigatório');
    if (!payload.valor_hora && !payload.valor_servico) {
      payload.valor_hora = 20;
    }
    if (payload.valor_servico) {
      payload.valor_hora = Number(payload.valor_servico) / 4; // aproxima
    }
    
    // Remove campos que não existem na tabela vagas original (verifica no model)
    // Model tem: contratante_id, titulo, descricao, funcao, valor_hora, valor_servico, valor_transporte, total_freela, status, data_inicio, data_fim
    // Não tem endereco_id, cep, bairro, etc. Esses ficam em enderecos_vaga
    const camposPermitidos = ['contratante_id','titulo','descricao','funcao','valor_hora','valor_servico','valor_transporte','total_freela','status','data_inicio','data_fim'];
    const payloadLimpo: any = {};
    for (const k of camposPermitidos) {
      if (payload[k] !== undefined) payloadLimpo[k] = payload[k];
    }
    // Mantém pelo menos titulo, contratante_id, valor_hora, data_inicio, data_fim
    if (!payloadLimpo.valor_hora) payloadLimpo.valor_hora = Number(payload.valor_servico) || 20;
    if (!payloadLimpo.valor_servico) payloadLimpo.valor_servico = payload.valor_servico || payloadLimpo.valor_hora;
    if (!payloadLimpo.valor_transporte) payloadLimpo.valor_transporte = Number(dados.valor_transporte) || 0;
    if (!payloadLimpo.total_freela) payloadLimpo.total_freela = payloadLimpo.valor_servico;

    console.log('[VagaService.criar] Payload vagas (sem endereco_id):', payloadLimpo);
    console.log('[VagaService.criar] endereco_id para vincular depois:', enderecoId);

    let vaga: VagaModel;
    try {
      vaga = await this.repo.criarGenerico(payloadLimpo);
    } catch (e: any) {
      console.error('[VagaService.criar] erro ao criar vaga', e.message);
      // Tenta com payload ainda mais mínimo
      const minimo = {
        contratante_id: payloadLimpo.contratante_id,
        titulo: payloadLimpo.titulo,
        descricao: payloadLimpo.descricao || 'Sem descrição',
        funcao: payloadLimpo.funcao || 'Garçom',
        valor_hora: Number(payloadLimpo.valor_hora) || 20,
        valor_servico: Number(payloadLimpo.valor_servico) || 75,
        valor_transporte: Number(payloadLimpo.valor_transporte) || 0,
        status: 'ABERTA',
        data_inicio: payloadLimpo.data_inicio,
        data_fim: payloadLimpo.data_fim,
      };
      vaga = await this.repo.criarGenerico(minimo);
    }

    // Agora vincula endereco na tabela enderecos_vaga se tiver endereco_id
    if (enderecoId && !isNaN(enderecoId)) {
      try {
        const pool = BaseRepository.getPool() as any;
        if (pool) {
          await pool.query(
            'INSERT INTO enderecos_vaga (vaga_id, endereco_id, ativo) VALUES ($1,$2,true) ON CONFLICT (vaga_id, endereco_id) DO UPDATE SET ativo = true',
            [(vaga as any).id, enderecoId]
          );
          console.log(`[VagaService.criar] Vaga ${(vaga as any).id} vinculada ao endereco ${enderecoId} em enderecos_vaga`);
        }
      } catch (e: any) {
        console.warn(`[VagaService.criar] Falha ao vincular endereco_vaga vaga=${(vaga as any).id} endereco=${enderecoId}:`, e.message);
        // Se tabela não existe, tenta criar
        try {
          const pool = BaseRepository.getPool() as any;
          if (pool) {
            await pool.query(`
              CREATE TABLE IF NOT EXISTS enderecos_vaga (
                id SERIAL PRIMARY KEY,
                vaga_id INT REFERENCES vagas(id) ON DELETE CASCADE,
                endereco_id INT REFERENCES enderecos(id) ON DELETE CASCADE,
                ativo BOOLEAN DEFAULT true,
                criado_em TIMESTAMP DEFAULT NOW(),
                UNIQUE(vaga_id, endereco_id)
              )
            `);
            await pool.query(
              'INSERT INTO enderecos_vaga (vaga_id, endereco_id, ativo) VALUES ($1,$2,true) ON CONFLICT (vaga_id, endereco_id) DO UPDATE SET ativo = true',
              [(vaga as any).id, enderecoId]
            );
          }
        } catch (e2: any) {
          console.error('[VagaService.criar] Falha ao criar tabela enderecos_vaga', e2.message);
        }
      }
    }

    return vaga;
  }

  async atualizar(id: number, dados: any): Promise<VagaModel | null> { 
    const idNum = Number(id);
    if (!idNum || isNaN(idNum)) throw new Error('ID inválido');
    
    const enderecoIdRaw = dados.endereco_id || dados.enderecoId;
    const enderecoId = enderecoIdRaw ? Number(enderecoIdRaw) : null;
    
    const payload = { ...dados };
    delete payload.endereco_id;
    delete payload.enderecoId;
    delete payload.contratante_id;
    delete payload.contratanteId;
    delete payload.data_inicio_local;
    delete payload.data_fim_local;
    delete payload.timezone;
    delete payload.meio_pagamento;

    // Atualiza vaga
    const atualizado = await this.repo.atualizarGenerico(idNum, payload);
    
    // Se mudou endereco, atualiza vínculo
    if (enderecoId && !isNaN(enderecoId)) {
      try {
        const pool = BaseRepository.getPool() as any;
        if (pool) {
          await pool.query('UPDATE enderecos_vaga SET ativo = false WHERE vaga_id = $1', [idNum]);
          await pool.query(
            'INSERT INTO enderecos_vaga (vaga_id, endereco_id, ativo) VALUES ($1,$2,true) ON CONFLICT (vaga_id, endereco_id) DO UPDATE SET ativo = true',
            [idNum, enderecoId]
          );
        }
      } catch (e: any) {
        console.warn('[atualizar] falha vincular endereco', e.message);
      }
    }
    
    return atualizado; 
  }
  
  async deletar(id: number): Promise<boolean> { 
    const idNum = Number(id);
    if (!idNum || isNaN(idNum)) throw new Error('ID inválido');
    try {
      const pool = BaseRepository.getPool() as any;
      if (pool) {
        await pool.query('DELETE FROM enderecos_vaga WHERE vaga_id = $1', [idNum]);
      }
    } catch {}
    return await this.repo.deletarPorId(idNum); 
  }
}
