import { useState, useEffect } from 'react';

export const PainelMeusTrampos: React.FC = () => {
  const [trampos, setTrampos] = useState<any[]>([]);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  useEffect(() => {
    const token = localStorage.getItem('@UaiFrila:token');
    fetch(`${API_BASE}/vagas/meus-trampos`, { headers: { Authorization: `Bearer ${token}` }})
      .then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setTrampos(d); }).catch(()=>{});
  }, [API_BASE]);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black uppercase">⏱️ Meus Trampos</h2>
      {trampos.length===0 ? <p className="text-sm text-gray-500 p-8 text-center border-2 border-dashed rounded-2xl">Nenhum trampo ainda. Vá ao Mural!</p> :
        <div className="grid gap-3">{trampos.map((t:any)=><div key={t.id} className="p-4 rounded-xl bg-black border border-gray-800 text-white flex justify-between"><span>{t.funcao} - {t.data_hora}</span><span className="font-bold text-green-400">R$ {t.valor}</span></div>)}</div>
      }
    </div>
  );
};
