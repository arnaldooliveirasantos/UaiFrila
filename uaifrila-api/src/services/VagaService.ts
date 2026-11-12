import { BaseService } from './BaseService';
import { VagaRepository } from '../repositories/VagaRepository';
import { VariavelSistemaRepository } from '../repositories/VariavelSistemaRepository';
import { VagaModel } from '../models/VagaModel';
import { EnderecoService } from './EnderecoService';
import { CandidaturaRepository } from '../repositories/CandidaturaRepository';
import { EnderecoVagaRepository } from '../repositories/EnderecoVagaRepository';
import { VariavelSistemaService } from './VariavelSistemaService';

// ATENÇÃO: NÃO use nome 'variavelService' aqui - BaseService antigo tinha 'protected variavelService'
// Use 'variavelSvc' para não dar TS2415 (private vs protected)
export class VagaService extends BaseService<VagaModel> {
  // 'repository' já vem do BaseService via this.repo / this.repository
  private variavelSvc: VariavelSistemaService;
  private variavelRepo: VariavelSistemaRepository;

  constructor() {
    super(new VagaRepository());
    this.variavelSvc = new VariavelSistemaService();
    this.variavelRepo = new VariavelSistemaRepository();
  }

  private getVagaRepo(): VagaRepository {
    return this.getRepo() as VagaRepository;
  }

  async listarAbertas(): Promise<any[]> {
    try {
      const r = this.getVagaRepo();
      if (typeof (r as any).listarAbertas === 'function') return await (r as any).listarAbertas();
      return await this.listar();
    } catch (e: any) { this.handleError(e, 'VagaService.listarAbertas'); }
  }

  async listarPorContratante(contratanteId: number): Promise<any[]> {
    try {
      if (!contratanteId) throw new Error('Contratante ID obrigatório');
      const r = this.getVagaRepo();
      if (typeof (r as any).listarPorContratante === 'function') return await (r as any).listarPorContratante(contratanteId);
      return await this.listarPorCampo('contratante_id', contratanteId);
    } catch (e: any) { this.handleError(e, 'VagaService.listarPorContratante'); }
  }

  async listarComFiltro(filtro: any): Promise<any[]> {
    try {
      const r = this.getVagaRepo();
      if (typeof (r as any).listarComFiltro === 'function') return await (r as any).listarComFiltro(filtro);
      return await this.listar();
    } catch (e: any) { this.handleError(e, 'VagaService.listarComFiltro'); }
  }

  async buscarCompletaPorId(id: number): Promise<any | null> {
    try {
      const r = this.getVagaRepo();
      if (typeof (r as any).buscarCompletaPorId === 'function') return await (r as any).buscarCompletaPorId(id);
      return await this.getRepo().buscarPorId(id);
    } catch (e: any) { this.handleError(e, 'VagaService.buscarCompletaPorId'); }
  }

  async calcular(dados: any): Promise<any> {
    try {
      this.validateRequired(dados, ['valor_servico']);
      let vars: any[] = [];
      try { vars = await this.variavelRepo.buscarTodos(); } catch { vars = []; }
      const findVar = (chave: string) => vars.find((v: any) => v.chave === chave);
      const getNum = (chave: string, def: number) => {
        const v = findVar(chave);
        if (!v) return def;
        const num = (v as any).valorNumerico ?? (v as any).valor_numerico ?? (v as any).valor;
        const parsed = parseFloat(num);
        return isNaN(parsed) ? def : parsed;
      };
      const VALOR_MINIMO = getNum('VALOR_MINIMO_VAGA', 75);
      const TAXA_PIX = getNum('TAXA_PIX_PERCENTUAL', 1);
      const TAXA_CARTAO = getNum('TAXA_CARTAO_PERCENTUAL', 4);
      const COMISSAO = getNum('COMISSAO_APLICATIVO', getNum('TAXA_PLATAFORMA_PERCENTUAL', 10));

      const iniStr = dados.data_inicio_local || dados.data_inicio || dados.dataInicio;
      const fimStr = dados.data_fim_local || dados.data_fim || dados.dataFim;
      let horas = 4;
      if (iniStr && fimStr) {
        const diffMs = new Date(fimStr).getTime() - new Date(iniStr).getTime();
        horas = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
        if (horas <= 0) throw new Error('Data fim deve ser maior que início');
      }
      const base = Number(dados.valor_servico) + Number(dados.valor_transporte || 0);
      const taxaPercent = dados.meio_pagamento === 'cartao' ? TAXA_CARTAO : TAXA_PIX;
      const taxa_pagamento = (Number(dados.valor_servico) * taxaPercent / 100);
      const comissao_app = (Number(dados.valor_servico) * COMISSAO / 100);
      const total_contratante = base + taxa_pagamento + comissao_app;
      const freela_recebe_liquido = Number(dados.valor_servico) + Number(dados.valor_transporte || 0) - taxa_pagamento - comissao_app;
      const valor_hora_final = horas > 0 ? freela_recebe_liquido / horas : 0;
      const valor_minimo_valido = freela_recebe_liquido >= VALOR_MINIMO;
      // Campos que o mural API-only espera
      const taxa_cartao = base * (TAXA_CARTAO / 100);
      const comissao = base * (COMISSAO / 100);
      const total_descontos = taxa_cartao + comissao;
      const valor_a_receber = base - total_descontos;
      return {
        valor_servico: Number(dados.valor_servico),
        valor_transporte: Number(dados.valor_transporte || 0),
        base_calculo: base,
        horas_estimadas: horas,
        valor_hora_bruto: horas > 0 ? Number(dados.valor_servico) / horas : 0,
        taxa_pix_percentual: TAXA_PIX, taxa_cartao_percentual: TAXA_CARTAO, comissao_percentual: COMISSAO,
        taxa_pagamento, taxa_cartao, taxa_pagamento_cartao: taxa_cartao,
        comissao_app, comissao, total_descontos,
        total_contratante, contratante_paga: base,
        freela_recebe_bruto: base, freela_recebe_liquido, valor_a_receber,
        valor_servico_liquido: valor_a_receber - Number(dados.valor_transporte || 0),
        valor_servico_liquido_cartao: valor_a_receber - Number(dados.valor_transporte || 0),
        valor_hora_liquido: valor_hora_final, valor_hora_final, valor_minimo_valido,
        mensagem_validacao: valor_minimo_valido ? undefined : `Valor mínimo R$ ${VALOR_MINIMO.toFixed(2)} - aumente o valor do serviço`,
        meio_pagamento: 'cartao',
      };
    } catch (e: any) { this.handleError(e, 'VagaService.calcular'); }
  }

  calcularDistanciaKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
    const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  async listarMuralParaUsuario(usuarioId: number): Promise<any[]> {
    const cfg = await this.variavelSvc.getConfigCancelamento().catch(() => ({ prazoHoras: 24 }));
    let vagas: any[] = [];
    try { vagas = await this.getVagaRepo().listarMural(); }
    catch { vagas = await this.listarAbertas(); }
    let enderecoAtivoUsuario: any = null;
    const minhasCandidaturas = new Map<number, any>();
    if (usuarioId) {
      try {
        const enderecoSvc = new EnderecoService();
        const ativo: any = await enderecoSvc.buscarAtivoPorUsuario(usuarioId);
        enderecoAtivoUsuario = ativo ? (typeof ativo.toRaw === 'function' ? ativo.toRaw() : ativo) : null;
      } catch {}
      try {
        const candRepo = new CandidaturaRepository();
        const minhas = await candRepo.listarMinhas(usuarioId);
        (minhas as any[]).forEach((c: any) => { if (['PENDENTE', 'ACEITA', 'EM_ANALISE'].includes((c.status || '').toUpperCase())) minhasCandidaturas.set(Number(c.vaga_id ?? c.vagaId), c); });
      } catch {}
    }
    const result: any[] = [];
    for (const v of vagas) {
      const calculo = await this.calcular(v);
      let enderecoVaga: any = null;
      try {
        const evRepo = new EnderecoVagaRepository();
        const ev: any = await evRepo.buscarAtivoPorVaga(v.id);
        enderecoVaga = ev || null;
      } catch {}
      let distanciaKm = 0, distanciaTexto = '';
      const latU = Number(enderecoAtivoUsuario?.latitude ?? enderecoAtivoUsuario?.lat);
      const lngU = Number(enderecoAtivoUsuario?.longitude ?? enderecoAtivoUsuario?.lng);
      const latV = Number(enderecoVaga?.latitude ?? enderecoVaga?.lat);
      const lngV = Number(enderecoVaga?.longitude ?? enderecoVaga?.lng);
      if (latU && lngU && latV && lngV) {
        distanciaKm = this.calcularDistanciaKm(latU, lngU, latV, lngV);
        distanciaTexto = distanciaKm < 1 ? `${Math.round(distanciaKm * 1000)} m` : `${distanciaKm.toFixed(1)} km`;
      }
      const isMinha = Number(v.contratante_id) === Number(usuarioId);
      const minhaCand = minhasCandidaturas.get(Number(v.id));
      const statusChave = (v.status_chave || 'AGUARDANDO_CANDIDATURA').toUpperCase();
      let horasParaInicio = 9999, podeCancelarCandidatura = true, motivoCancelarBloqueado = '';
      if (minhaCand) {
        horasParaInicio = (new Date(v.data_inicio).getTime() - Date.now()) / (1000 * 60 * 60);
        if ((minhaCand.status || '').toUpperCase() === 'ACEITA' || statusChave === 'ACEITA') {
          if (horasParaInicio < cfg.prazoHoras) { podeCancelarCandidatura = false; motivoCancelarBloqueado = `Faltam ${horasParaInicio.toFixed(1)}h para o início. Cancelamento até ${cfg.prazoHoras}h antes.`; }
        }
        if (statusChave === 'EM_ANDAMENTO') { podeCancelarCandidatura = false; motivoCancelarBloqueado = 'Trampo já em andamento, não pode cancelar.'; }
      }
      const cidadeNome = enderecoVaga?.cidade_nome ?? enderecoVaga?.cidadeNome ?? null;
      const cidadeEstado = enderecoVaga?.cidade_estado ?? enderecoVaga?.cidadeEstado ?? null;
      result.push({
        id: v.id, titulo: v.titulo, funcao: v.funcao, descricao: v.descricao,
        contratante_id: v.contratante_id, contratante_nome: v.contratante_nome,
        status: v.status_nome || statusChave, status_chave: statusChave, status_nome: v.status_nome || statusChave, status_cor: v.status_cor,
        permite_editar: v.permite_editar ?? !['ACEITA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA', 'FECHADA'].includes(statusChave),
        permite_cancelar: v.permite_cancelar ?? !['EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA', 'FECHADA'].includes(statusChave),
        permite_candidatar: v.permite_candidatar ?? true,
        data_inicio: v.data_inicio, data_fim: v.data_fim,
        valor_servico: v.valor_servico, valor_transporte: v.valor_transporte,
        calculo,
        bairro: enderecoVaga?.bairro, cidade_nome: cidadeNome, cidade_estado: cidadeEstado,
        endereco_completo: isMinha && enderecoVaga ? `${enderecoVaga.logradouro || ''} ${enderecoVaga.numero || ''}, ${enderecoVaga.bairro || ''}, ${cidadeNome || ''} - ${cidadeEstado || ''} CEP ${enderecoVaga.cep || ''}` : null,
        logradouro: isMinha ? enderecoVaga?.logradouro : undefined,
        cep: isMinha ? enderecoVaga?.cep : undefined,
        numero: isMinha ? enderecoVaga?.numero : undefined,
        distancia_km: distanciaKm, distancia_texto: distanciaTexto,
        is_minha: isMinha, ja_candidatado: !!minhaCand, minha_candidatura: minhaCand || null, candidatura_status: minhaCand?.status || null,
        horas_para_inicio: horasParaInicio, pode_cancelar_candidatura: podeCancelarCandidatura, motivo_cancelar_bloqueado: motivoCancelarBloqueado,
        valor_total_pagar: calculo.contratante_paga, valor_a_receber: calculo.valor_a_receber, valor_servico_liquido: calculo.valor_servico_liquido,
      });
    }
    return result;
  }

  // Cancelar vaga do dono - com trava via status_vaga
  async cancelarVaga(vagaId: number, usuarioId: number, motivo?: string): Promise<any> {
    const vaga = await this.buscarCompletaPorId(vagaId);
    if (!vaga) throw new Error('Vaga não encontrada');
    if (Number(vaga.contratante_id) !== Number(usuarioId)) throw new Error('Só o dono pode cancelar a vaga');
    const statusChave = (vaga.status_chave || '').toUpperCase();
    if (['EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA', 'FECHADA'].includes(statusChave)) throw new Error(`Não pode cancelar com status ${statusChave}`);
    await this.getVagaRepo().atualizarStatusVaga(vagaId, 'CANCELADA');
    return { vaga_id: vagaId, novo_status: 'CANCELADA', motivo: motivo || 'Cancelado pelo contratante' };
  }
}
