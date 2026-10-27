import React, { useEffect, useState } from 'react';
import { useTheme, getCardClass } from '../context/ThemeContext';
import { api } from '../services/api';

const getDeviceTimezone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'; } catch { return 'America/Sao_Paulo'; }
};
const formatarLocal = (utcStr: string | Date | null | undefined): string => {
  if (!utcStr) return '';
  try { const d = utcStr instanceof Date ? utcStr : new Date(String(utcStr)); if (isNaN(d.getTime())) return String(utcStr); return d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', timeZoneName:'short' }); } catch { return String(utcStr); }
};

export default function PainelMeusTrampos({ usuario, setTelaAtiva }: any) {
  const { isDark } = useTheme();
  const [vagas, setVagas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<'publicadas' | 'mural'>('publicadas');
  const [deviceTimezone] = useState(()=>getDeviceTimezone());

  useEffect(()=>{ carregar(); },[]);

  const carregar = async () => {
    setCarregando(true);
    try {
      if (aba === 'publicadas') {
        const res = await api.get('/vagas/minhas-publicadas');
        const lista = res.vagas || res || [];
        console.log(`[MeusTrampos UNIVERSAL] Device: ${deviceTimezone} | API UTC 0:`, lista[0]?.data_inicio, '-> Local:', formatarLocal(lista[0]?.data_inicio));
        setVagas(lista);
      } else {
        const res = await api.get('/vagas/mural');
        setVagas(res.vagas || res.mural || res || []);
      }
    } catch (e:any) { console.error(e); }
    finally { setCarregando(false); }
  };

  useEffect(()=>{ carregar(); },[aba]);

  const editar = (vaga:any) => {
    localStorage.setItem('uaifrila_vaga_editar', JSON.stringify(vaga));
    if (setTelaAtiva) setTelaAtiva('publicar');
  };

  const cancelar = async (id:number) => {
    if (!confirm('Cancelar vaga?')) return;
    try { await api.delete(`/vagas/${id}`); carregar(); } catch (e:any) { alert(e.message); }
  };

  const cardClass = getCardClass(isDark);

  return (
    <div className="min-h-screen w-full flex justify-center px-4 py-6"><div className="w-full max-w-4xl">
      <div className={cardClass}>
        <h1 className="text-2xl font-black uppercase">Meus Trampos - Universal {deviceTimezone}</h1>
        <p className="text-[11px] font-mono opacity-60 mt-2">Dispositivo: {deviceTimezone} • Banco: UTC 0 • Tela: Local {deviceTimezone} • Funciona em qualquer localidade</p>
        <div className="flex gap-2 mt-4">
          <button onClick={()=>setAba('publicadas')} className={`px-4 py-2 border-2 border-black text-xs font-black uppercase ${aba==='publicadas'?'bg-black text-white':'bg-white text-black'}`}>Minhas Publicadas</button>
          <button onClick={()=>setAba('mural')} className={`px-4 py-2 border-2 border-black text-xs font-black uppercase ${aba==='mural'?'bg-black text-white':'bg-white text-black'}`}>Mural</button>
        </div>
      </div>

      {carregando ? <div className="mt-6 p-4 bg-white border-2 border-black">Carregando...</div> :
        vagas.map((v:any)=>(
          <div key={v.id} className={`mt-4 p-4 border-2 border-black ${isDark?'bg-zinc-900 text-white':'bg-white text-black'}`}>
            <div className="flex justify-between">
              <span className="font-black uppercase">{v.funcao} - {v.titulo}</span>
              <span className="text-[10px] bg-yellow-400 text-black px-2 py-1 font-black">{v.status} #{v.id}</span>
            </div>
            <p className="text-xs mt-1 opacity-70">{v.descricao}</p>
            <p className="text-xs mt-2 font-bold">📅 {formatarLocal(v.data_inicio)} → {formatarLocal(v.data_fim)} (Local {deviceTimezone})</p>
            <p className="text-[10px] font-mono opacity-60">UTC 0: {v.data_inicio} → {v.data_fim} | {deviceTimezone}: {new Date(v.data_inicio).toLocaleString('pt-BR')} | Ex: BRT 15:00 = 18:00Z, NY 15:00 = 19:00Z</p>
            <p className="text-[10px] mt-1">R$ {v.valor_hora} • {v.cidade_nome}</p>
            <div className="flex gap-2 mt-3">
              <button onClick={()=>editar(v)} className="px-3 py-1 bg-black text-white border-2 border-black text-[10px] font-black uppercase">✎ EDITAR (UTC 0 → Local {deviceTimezone})</button>
              <button onClick={()=>cancelar(v.id)} className="px-3 py-1 bg-red-600 text-white border-2 border-black text-[10px] font-black uppercase">✕ CANCELAR</button>
            </div>
          </div>
        ))
      }
    </div></div>
  );
}
