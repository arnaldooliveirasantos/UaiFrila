export type MeioPagamento = 'pix' | 'cartao';

export interface TaxasSistema {
  comissao_percentual: number; // ex 10 = 10%
  taxa_pix_percentual: number; // ex 1 = 1%
  taxa_cartao_percentual: number; // ex 3.99 = 3.99%
  taxa_pix_fixa?: number;
  taxa_cartao_fixa?: number;
}

export interface CalculoPagamento {
  horasEstimadas: number;
  valorHora: number;
  ajudaTransporte: number;
  meioPagamento: MeioPagamento;
  taxas: TaxasSistema;
  
  subtotalServico: number;
  taxaPagamento: number;
  comissaoApp: number;
  totalContratante: number;
  
  freelaRecebeBruto: number;
  freelaRecebeLiquido: number;
  valorHoraLiquido: number;
}

export const TAXAS_DEFAULT: TaxasSistema = {
  comissao_percentual: 10,
  taxa_pix_percentual: 0.99,
  taxa_cartao_percentual: 3.99,
  taxa_pix_fixa: 0,
  taxa_cartao_fixa: 0,
};

export function calcularPagamento(params: {
  dataInicio: string; // ISO local datetime-local
  dataFim: string;
  valorHora: number;
  ajudaTransporte: number;
  meioPagamento: MeioPagamento;
  taxas?: TaxasSistema;
}): CalculoPagamento {
  const inicio = new Date(params.dataInicio);
  const fim = new Date(params.dataFim);
  let horas = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60);
  if (isNaN(horas) || horas < 0) horas = 0;
  horas = Math.round(horas * 100) / 100; // 2 casas
  
  const taxas = params.taxas || TAXAS_DEFAULT;
  const subtotal = horas * params.valorHora;
  const taxaPercent = params.meioPagamento === 'pix' ? taxas.taxa_pix_percentual : taxas.taxa_cartao_percentual;
  const taxaFixa = params.meioPagamento === 'pix' ? (taxas.taxa_pix_fixa || 0) : (taxas.taxa_cartao_fixa || 0);
  
  const taxaPagamento = (subtotal * taxaPercent / 100) + taxaFixa;
  const comissaoApp = subtotal * taxas.comissao_percentual / 100;
  
  const totalContratante = subtotal + params.ajudaTransporte + taxaPagamento + comissaoApp;
  
  // Freela recebe: subtotal + transporte (total - taxas) OU líquido descontando taxas
  // Regra: freela recebe subtotal + transporte - comissao - taxa? Vamos mostrar ambos
  // Para exibir no mural: quanto ele vai receber liquido
  const freelaRecebeBruto = subtotal + params.ajudaTransporte;
  const freelaRecebeLiquido = subtotal + params.ajudaTransporte - comissaoApp - taxaPagamento;
  const valorHoraLiquido = horas > 0 ? (subtotal - comissaoApp - taxaPagamento) / horas : 0;
  
  return {
    horasEstimadas: horas,
    valorHora: params.valorHora,
    ajudaTransporte: params.ajudaTransporte,
    meioPagamento: params.meioPagamento,
    taxas,
    subtotalServico: subtotal,
    taxaPagamento,
    comissaoApp,
    totalContratante,
    freelaRecebeBruto,
    freelaRecebeLiquido,
    valorHoraLiquido,
  };
}

export function buscarTaxasDoBackend(variaveis: any[]): TaxasSistema {
  const find = (chave: string) => variaveis.find((v: any) => v.chave === chave);
  
  const comissao = find('COMISSAO_APLICATIVO') || find('TAXA_PLATAFORMA_PERCENTUAL') || find('COMISSAO_PERCENTUAL');
  const taxaPix = find('TAXA_PIX_PERCENTUAL') || find('TAXA_PAGAMENTO_PIX');
  const taxaCartao = find('TAXA_CARTAO_PERCENTUAL') || find('TAXA_PAGAMENTO_CARTAO');
  const taxaPixFixa = find('TAXA_PIX_FIXA');
  const taxaCartaoFixa = find('TAXA_CARTAO_FIXA');
  
  return {
    comissao_percentual: comissao ? parseFloat(comissao.valor_numerico || comissao.valor) : TAXAS_DEFAULT.comissao_percentual,
    taxa_pix_percentual: taxaPix ? parseFloat(taxaPix.valor_numerico || taxaPix.valor) : TAXAS_DEFAULT.taxa_pix_percentual,
    taxa_cartao_percentual: taxaCartao ? parseFloat(taxaCartao.valor_numerico || taxaCartao.valor) : TAXAS_DEFAULT.taxa_cartao_percentual,
    taxa_pix_fixa: taxaPixFixa ? parseFloat(taxaPixFixa.valor_numerico || taxaPixFixa.valor) : 0,
    taxa_cartao_fixa: taxaCartaoFixa ? parseFloat(taxaCartaoFixa.valor_numerico || taxaCartaoFixa.valor) : 0,
  };
}
