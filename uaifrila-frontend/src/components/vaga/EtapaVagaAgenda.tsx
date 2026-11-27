import React from 'react';
import TelaAgendaVaga, { Turno } from '../TelaAgendaVaga';
// Etapa 2/4 - Dias e turnos. E a propria TelaAgendaVaga.
// Confirmar = salva os turnos SO em memoria e avanca para Endereco e valores.
// Voltar = volta para O que e a vaga. Nada e enviado ao backend aqui:
// o PUT /api/vagas/:id/turnos intermediario foi removido - tudo vai no
// payload unico do publicar, na etapa Revisao.
export default function EtapaVagaAgenda({ turnos, onConfirmar, onCancelar, etapas, etapa, antecedenciaMinutos }: {
  turnos: Turno[]; onConfirmar: (t: Turno[]) => void; onCancelar: () => void;
  etapas: string[]; etapa: number; antecedenciaMinutos: number;
}) {
  return <TelaAgendaVaga turnosIniciais={turnos} onConfirmar={onConfirmar} onCancelar={onCancelar} etapas={etapas} etapa={etapa} antecedenciaMinutos={antecedenciaMinutos} />;
}
