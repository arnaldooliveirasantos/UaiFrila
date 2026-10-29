
import { TransacaoRepository } from '../repositories/TransacaoRepository';

export class TransacaoService {
  private repository: TransacaoRepository;

  constructor() {
    this.repository = new TransacaoRepository();
  }

  async listarPorUsuario(usuarioId: number, nivelPermissao: number = 0) {
    if (nivelPermissao >= 50) {
      return await this.repository.listarTodas();
    }
    return await this.repository.listarPorUsuario(usuarioId);
  }

  async criarTransacaoAPartirDaVaga(vaga: any, trampoId: number) {
    // Calcula baseado em variaveis_sistema e campos da vaga
    const base = Number(vaga.valor_servico || 0) + Number(vaga.valor_transporte || 0);
    const taxaPercent = 15; // padrão, buscar de variaveis_sistema se existir
    const taxaValor = base * taxaPercent / 100;
    const ajuda = Number(vaga.valor_transporte || 0);
    const totalContratante = base;
    const liquidoFreela = Number(vaga.total_freela || base - taxaValor);

    return await this.repository.criar({
      vaga_id: vaga.id,
      trampo_id: trampoId,
      freela_id: vaga.freela_id || trampoId,
      contratante_id: vaga.contratante_id,
      cidade_id: vaga.cidade_id,
      cidade_nome: vaga.cidade_nome,
      valor_base: base,
      taxa_percentual: taxaPercent,
      taxa_valor: taxaValor,
      ajuda_custo: ajuda,
      valor_total_contratante: totalContratante,
      valor_liquido_freela: liquidoFreela,
      metodo_pagamento: 'PIX',
      data_inicio: vaga.data_inicio,
      usuario_id: vaga.contratante_id
    });
  }
}
