import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function PainelPublicarVaga() {
  const { styles } = useTheme();
  const [form, setForm] = useState({ funcao: 'Garçom', dataHora: '', horas: 8, valorHora: 20, uber: 15, endereco: 'Rua Duque de Caxias 500 - Centro, Uberlândia - MG' });
  const subtotal = form.horas * form.valorHora + form.uber;
  const totalCartao = subtotal * 1.14;
  const totalPix = subtotal * 1.10;
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const publicar = async () => {
    const token = localStorage.getItem('@UaiFrila:token');
    const res = await fetch(`${API}/vagas/criar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ funcao: form.funcao, data_hora: form.dataHora, horas_estimadas: form.horas, valor_hora_limpo: form.valorHora, ajuda_custo_transporte: form.uber, endereco_completo: form.endereco })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.erro); return; }
    alert('Vaga publicada!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className={`p-8 ${styles.bgQuadros}`}>
        <h2 className="text-2xl font-black uppercase">Publicação - Cria vaga com função, data/hora Qui-Dom, valor/hora, ajuda Uber</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <select value={form.funcao} onChange={e=>setForm({...form, funcao: e.target.value})} className={`px-4 py-3 text-sm ${styles.input}`}><option>Garçom</option><option>Barman</option><option>Cumim</option></select>
          <input type="datetime-local" value={form.dataHora} onChange={e=>setForm({...form, dataHora: e.target.value})} className={`px-4 py-3 text-sm ${styles.input}`} />
          <input type="number" value={form.horas} onChange={e=>setForm({...form, horas: Number(e.target.value)})} placeholder="Horas estimadas" className={`px-4 py-3 text-sm ${styles.input}`} />
          <input type="number" value={form.valorHora} onChange={e=>setForm({...form, valorHora: Number(e.target.value)})} placeholder="Valor hora limpo" className={`px-4 py-3 text-sm ${styles.input}`} />
          <select value={form.uber} onChange={e=>setForm({...form, uber: Number(e.target.value)})} className={`px-4 py-3 text-sm ${styles.input}`}><option value={10}>Uber R$10</option><option value={15}>Uber R$15</option><option value={20}>Uber R$20</option><option value={30}>Uber R$30</option></select>
          <input value={form.endereco} onChange={e=>setForm({...form, endereco: e.target.value})} placeholder="Endereço completo com Google Maps" className={`px-4 py-3 text-sm ${styles.input}`} />
        </div>
        <div className="mt-6 p-4 bg-[#FFC700] border-2 border-black text-black">
          <p className="text-xs font-bold uppercase">Preview Card Amarelo - Cálculo Automático</p>
          <p className="mt-2 text-sm">Horas*Valor + Uber = R${subtotal.toFixed(2)}</p>
          <p className="text-xs">Taxa 10% Pix = R${totalPix.toFixed(2)} total | Taxa 14% Cartão = R${totalCartao.toFixed(2)} total | Preview amarelo</p>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.endereco + ' Uberlândia MG Brasil')}`} target="_blank" className="text-[#0066FF] font-bold underline text-xs mt-2 block">📍 {form.endereco} - Ver no mapa</a>
        </div>
        <button onClick={publicar} className={`mt-6 w-full py-4 font-black uppercase text-sm ${styles.btnPrimary}`}>Publicar Vaga R$150 total exemplo</button>
      </div>
    </div>
  );
}
