import { BaseService } from './BaseService';
import { VagaRepository } from '../repositories/VagaRepository';
import { VariavelSistemaRepository } from '../repositories/VariavelSistemaRepository';
import { VagaModel } from '../models/VagaModel';
import { BaseRepository } from '../repositories/BaseRepository';
import { VariavelSistemaService } from './VariavelSistemaService';
import { EnderecoVagaService } from './EnderecoVagaService';

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
      const pool = BaseRepository.getPool() as any;
      if (pool) {
        const res = await pool.query(`SELECT v.*, sv.chave as status_chave, sv.nome_exibicao as status_nome FROM vagas v LEFT JOIN status_vaga sv ON sv.id = v.status_vaga_id WHERE v.id = $1 LIMIT 1`, [id]);
        return res.rows[0] || null;
      }
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

  async listarMuralParaUsuario(usuarioId: number): Promise<any[]> {
    const pool = BaseRepository.getPool() as any;
    const cfg = await this.variavelSvc.getConfigCancelamento().catch(() => ({ prazoHoras: 24 }));
    let vagas: any[] = [];
    try {
      // Mural: vagas com início anterior a hoje NÃO aparecem.
      // DATE(v.data_inicio) >= CURRENT_DATE (só a data, ignora a hora).
      const r = await pool.query(`SELECT v.*, sv.chave as status_chave, sv.nome_exibicao as status_nome, sv.cor_hex as status_cor, sv.permite_editar, sv.permite_cancelar, sv.permite_candidatar FROM vagas v JOIN status_vaga sv ON sv.id = v.status_vaga_id WHERE sv.chave IN ('AGUARDANDO_CANDIDATURA','AGUARDANDO_ACEITE') AND (v.data_inicio IS NULL OR DATE(v.data_inicio) >= CURRENT_DATE) ORDER BY v.criado_em DESC`);
      vagas = r.rows;
    } catch { vagas = await this.listarAbertas(); }

    // A distancia NAO e calculada aqui: o front calcula (Haversine) a partir das
    // coordenadas do endereco ativo do usuario e do endereco da vaga.
    const minhasCandidaturas = new Map<number, any>();
    if (pool && usuarioId) {
      try { const rc = await pool.query(`SELECT * FROM candidaturas WHERE (freela_id=$1 OR usuario_id=$1) AND status IN ('PENDENTE','ACEITA','EM_ANALISE')`, [usuarioId]); rc.rows.forEach((c: any) => minhasCandidaturas.set(Number(c.vaga_id), c)); } catch {}
    }

    const result: any[] = [];
    for (const v of vagas) {
      const calculo = await this.calcular(v);
      let enderecoVaga: any = null;
      if (pool) {
        try { const re = await pool.query(`SELECT e.*, c.nome as cidade_nome, c.estado as cidade_estado FROM enderecos_vaga ev JOIN enderecos e ON e.id=ev.endereco_id LEFT JOIN cidades c ON c.id=e.cidade_id WHERE ev.vaga_id=$1 AND ev.ativo=true LIMIT 1`, [v.id]); enderecoVaga = re.rows[0] || null; } catch {}
      }
      // Vaga em que o usuario ja se candidatou (PENDENTE/ACEITA/EM_ANALISE) NAO
      // aparece no Mural — ela e acompanhada em Meus Trampos.
      if (minhasCandidaturas.has(Number(v.id))) continue;
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
      result.push({
        id: v.id, titulo: v.titulo, funcao: v.funcao, descricao: v.descricao,
        contratante_id: v.contratante_id, contratante_nome: v.contratante_nome,
        status: v.status_nome || statusChave, status_chave: statusChave, status_nome: v.status_nome || statusChave, status_cor: v.status_cor,
        permite_editar: v.permite_editar ?? !['ACEITA','EM_ANDAMENTO','FINALIZADA','CANCELADA','FECHADA'].includes(statusChave),
        permite_cancelar: v.permite_cancelar ?? !['EM_ANDAMENTO','FINALIZADA','CANCELADA','FECHADA'].includes(statusChave),
        permite_candidatar: v.permite_candidatar ?? true,
        data_inicio: v.data_inicio, data_fim: v.data_fim,
        valor_servico: v.valor_servico, valor_transporte: v.valor_transporte,
        calculo,
        bairro: enderecoVaga?.bairro, cidade_nome: enderecoVaga?.cidade_nome, cidade_estado: enderecoVaga?.cidade_estado,
        // Id do endereco da vaga (so do dono): a TelaCadastroVaga em modo edicao
        // precisa dele para preencher o endereco e habilitar o Atualizar.
        endereco_id: isMinha ? enderecoVaga?.id ?? null : undefined,
        endereco_completo: isMinha && enderecoVaga ? `${enderecoVaga.logradouro || ''} ${enderecoVaga.numero || ''}, ${enderecoVaga.bairro || ''}, ${enderecoVaga.cidade_nome || ''} - ${enderecoVaga.cidade_estado || ''} CEP ${enderecoVaga.cep || ''}` : null,
        logradouro: isMinha ? enderecoVaga?.logradouro : undefined,
        cep: isMinha ? enderecoVaga?.cep : undefined,
        numero: isMinha ? enderecoVaga?.numero : undefined,
        // Coordenadas do endereco da vaga: o front calcula a distancia ate o
        // endereco ativo do usuario. Sem coordenada, sem distancia (sem fallback).
        endereco_latitude: enderecoVaga?.latitude ?? null, endereco_longitude: enderecoVaga?.longitude ?? null,
        is_minha: isMinha, ja_candidatado: !!minhaCand, minha_candidatura: minhaCand || null, candidatura_status: minhaCand?.status || null,
        horas_para_inicio: horasParaInicio, pode_cancelar_candidatura: podeCancelarCandidatura, motivo_cancelar_bloqueado: motivoCancelarBloqueado,
        valor_total_pagar: calculo.contratante_paga, valor_a_receber: calculo.valor_a_receber, valor_servico_liquido: calculo.valor_servico_liquido,
      });
    }
    return result;
  }

  // Cancelar vaga do dono - com trava via status_vaga
  async cancelarVaga(vagaId: number, usuarioId: number, motivo?: string): Promise<any> {
    const pool = BaseRepository.getPool() as any;
    const vaga = await this.buscarCompletaPorId(vagaId);
    if (!vaga) throw new Error('Vaga não encontrada');
    if (Number(vaga.contratante_id) !== Number(usuarioId)) throw new Error('Só o dono pode cancelar a vaga');
    const statusChave = (vaga.status_chave || '').toUpperCase();
    if (['EM_ANDAMENTO','FINALIZADA','CANCELADA','FECHADA'].includes(statusChave)) throw new Error(`Não pode cancelar com status ${statusChave}`);
    const rs = await pool.query(`SELECT id FROM status_vaga WHERE chave='CANCELADA'`);
    if (rs.rows[0]) await pool.query(`UPDATE vagas SET status_vaga_id=$1 WHERE id=$2`, [rs.rows[0].id, vagaId]);
    return { vaga_id: vagaId, novo_status: 'CANCELADA', motivo: motivo || 'Cancelado pelo contratante' };
  }

  // Converte "YYYY-MM-DDTHH:mm" (horario de parede no fuso do usuario) para Date UTC.
  // Sem isso, o front mandava data_inicio_local/data_fim_local e o criar generico
  // tentava inserir essas colunas (que NAO existem em vagas) -> 500 no /vagas/criar,
  // e data_inicio/data_fim ficavam NULL. Usa Intl para o offset real do fuso (DST ok).
  private paredeParaUTC(wall: string, tz: string): Date {
    const m = String(wall || '').match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!m) return new Date(wall);
    const [, Y, Mo, D, h, mi, s] = m;
    const comoUTC = Date.UTC(+Y, +Mo - 1, +D, +h, +mi, +(s || 0));
    let fuso = tz || 'America/Sao_Paulo';
    try {
      const fmt = new Intl.DateTimeFormat('en-US', { timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
      const partes = (ts: number) => { const p: any = {}; for (const x of fmt.formatToParts(new Date(ts))) if (x.type !== 'literal') p[x.type] = +x.value; return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second); };
      let offset = comoUTC - partes(comoUTC);
      offset = comoUTC - partes(comoUTC - offset); // 2a passada: acerta o DST
      return new Date(comoUTC - offset);
    } catch { return new Date(comoUTC); }
  }

  // Extrai inicio/fim (parede) do payload: front manda data_inicio_local/data_fim_local.
  private extrairDatas(dados: any): { iniWall: string; fimWall: string } {
    const iniWall = String(dados.data_inicio_local || dados.data_inicio || dados.dataInicio || '');
    const fimWall = String(dados.data_fim_local || dados.data_fim || dados.dataFim || '');
    return { iniWall, fimWall };
  }

  // CRIAR — sobrescreve o generico do BaseService, que inseria o payload cru:
  // data_inicio_local, data_fim_local, timezone, meio_pagamento e endereco_id NAO
  // sao colunas de vagas -> Postgres 500, e data_inicio/data_fim ficavam NULL.
  // Aqui so entram colunas reais de vagas, com data_inicio/data_fim em UTC, e o
  // endereco e vinculado na tabela pivo enderecos_vaga (a relacao vaga-endereco
  // nao e uma coluna em vagas).
  async criar(dados: any, _usuarioId?: number): Promise<any> {
    const contratanteId = Number(dados.contratanteId || dados.contratante_id || _usuarioId);
    if (!contratanteId || isNaN(contratanteId)) throw new Error('Contratante obrigatório');
    if (!String(dados.titulo || '').trim()) throw new Error('Título obrigatório');
    const enderecoId = Number(dados.endereco_id || dados.enderecoId);
    if (!enderecoId || isNaN(enderecoId)) throw new Error('Endereço obrigatório');
    const valorServico = Number(dados.valor_servico ?? dados.valorServico);
    if (!valorServico || isNaN(valorServico) || valorServico <= 0) throw new Error('Valor do serviço obrigatório');
    const { iniWall, fimWall } = this.extrairDatas(dados);
    if (!iniWall || !fimWall) throw new Error('Data de início e fim obrigatórias');
    const tz = dados.timezone || 'America/Sao_Paulo';
    const dataInicio = this.paredeParaUTC(iniWall, tz);
    const dataFim = this.paredeParaUTC(fimWall, tz);
    if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) throw new Error('Datas inválidas');
    if (dataFim.getTime() <= dataInicio.getTime()) throw new Error('Data fim deve ser maior que início');
    // Reusa o calculo (valida horas e devolve totais) com as mesmas datas.
    const calculo = await this.calcular({ ...dados, data_inicio_local: iniWall, data_fim_local: fimWall });
    const payload = {
      contratante_id: contratanteId,
      titulo: String(dados.titulo).trim(),
      descricao: dados.descricao || '',
      funcao: dados.funcao || '',
      valor_servico: valorServico,
      valor_transporte: Number(dados.valor_transporte ?? dados.valorTransporte ?? 0) || 0,
      valor_hora: Number(calculo.valor_hora_bruto || 0),
      total_freela: Number(calculo.freela_recebe_liquido || 0),
      status_vaga_id: 1,
      data_inicio: dataInicio,
      data_fim: dataFim,
    };
    const criada: any = await this.getRepo().criarGenerico(payload);
    const vagaId = Number((criada as any)?.id);
    try {
      await new EnderecoVagaService().vincular(vagaId, enderecoId);
    } catch (e: any) {
      // Sem endereco a vaga nao aparece direito no mural: desfaz a criacao.
      try { await this.deletar(vagaId); } catch {}
      throw new Error('Não foi possível vincular o endereço à vaga: ' + (e.message || 'erro desconhecido'));
    }
    return criada;
  }

  // ATUALIZAR — mesmo mapeamento do criar. Se vier endereco_id novo, troca o
  // vinculo no pivo; se vierem datas novas, revalida fim > inicio.
  async atualizar(id: number, dados: any): Promise<any> {
    const existente: any = await this.buscarPorId(id);
    if (!existente) throw new Error('Registro não encontrado para atualizar');
    const { iniWall, fimWall } = this.extrairDatas(dados);
    const tz = dados.timezone || 'America/Sao_Paulo';
    const patch: any = {};
    if (dados.titulo !== undefined) patch.titulo = String(dados.titulo).trim();
    if (dados.descricao !== undefined) patch.descricao = dados.descricao || '';
    if (dados.funcao !== undefined) patch.funcao = dados.funcao || '';
    if (dados.valor_servico !== undefined || dados.valor_transporte !== undefined) {
      const vs = Number(dados.valor_servico ?? existente.valorServico ?? existente.valor_servico ?? 0);
      const vt = Number(dados.valor_transporte ?? existente.valorTransporte ?? existente.valor_transporte ?? 0);
      patch.valor_servico = vs; patch.valor_transporte = vt || 0;
    }
    if (iniWall || fimWall) {
      const iniAtual = iniWall || this.isoParaParede(existente.dataInicio || existente.data_inicio, tz);
      const fimAtual = fimWall || this.isoParaParede(existente.dataFim || existente.data_fim, tz);
      if (!iniAtual || !fimAtual) throw new Error('Data de início e fim obrigatórias');
      const dataInicio = this.paredeParaUTC(iniAtual, tz);
      const dataFim = this.paredeParaUTC(fimAtual, tz);
      if (dataFim.getTime() <= dataInicio.getTime()) throw new Error('Data fim deve ser maior que início');
      const calculo = await this.calcular({ ...dados, valor_servico: patch.valor_servico ?? existente.valorServico, valor_transporte: patch.valor_transporte ?? existente.valorTransporte, data_inicio_local: iniAtual, data_fim_local: fimAtual });
      patch.data_inicio = dataInicio; patch.data_fim = dataFim;
      patch.valor_hora = Number(calculo.valor_hora_bruto || 0);
      patch.total_freela = Number(calculo.freela_recebe_liquido || 0);
    }
    const atualizada: any = await this.getRepo().atualizarGenerico(id, patch);
    const enderecoId = Number(dados.endereco_id || dados.enderecoId);
    if (enderecoId && !isNaN(enderecoId)) {
      const evSvc = new EnderecoVagaService();
      const atuais: any[] = await evSvc.listarPorVaga(id).catch(() => []);
      const jaVinculado = atuais.some((v: any) => Number(v.endereco_id ?? v.enderecoId) === enderecoId);
      if (!jaVinculado) {
        for (const v of atuais) { try { await evSvc.desvincular(id, Number(v.endereco_id ?? v.enderecoId)); } catch {} }
        await evSvc.vincular(id, enderecoId);
      }
    }
    return atualizada;
  }

  // ISO/UTC do banco -> "YYYY-MM-DDTHH:mm" no fuso do usuario (p/ revalidar edicao).
  private isoParaParede(iso: any, tz: string): string {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
      const p: any = {}; for (const x of fmt.formatToParts(d)) if (x.type !== 'literal') p[x.type] = x.value;
      return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
    } catch { return ''; }
  }
}
