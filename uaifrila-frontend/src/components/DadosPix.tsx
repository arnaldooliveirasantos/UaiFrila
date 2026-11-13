import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
// Dados PIX - CORRIGIDO: 404 / sem pix = tela vazia p/ preencher, NÃO erro.
// Antes: qualquer 404 caía em setErro e a tela ficava sem nada visível.
// GET/POST/DELETE /api/usuario/pix (rotas criadas no App.ts - ver App.patch.txt)
const TIPOS = ['CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'ALEATORIA'];
const FORM_VAZIO = { tipo_chave: 'CPF', chave_pix: '', nome_titular: '', cpf_cnpj_titular: '', banco: '', agencia: '', conta: '', tipo_conta: 'CORRENTE' };
export default function DadosPix() {
  const styles = useUaiFrilaStyles();
  const [form, setForm] = useState<any>({ ...FORM_VAZIO });
  const [temPix, setTemPix] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(''); const [ok, setOk] = useState('');
  useEffect(() => { (async () => {
    try {
      const d = await apiFetch('/api/usuario/pix');
      const p = d?.pix || d?.data || d || null;
      if (p?.id || p?.chave_pix) {
        setTemPix(true);
        setForm({ tipo_chave: p.tipo_chave || 'CPF', chave_pix: p.chave_pix || '', nome_titular: p.nome_titular || '', cpf_cnpj_titular: p.cpf_cnpj_titular || '', banco: p.banco || '', agencia: p.agencia || '', conta: p.conta || '', tipo_conta: p.tipo_conta || 'CORRENTE' });
      } else { setTemPix(false); setForm({ ...FORM_VAZIO }); }
    } catch (e: any) {
      // 404 = rota ainda não aplicada ou sem pix cadastrado -> mostra form vazio, não trava a tela
      if (String(e?.message || '').includes('404')) { setTemPix(false); setForm({ ...FORM_VAZIO }); }
      else setErro(e.message || 'Não foi possível carregar seus dados PIX');
    } finally { setCarregando(false); }
  })(); }, []);
  const salvar = async () => { setSalvando(true); setErro(''); setOk(''); try { const d = await apiFetch('/api/usuario/pix', { method: 'POST', body: JSON.stringify(form) }); const p = d?.pix || d?.data; if (p) setForm({ tipo_chave: p.tipo_chave, chave_pix: p.chave_pix, nome_titular: p.nome_titular, cpf_cnpj_titular: p.cpf_cnpj_titular || '', banco: p.banco || '', agencia: p.agencia || '', conta: p.conta || '', tipo_conta: p.tipo_conta || 'CORRENTE' }); setTemPix(true); setOk('Dados PIX salvos. É para essa chave que seus trampos serão pagos.'); } catch (e: any) { setErro(e.message); } finally { setSalvando(false); } };
  const excluir = async () => { if (!confirm('Remover seus dados PIX?')) return; try { await apiFetch('/api/usuario/pix', { method: 'DELETE' }); setForm({ ...FORM_VAZIO }); setTemPix(false); setOk('Dados PIX removidos.'); } catch (e: any) { setErro(e.message); } };
  if (carregando) return <div className={styles.pageContainer}><div className={styles.card}><p className="animate-pulse">Carregando dados PIX...</p></div></div>;
  return (<div className={styles.pageContainer}><h1 className={styles.typography.h1}>Meus Dados PIX</h1><p className={styles.typography.body + ' mt-2'}>Para receber o pagamento dos trampos realizados. 1 chave ativa por usuário.</p>
    {!temPix && <div className="mt-4 p-3 text-xs bg-yellow-50 border border-yellow-200 rounded">Você ainda não cadastrou sua chave PIX. Preencha abaixo — sem ela você não recebe os trampos.</div>}
    {erro && <div className="mt-4 p-3 text-xs bg-red-100 text-red-700 rounded">{erro}</div>}
    {ok && <div className="mt-4 p-3 text-xs bg-green-100 text-green-700 rounded">{ok}</div>}
    <div className={styles.card + ' mt-4'}><div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><label className={styles.label}>Tipo da chave *</label><select value={form.tipo_chave} onChange={e => setForm({ ...form, tipo_chave: e.target.value })} className={styles.select}>{TIPOS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className={styles.label}>Chave PIX *</label><input value={form.chave_pix} onChange={e => setForm({ ...form, chave_pix: e.target.value })} className={styles.input} placeholder={form.tipo_chave === 'EMAIL' ? 'voce@email.com' : form.tipo_chave === 'CPF' ? '00000000000' : 'Sua chave'} /></div>
      <div><label className={styles.label}>Nome do titular *</label><input value={form.nome_titular} onChange={e => setForm({ ...form, nome_titular: e.target.value })} className={styles.input} placeholder="Nome igual ao da conta" /></div>
      <div><label className={styles.label}>CPF/CNPJ do titular</label><input value={form.cpf_cnpj_titular} onChange={e => setForm({ ...form, cpf_cnpj_titular: e.target.value.replace(/\D/g, '').slice(0, 14) })} className={styles.input} placeholder="Só números" inputMode="numeric" /></div>
      <div><label className={styles.label}>Banco</label><input value={form.banco} onChange={e => setForm({ ...form, banco: e.target.value })} className={styles.input} placeholder="Ex: Nubank, Caixa, Banco do Brasil" /></div>
      <div><label className={styles.label}>Agência</label><input value={form.agencia} onChange={e => setForm({ ...form, agencia: e.target.value })} className={styles.input} placeholder="0000" /></div>
      <div><label className={styles.label}>Conta</label><input value={form.conta} onChange={e => setForm({ ...form, conta: e.target.value })} className={styles.input} placeholder="000000-0" /></div>
      <div><label className={styles.label}>Tipo da conta</label><select value={form.tipo_conta} onChange={e => setForm({ ...form, tipo_conta: e.target.value })} className={styles.select}><option value="CORRENTE">Corrente</option><option value="POUPANCA">Poupança</option></select></div>
    </div>
    <div className="flex gap-2 mt-4"><button onClick={salvar} disabled={salvando} className="px-4 py-2 bg-black text-white text-sm font-bold rounded disabled:opacity-50">{salvando ? 'Salvando...' : 'Salvar dados PIX'}</button>{temPix && <button onClick={excluir} className="px-4 py-2 border text-sm rounded">Remover</button>}</div></div></div>);
}
