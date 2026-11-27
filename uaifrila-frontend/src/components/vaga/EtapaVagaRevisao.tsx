import React from 'react';
import { useUaiFrilaStyles } from '../../styles/uaifrila.styles';
import type { VagaForm, CalculoBackend } from './Types';
// Etapa 4/4 - Revisao. So leitura: nada e salvo aqui, o botao Publicar /
// Atualizar do orchestrador e que envia tudo de uma vez.
export default function EtapaVagaRevisao({ form, turnos, turnosOrdenados, valorTotalTurnos, calculoBackend }: {
  form: VagaForm; turnos: any[]; turnosOrdenados: any[]; valorTotalTurnos: number; calculoBackend: CalculoBackend | null;
}) {
  const styles = useUaiFrilaStyles();
  return (
    <div className={styles.cardSmall + ' mt-2'}>
      <p className={styles.typography.body + ' font-black'}>Revisão — nada foi salvo ainda</p>
      <p className={styles.typography.bodySmall}>{form.titulo} • {new Set(turnos.map((x: any) => x.data)).size} dia(s) • {turnos.length} turno(s) • Serviço R$ {valorTotalTurnos.toFixed(2).replace('.', ',')} • Transporte R$ {turnos.reduce((s: number, x: any) => s + Number(x.valor_transporte || 0), 0).toFixed(2)} • {form.quantidadeVagas} vaga(s) • {form.enderecoAtivo ? `${form.enderecoAtivo.logradouro || form.enderecoAtivo.endereco_completo || ''} - ${form.enderecoAtivo.bairro || ''}` : 'sem endereço'}</p>
      <p className={styles.typography.bodySmall}>{turnosOrdenados.map((x: any) => `${x.data.split('-').reverse().join('/')} ${x.hora_inicio}–${x.hora_fim} (R$ ${Number(x.valor_servico).toFixed(2)})`).join(' • ')}</p>
      {calculoBackend && <p className={styles.typography.bodySmall}>Total geral a pagar (cartão): R$ {((calculoBackend.total_cartao || calculoBackend.total_contratante || 0) * (Number(form.quantidadeVagas) || 1)).toFixed(2).replace('.', ',')} • Freela recebe por vaga: R$ {(calculoBackend.freela_recebe_liquido || 0).toFixed(2).replace('.', ',')}</p>}
      <p className={styles.typography.caption}>Candidatura vale para todos os dias. Valor por turno só no acerto em caso de imprevisto. Ao clicar em Publicar / Atualizar, tudo é enviado de uma vez (POST / PUT /api/vagas).</p>
    </div>
  );
}
