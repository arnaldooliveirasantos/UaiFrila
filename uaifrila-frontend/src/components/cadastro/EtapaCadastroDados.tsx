import React from 'react';
import { useUaiFrilaStyles } from '../../styles/uaifrila.styles';
import { formatarCPF, formatarCNPJ } from '../../utils/mascaras';
// Etapa 2/4 - Seus dados. So edita o form em memoria, nao salva.
export default function EtapaCadastroDados({ form, setForm, isReadOnly, modoEdicao }: any) {
  const styles = useUaiFrilaStyles();
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><label className={styles.label}>Nome</label><input value={form.nome} disabled={isReadOnly} onChange={e => setForm({ ...form, nome: e.target.value })} className={styles.input} /></div>
      <div><label className={styles.label}>CPF</label><input value={formatarCPF(form.cpf || '')} disabled={isReadOnly || modoEdicao} onChange={e => setForm({ ...form, cpf: e.target.value.replace(/\D/g, '').slice(0, 11) })} className={styles.input + (modoEdicao ? ' opacity-60' : '')} placeholder="000.000.000-00" inputMode="numeric" maxLength={14} /></div>
      <div><label className={styles.label}>E-mail *</label><input type="email" value={form.email} disabled={isReadOnly || modoEdicao} onChange={e => setForm({ ...form, email: e.target.value })} className={styles.input + (modoEdicao ? ' opacity-60' : '')} placeholder="voce@email.com" autoComplete="email" /></div>
      <div><label className={styles.label}>CNPJ (opcional)</label><input value={formatarCNPJ(form.cnpj || '')} disabled={isReadOnly} onChange={e => setForm({ ...form, cnpj: e.target.value.replace(/\D/g, '').slice(0, 14) })} className={styles.input} placeholder="00.000.000/0000-00" inputMode="numeric" maxLength={18} /></div>
    </div>
  );
}
