import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function PainelMeusTrampos() {
  const { styles } = useTheme();
  const [trampos, setTrampos] = useState<any[]>([]);
  const [cronometros, setCronometros] = useState<Record<number, number>>({});
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    const token = localStorage.getItem('@UaiFrila:token');
    fetch(`${API}/vagas/mural`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ tipo: 'FREELA' }) })
      .then(r=>r.json()).then(d=>{ if (Array.isArray(d)) setTrampos(d.slice(0,3).map((v:any)=>({...v, status: 'ATIVA', codigo_inicio: 'A1B2C', codigo_fim: 'Z9Y8X', ponto_inicio: null}))); }).catch(()=>{});
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCronometros(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => { next[Number(k)] += 1; });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const iniciarPonto = (id: number, codigo: string) => {
    if (codigo !== 'A1B2C') { alert('Código início incorreto!'); return; }
    setCronometros(prev => ({ ...prev, [id]: 0 }));
    setTrampos(prev => prev.map(t => t.id === id ? { ...t, ponto_inicio: new Date().toISOString() } : t));
  };

  const finalizarPonto = (id: number, codigo: string) => {
    if (codigo !== 'Z9Y8X') { alert('Código fim incorreto!'); return; }
    alert('Trampo finalizado! Avaliação liberada. Freela recebe Pix ao finalizar, contratante fez Pix 1h antes.');
    setTrampos(prev => prev.map(t => t.id === id ? { ...t, status: 'CONCLUIDO' } : t));
  };

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600).toString().padStart(2,'0');
    const m = Math.floor((sec % 3600)/60).toString().padStart(2,'0');
    const s = (sec % 60).toString().padStart(2,'0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-black uppercase">Trampos com Ponto REAL cronômetro 00:00:00</h2>
      <div className="mt-6 grid gap-4">
        {trampos.map(trampo => (
          <div key={trampo.id} className={`p-6 ${styles.bgQuadros}`}>
            <div className="flex justify-between">
              <h3 className="font-black uppercase">{trampo.funcao}</h3>
              <span className="text-xs font-bold">{trampo.status}</span>
            </div>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(trampo.endereco_completo + ' Uberlândia MG Brasil')}`} target="_blank" className="text-[#0066FF] text-xs font-bold underline">📍 {trampo.endereco_completo} - Rota</a>
            {trampo.ponto_inicio && cronometros[trampo.id] !== undefined && (
              <div className="mt-4 text-3xl font-black tracking-widest">{formatTime(cronometros[trampo.id])}</div>
            )}
            <div className="mt-4 flex gap-2">
              {!trampo.ponto_inicio ? (
                <><input id={`codigo-inicio-${trampo.id}`} placeholder="Código início (A1B2C)" className={`px-3 py-2 text-xs ${styles.input}`} /><button onClick={()=>{ const el=document.getElementById(`codigo-inicio-${trampo.id}`) as HTMLInputElement; iniciarPonto(trampo.id, el.value); }} className={`px-4 py-2 text-xs font-black uppercase ${styles.btnPrimary}`}>Iniciar Ponto</button></>
              ) : (
                <><input id={`codigo-fim-${trampo.id}`} placeholder="Código fim (Z9Y8X)" className={`px-3 py-2 text-xs ${styles.input}`} /><button onClick={()=>{ const el=document.getElementById(`codigo-fim-${trampo.id}`) as HTMLInputElement; finalizarPonto(trampo.id, el.value); }} className={`px-4 py-2 text-xs font-black uppercase ${styles.btnDanger}`}>Finalizar</button></>
              )}
            </div>
            <p className="mt-3 text-[10px] opacity-70">Contratante fez Pix 1h antes (variável TEMPO_PAGAMENTO_ANTECEDENCIA_MINUTOS). Freela recebe ao finalizar. Código confirmação início/fim entre contratante e freela. EFI escrow.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
