import { BaseService } from './BaseService';
import { VariavelSistemaRepository } from '../repositories/VariavelSistemaRepository';
import { VariavelSistemaModel } from '../models/VariavelSistemaModel';
import { VARIAVEIS } from '../config/VariaveisSistema';
// Sem fallback: variavel ausente = erro explicito. Variaveis sao seed no 00-CRIACAO-BANCO-NOVO-COMPLETO.sql.
export class VariavelSistemaService extends BaseService<VariavelSistemaModel> {
  constructor() { super(new VariavelSistemaRepository()); }
  private get repoVar(): VariavelSistemaRepository { return this.getRepo() as VariavelSistemaRepository; }
  async buscarPorChave(chave: string): Promise<VariavelSistemaModel | null> { return await this.repoVar.buscarPorChave(chave); }
  async buscarValorObrigatorio(chave: string): Promise<string> { return await this.repoVar.buscarValorObrigatorio(chave); }
  async buscarNumeroObrigatorio(chave: string): Promise<number> { return await this.repoVar.buscarNumeroObrigatorio(chave); }
  async buscarBooleanObrigatorio(chave: string): Promise<boolean> { const v = await this.buscarValorObrigatorio(chave); return v === 'true' || v === '1'; }
  // Prazo em minutos, com fallback para a chave legada em HORAS.
  // O seed antigo do banco so tem PRAZO_CANCELAMENTO_*_HORAS (24h) - sem este
  // fallback, getConfigCancelamento() lancava e TODA listagem que o chamava
  // (mural, /vagas/minhas) caia em 500 antes de listar qualquer vaga.
  private async buscarPrazoMinutos(chaveMinutos: string, chaveHoras: string): Promise<number> {
    try { return await this.buscarNumeroObrigatorio(chaveMinutos); } catch {}
    try { return (await this.buscarNumeroObrigatorio(chaveHoras)) * 60; } catch {}
    return 240;
  }
  async getConfigCancelamento() {
    const prazoMin = await this.buscarPrazoMinutos(VARIAVEIS.PRAZO_CANCELAMENTO_CANDIDATURA_MINUTOS, 'PRAZO_CANCELAMENTO_CANDIDATURA_HORAS');
    const prazoVagaMin = await this.buscarPrazoMinutos(VARIAVEIS.PRAZO_CANCELAMENTO_VAGA_MINUTOS, 'PRAZO_CANCELAMENTO_VAGA_HORAS');
    let motivoMin = 10;
    try { motivoMin = await this.buscarNumeroObrigatorio(VARIAVEIS.MOTIVO_CANCELAMENTO_MIN_CARACTERES); } catch {}
    let notificar = true;
    try { notificar = await this.buscarBooleanObrigatorio(VARIAVEIS.NOTIFICAR_CANCELAMENTO); } catch {}
    return { prazoHoras: prazoMin / 60, prazoVagaHoras: prazoVagaMin / 60, prazoMin, prazoVagaMin, motivoMin, notificar };
  }
  async getConfigPagamento() {
    const taxaPlataforma = await this.buscarNumeroObrigatorio(VARIAVEIS.TAXA_PLATAFORMA_PERCENTUAL);
    const taxaPix = await this.buscarNumeroObrigatorio(VARIAVEIS.TAXA_PIX_PERCENTUAL);
    const taxaCartao = await this.buscarNumeroObrigatorio(VARIAVEIS.TAXA_CARTAO_PERCENTUAL);
    const multa = await this.buscarNumeroObrigatorio(VARIAVEIS.TAXA_CANCELAMENTO_VALOR);
    const escrowHoras = await this.buscarNumeroObrigatorio(VARIAVEIS.ESCROW_LIBERACAO_AUTOMATICA_HORAS);
    const pixChave = await this.buscarValorObrigatorio(VARIAVEIS.PIX_CHAVE_UAIFRILA);
    return { taxaPlataforma, taxaPix, taxaCartao, multa, escrowHoras, pixChave };
  }
  async listarPorCategoria(categoria: string): Promise<VariavelSistemaModel[]> { return await this.repoVar.listarPorCategoria(categoria); }
  async listarPorGrupo(grupo: string): Promise<VariavelSistemaModel[]> { return this.listarPorCategoria(grupo); }
  async atualizarPorChave(chave: string, valor: string): Promise<VariavelSistemaModel | null> {
    const existente: any = await this.repoVar.buscarPorChave(chave);
    if (!existente) throw new Error(`Variavel ${chave} nao encontrada`);
    const num = parseFloat(valor);
    const payload: any = { valor, valor_numerico: isNaN(num) ? null : num, atualizado_em: new Date() };
    return await this.getRepo().atualizarGenerico(existente.id, payload);
  }
}
