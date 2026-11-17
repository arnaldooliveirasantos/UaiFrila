import { BaseService } from './BaseService';
import { VariavelSistemaService } from './VariavelSistemaService';
import { ProvedorPagamentoService } from './ProvedorPagamentoService';
import { reaisParaCentavos, grossUpCentavos, comissaoCentavos } from '../utils/Dinheiro';
// Cálculo canônico (único lugar que calcula preço). Regras travadas:
// - Comissão = 10% x (serviço + transporte). Chave: COMISSAO_PLATAFORMA_PERCENTUAL.
// - Transporte é POR TURNO: 3 turnos no mesmo dia = 3 transportes (pode ser 0).
// - Total(método) = (S + T + C) / (1 - taxa_método). Taxas vêm do provedor ativo.
// - Freela recebe líquido = S + T (a plataforma absorve comissão e taxa no total).
// - Retorno NÃO-admin NUNCA inclui comissão/taxa/percentuais (sigilo comercial).
export interface CalculoEntrada {
  valor_servico?: number; valor_transporte?: number;
  turnos?: Array<{ valor_servico?: number; valor_transporte?: number }>;
  data_inicio_local?: string; data_fim_local?: string; data_inicio?: string; data_fim?: string;
  meio_pagamento?: string;
}
export class CalculoPagamentoService extends BaseService<any> {
  private variavelSvc = new VariavelSistemaService();
  private provedorSvc = new ProvedorPagamentoService();
  constructor() { super(undefined as any); }
  async calcular(dados: CalculoEntrada, isAdmin = false): Promise<any> {
    try {
      let servicoC = 0, transporteC = 0;
      if (Array.isArray(dados.turnos) && dados.turnos.length) {
        for (const t of dados.turnos) { servicoC += reaisParaCentavos(Number(t.valor_servico || 0)); transporteC += reaisParaCentavos(Number(t.valor_transporte || 0)); }
      } else {
        servicoC = reaisParaCentavos(Number(dados.valor_servico ?? 0));
        transporteC = reaisParaCentavos(Number(dados.valor_transporte ?? 0));
      }
      if (servicoC <= 0) throw new Error('Valor do serviço obrigatório');
      if (transporteC < 0) throw new Error('Valor do transporte inválido');
      const comissaoPct = await this.variavelSvc.buscarNumeroObrigatorio('COMISSAO_PLATAFORMA_PERCENTUAL');
      const valorMinimo = await this.variavelSvc.buscarNumeroObrigatorio('VALOR_MINIMO_VAGA').catch(() => 75);
      const provedor = await this.provedorSvc.buscarAtivo();
      const taxaPix = Number((provedor as any).taxaPixPercentual ?? (provedor as any).taxa_pix_percentual ?? 1);
      const taxaCartao = Number((provedor as any).taxaCartaoPercentual ?? (provedor as any).taxa_cartao_percentual ?? 4);
      const comissaoC = comissaoCentavos(servicoC, transporteC, comissaoPct);
      const baseComComissaoC = servicoC + transporteC + comissaoC;
      const totalPixC = grossUpCentavos(baseComComissaoC, taxaPix);
      const totalCartaoC = grossUpCentavos(baseComComissaoC, taxaCartao);
      const taxaPixC = totalPixC - baseComComissaoC;
      const taxaCartaoC = totalCartaoC - baseComComissaoC;
      let horas = 4;
      const iniStr = (dados as any).data_inicio_local || (dados as any).data_inicio;
      const fimStr = (dados as any).data_fim_local || (dados as any).data_fim;
      if (iniStr && fimStr) {
        const diffMs = new Date(fimStr).getTime() - new Date(iniStr).getTime();
        if (diffMs <= 0) throw new Error('Data fim deve ser maior que início');
        horas = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
      }
      const freelaRecebeC = servicoC + transporteC;
      const valorMinimoValido = freelaRecebeC >= reaisParaCentavos(valorMinimo);
      const publico = {
        valor_servico: servicoC / 100, valor_transporte: transporteC / 100,
        base_calculo: freelaRecebeC / 100, horas_estimadas: horas,
        valor_hora_bruto: horas > 0 ? (servicoC / 100) / horas : 0,
        total_pix: totalPixC / 100, total_cartao: totalCartaoC / 100,
        total_contratante: totalPixC / 100, contratante_paga: totalPixC / 100,
        economia_pix: (totalCartaoC - totalPixC) / 100,
        freela_recebe_liquido: freelaRecebeC / 100, freela_recebe_bruto: freelaRecebeC / 100,
        valor_a_receber: freelaRecebeC / 100, valor_servico_liquido: freelaRecebeC / 100,
        valor_hora_liquido: horas > 0 ? (freelaRecebeC / 100) / horas : 0,
        valor_hora_final: horas > 0 ? (freelaRecebeC / 100) / horas : 0,
        valor_minimo_valido: valorMinimoValido,
        mensagem_validacao: valorMinimoValido ? undefined : `Valor mínimo R$ ${Number(valorMinimo).toFixed(2)} - aumente o valor do serviço`,
        meio_pagamento: dados.meio_pagamento || 'pix', provedor: (provedor as any).provedor,
      };
      if (!isAdmin) return publico;
      return {
        ...publico,
        comissao_percentual: comissaoPct, taxa_pix_percentual: taxaPix, taxa_cartao_percentual: taxaCartao,
        comissao: comissaoC / 100, comissao_app: comissaoC / 100,
        taxa_pagamento: taxaPixC / 100, taxa_cartao: taxaCartaoC / 100, taxa_pagamento_cartao: taxaCartaoC / 100,
        taxa_pix_valor: taxaPixC / 100, taxa_cartao_valor: taxaCartaoC / 100,
        total_descontos: (comissaoC + taxaPixC) / 100,
        valor_servico_centavos: servicoC, valor_transporte_centavos: transporteC, comissao_centavos: comissaoC,
      };
    } catch (e: any) { this.handleError(e, 'CalculoPagamentoService.calcular'); }
  }
  // Gross-up por turno: usado no reembolso parcial (turnos confirmados não voltam).
  async grossUpTurno(servicoReais: number, transporteReais: number, metodo: string): Promise<number> {
    const comissaoPct = await this.variavelSvc.buscarNumeroObrigatorio('COMISSAO_PLATAFORMA_PERCENTUAL');
    const provedor = await this.provedorSvc.buscarAtivo();
    const taxa = metodo === 'cartao'
      ? Number((provedor as any).taxaCartaoPercentual ?? (provedor as any).taxa_cartao_percentual ?? 4)
      : Number((provedor as any).taxaPixPercentual ?? (provedor as any).taxa_pix_percentual ?? 1);
    const s = reaisParaCentavos(servicoReais), t = reaisParaCentavos(transporteReais);
    return grossUpCentavos(s + t + comissaoCentavos(s, t, comissaoPct), taxa);
  }
}
