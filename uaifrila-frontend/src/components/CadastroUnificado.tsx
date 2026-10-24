import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function CadastroUnificado({ onCadastro }: { onCadastro?: () => void }) {
  const { styles } = useTheme();
  const [form, setForm] = useState({
    nome: '', cpf: '', email: '', senha: '',
    cnpj: '', nomeFantasia: '',
    funcao: 'Garçom', valorHora: 20, bio: '',
    bairro: 'Centro', comoChega: 'Moto', ajudaUber: 10,
    is_freela: true, is_contratante: false,
    termos: [false, false, false, false, false],
    temMei: false
  });
  const [bairros] = useState<string[]>(['Centro','Granja Marileusa','Karaíba','Santa Mônica','Umuarama','Jardim Karaíba','Morada da Colina','Patrimônio','Laranjeiras','Segismundo Pereira','Custódio Pereira','Jardim Europa','Jardim Célia','Luizote','Planalto','Chácaras Tubalina','Mansões Aeroporto']);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const handleSubmit = async () => {
    if (!form.termos.every(t=>t)) { alert('Aceite todos os termos obrigatórios'); return; }
    try {
      const res = await fetch(`${API}/usuarios/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome, cpf: form.cpf, email: form.email, senha: form.senha,
          cnpj: form.cnpj, nomeFantasia: form.nomeFantasia,
          isFreela: form.is_freela, isContratante: form.is_contratante,
          funcao: form.funcao, valorHora: form.valorHora, bio: form.bio,
          bairro: form.bairro, comoChega: form.comoChega, ajudaUber: form.ajudaUber,
          temMei: form.temMei
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      alert('Cadastro enviado! Verifique e-mail com código de confirmação.');
      onCadastro?.();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className={`p-8 ${styles.bgQuadros}`}>
        <h2 className="text-3xl font-black uppercase">Cadastro Unificado - Freela + Contratante (Duplex)</h2>
        <p className="text-xs mt-2">Pode marcar os dois tipos: mesmo usuário pode trampar e contratar. Marcador diferencia. Contato apenas por e-mail.</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <label className={`p-4 border-2 cursor-pointer flex items-center gap-3 ${form.is_freela ? 'bg-[#FFC700] border-black' : 'border-black/20'}`}>
            <input type="checkbox" checked={form.is_freela} onChange={e=>setForm({...form, is_freela: e.target.checked})} />
            <span className="font-black uppercase text-xs">Quero Trampar (Freela)</span>
          </label>
          <label className={`p-4 border-2 cursor-pointer flex items-center gap-3 ${form.is_contratante ? 'bg-[#E53935] text-white border-black' : 'border-black/20'}`}>
            <input type="checkbox" checked={form.is_contratante} onChange={e=>setForm({...form, is_contratante: e.target.checked})} />
            <span className="font-black uppercase text-xs">Quero Contratar (Empregador)</span>
          </label>
        </div>

        <h3 className="mt-8 font-black uppercase text-sm">Dados Pessoais (nome, CPF, selfie) - apenas e-mail</h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={form.nome} onChange={e=>setForm({...form, nome: e.target.value})} placeholder="Nome completo" className={`px-4 py-3 text-sm ${styles.input}`} />
          <input value={form.cpf} onChange={e=>setForm({...form, cpf: e.target.value})} placeholder="CPF" className={`px-4 py-3 text-sm ${styles.input}`} />
          <input value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="E-mail (único contato)" className={`px-4 py-3 text-sm ${styles.input}`} />
          <input value={form.senha} onChange={e=>setForm({...form, senha: e.target.value})} type="password" placeholder="Senha" className={`px-4 py-3 text-sm ${styles.input}`} />
          <select value={form.bairro} onChange={e=>setForm({...form, bairro: e.target.value})} className={`px-4 py-3 text-sm ${styles.input}`}>
            {bairros.map(b=><option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {form.is_freela && (
          <>
            <h3 className="mt-8 font-black uppercase text-sm">Profissional - Função Garçom R$20 / Barman R$25 / Cumim R$15</h3>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <select value={form.funcao} onChange={e=>setForm({...form, funcao: e.target.value})} className={`px-4 py-3 text-sm ${styles.input}`}>
                <option>Garçom - R$20/h</option><option>Barman - R$25/h</option><option>Cumim - R$15/h</option><option>Bandeja</option><option>Diarista</option><option>Eletricista</option>
              </select>
              <input type="number" value={form.valorHora} onChange={e=>setForm({...form, valorHora: Number(e.target.value)})} placeholder="Valor hora base" className={`px-4 py-3 text-sm ${styles.input}`} />
              <select value={form.comoChega} onChange={e=>setForm({...form, comoChega: e.target.value})} className={`px-4 py-3 text-sm ${styles.input}`}>
                <option>Moto 🏍</option><option>Carro 🚗</option><option>Ônibus</option><option>A pé</option>
              </select>
              <select value={form.ajudaUber} onChange={e=>setForm({...form, ajudaUber: Number(e.target.value)})} className={`px-4 py-3 text-sm ${styles.input}`}>
                <option value={10}>Uber R$10</option><option value={15}>Uber R$15</option><option value={20}>Uber R$20</option><option value={30}>Uber R$30</option>
              </select>
              <input value={form.bio} onChange={e=>setForm({...form, bio: e.target.value})} placeholder="Bio" className={`md:col-span-2 px-4 py-3 text-sm ${styles.input}`} />
            </div>
          </>
        )}

        {form.is_contratante && (
          <>
            <h3 className="mt-8 font-black uppercase text-sm">Empresa - Nome fantasia, CNPJ</h3>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={form.nomeFantasia} onChange={e=>setForm({...form, nomeFantasia: e.target.value})} placeholder="Nome Fantasia" className={`px-4 py-3 text-sm ${styles.input}`} />
              <input value={form.cnpj} onChange={e=>setForm({...form, cnpj: e.target.value})} placeholder="CNPJ 69.481.672/0001-62" className={`px-4 py-3 text-sm ${styles.input}`} />
            </div>
          </>
        )}

        <h3 className="mt-8 font-black uppercase text-sm">Termos 5 obrigatórios</h3>
        <div className="mt-3 space-y-2">
          {[
            'Autônomo Art 442-B CLT',
            'LGPD - Autorizo verificação CPF/RG/selfie',
            'MEI R$1500 - Limite R$1.500/mês sem MEI',
            'Cancelamento R$40 - Multa R$40 cancelamento <4h',
            'Intermediação CNAE 74.90-1-04 - EFI Bank escrow'
          ].map((t,i)=>(
            <label key={i} className="flex gap-3 p-3 border-2 border-black/10 text-xs cursor-pointer">
              <input type="checkbox" checked={form.termos[i]} onChange={e=>{ const nt=[...form.termos]; nt[i]=e.target.checked; setForm({...form, termos: nt}); }} />
              <span>{t}</span>
            </label>
          ))}
        </div>

        <button onClick={handleSubmit} className={`mt-8 w-full py-4 font-black uppercase text-sm ${styles.btnPrimary}`}>Cadastrar - Apenas E-mail</button>
      </div>
    </div>
  );
}