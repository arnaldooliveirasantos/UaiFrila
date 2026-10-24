import { useState } from 'react';

export const PainelPublicarVaga: React.FC = () => {
  const [form, setForm] = useState({ funcao: 'Garçom', endereco: '', dataHora: '', valor: '' });
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  
  const publicar = async () => {
    const token = localStorage.getItem('@UaiFrila:token');
    try {
      const res = await fetch(`${API_BASE}/vagas/criar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.erro);
      alert('🎉 Vaga publicada!');
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="text-2xl font-black uppercase">📢 Publicar Vaga</h2>
      <div className="p-6 rounded-3xl bg-black border-2 border-[#0066FF] space-y-4">
        <select value={form.funcao} onChange={e=>setForm({...form, funcao: e.target.value})} className="w-full p-3 rounded-xl bg-black border border-gray-800 text-white"><option>Garçom</option><option>Barman</option><option>Cumim</option></select>
        <input value={form.endereco} onChange={e=>setForm({...form, endereco: e.target.value})} placeholder="Endereço completo" className="w-full p-3 rounded-xl bg-black border border-gray-800 text-white" />
        <input value={form.dataHora} onChange={e=>setForm({...form, dataHora: e.target.value})} type="datetime-local" className="w-full p-3 rounded-xl bg-black border border-gray-800 text-white" />
        <input value={form.valor} onChange={e=>setForm({...form, valor: e.target.value})} placeholder="Valor R$ (ex: 130)" className="w-full p-3 rounded-xl bg-black border border-gray-800 text-white" />
        <button onClick={publicar} className="w-full py-3 rounded-xl bg-[#0066FF] text-white font-black uppercase">Publicar</button>
      </div>
    </div>
  );
};
