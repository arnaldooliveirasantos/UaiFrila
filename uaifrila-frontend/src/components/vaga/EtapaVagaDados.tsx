import React from 'react';
import { useUaiFrilaStyles } from '../../styles/uaifrila.styles';
import type { VagaForm } from './Types';
// Etapa 1/4 - O que e a vaga. So edita o form em memoria, nao salva.
export default function EtapaVagaDados({ form, setForm, funcoes, carregandoFuncoes, templates, aplicarTemplate }: {
  form: VagaForm; setForm: (f: any) => void; funcoes: any[]; carregandoFuncoes: boolean;
  templates: any[]; aplicarTemplate: (id: string) => void;
}) {
  const styles = useUaiFrilaStyles();
  return (<>
    <div>
      <label className={styles.label}>Titulo *</label>
      <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value.slice(0, 100) })} placeholder="Ex: Garçom sábado - Evento no Centro" className={styles.input} />
    </div>
    <div>
      <label className={styles.label}>Descricao *</label>
      <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value.slice(0, 500) })} rows={4} placeholder="Descreva o trabalho, uniforme, horário de chegada..." className={styles.textarea} />
    </div>
    <div>
      <label className={styles.label}>Funcao *</label>
      <select value={form.funcaoId ?? ''} onChange={e => setForm({ ...form, funcaoId: Number(e.target.value) || null })} disabled={carregandoFuncoes} className={styles.select}>
        <option value="">{carregandoFuncoes ? 'Carregando funcoes...' : 'Selecione a funcao'}</option>
        {funcoes.map((f: any) => (<option key={f.id} value={f.id}>{f.nome}</option>))}
      </select>
    </div>
    <div>
      <label className={styles.label}>Template de vaga (opcional)</label>
      <select value="" onChange={(e) => aplicarTemplate(e.target.value)} className={styles.select}>
        <option value="">Sem template — preencher do zero</option>
        {templates.map((tpl: any) => (<option key={tpl.id} value={tpl.id}>{tpl.nome} ({tpl.funcao_nome || 'função'})</option>))}
      </select>
      <p className={styles.typography.caption + ' mt-1'}>O template preenche função, título e descrição. Os dias e turnos você define na próxima etapa.</p>
    </div>
    <div className={styles.grid2Cols}>
      <div>
        <label className={styles.label}>Quantas pessoas a vaga precisa? *</label>
        <input type="number" min={1} max={20} value={form.quantidadeVagas} onChange={(e) => setForm({ ...form, quantidadeVagas: Number(e.target.value) })} className={styles.input} />
        <p className={styles.typography.caption + ' mt-1'}>1 = fluxo normal. Mais de 1 = seleção em lote + lista de espera.</p>
      </div>
      <div>
        <label className={styles.label}>Candidaturas até (opcional)</label>
        <input type="datetime-local" value={form.dataLimiteCandidatura} onChange={(e) => setForm({ ...form, dataLimiteCandidatura: e.target.value })} className={styles.input} />
        <p className={styles.typography.caption + ' mt-1'}>Vazio = até o início do primeiro turno.</p>
      </div>
    </div>
  </>);
}
