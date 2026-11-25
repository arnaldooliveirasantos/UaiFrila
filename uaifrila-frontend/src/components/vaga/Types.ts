import type { Turno } from '../TelaAgendaVaga';
export type { Turno };
export interface VagaForm {
  funcaoId: number | null; titulo: string; descricao: string;
  dataHoraInicio: string; dataHoraFim: string;
  valorServicoStr: string; valorServicoNum: number;
  valorTransporteStr: string; valorTransporteNum: number;
  enderecoId: number | null; enderecoAtivo: any;
  quantidadeVagas: number; dataLimiteCandidatura: string;
}
export interface CalculoBackend {
  valor_servico: number; valor_transporte: number; base_calculo: number;
  horas_estimadas: number; valor_hora_bruto: number; taxa_pix_percentual: number;
  taxa_cartao_percentual: number; comissao_percentual: number; taxa_pagamento: number;
  comissao_app: number; total_contratante: number; total_pix: number; total_cartao: number;
  economia_pix: number; freela_recebe_bruto: number; freela_recebe_liquido: number;
  valor_hora_liquido: number; valor_hora_final: number; valor_minimo_valido: boolean;
  mensagem_validacao?: string;
}
