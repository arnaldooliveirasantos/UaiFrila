import React, { useState, useEffect } from 'react';

const API = (import.meta as any).env?.VITE_API_URL || 'http://192.168.24.11:3000/api';

function formatarDataLocal(utc: string): string {
  if (!utc) return '';
  try {
    const d = new Date(utc);
    return d.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch { return utc; }
}

export default function PainelMeusTrampos(props: any) {
  const setTelaAtiva = props.setTelaAtiva;
  const [aba, setAba] = useState<'publicadas' | 'mural'>('publicadas');
  const [vagas, setVagas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    try {
      const token = localStorage.getItem('uaifrila_token');
      if (aba === 'publicadas') {
        const res = await fetch(`${API}/vagas/minhas-publicadas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const lista = data.vagas || data || [];
        setVagas(lista);
      } else {
        const res = await fetch(`${API}/vagas/mural`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const lista = data.vagas || data.mural || data || [];
        setVagas(lista);
      }
    } catch (e: any) { 
      console.error(e); 
    } finally { 
      setCarregando(false); 
    }
  };

  useEffect(() => { carregar(); }, [aba]);

  const editar = (vaga: any) => {
    console.log('[PainelMeusTrampos] Editando vaga:', vaga.id);
    localStorage.setItem('uaifrila_vaga_editar', JSON.stringify(vaga));
    if (setTelaAtiva) {
      // Redireciona para tela de cadastro de vaga
      setTelaAtiva('publicar');
    } else {
      console.error('setTelaAtiva não definido');
    }
  };

  const cancelar = async (id: number) => {
    if (!confirm(`Cancelar vaga #${id}?`)) return;
    try {
      const token = localStorage.getItem('uaifrila_token');
      const res = await fetch(`${API}/vagas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Vaga cancelada!');
        carregar();
      }
    } catch (e: any) {
      alert('Erro ao cancelar: ' + e.message);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8">
      {/* HEADER LIMPO - sem timezone, sem UTC0, sem localidade */}
      <div className="bg-[#1a1a1a] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
        <h1 className="text-2xl font-black uppercase text-white">Meus Trampos</h1>
        
        <div className="flex gap-2 mt-4">
          <button 
            onClick={() => setAba('publicadas')} 
            className={`px-4 py-2 border-2 border-black text-xs font-black uppercase ${aba === 'publicadas' ? 'bg-[#FFC700] text-black' : 'bg-white text-black'}`}
          >
            Minhas Publicadas
          </button>
          <button 
            onClick={() => setAba('mural')} 
            className={`px-4 py-2 border-2 border-black text-xs font-black uppercase ${aba === 'mural' ? 'bg-[#FFC700] text-black' : 'bg-white text-black'}`}
          >
            Mural
          </button>
        </div>
      </div>

      {/* LISTA */}
      <div className="space-y-4">
        {carregando && <div className="bg-white border-4 border-black p-6 font-bold">Carregando...</div>}
        
        {!carregando && vagas.length === 0 && (
          <div className="bg-white border-4 border-black p-6 font-bold">Nenhuma vaga encontrada.</div>
        )}

        {!carregando && vagas.map((v: any) => (
          <div key={v.id} className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black uppercase">{v.funcao} - {v.titulo}</h3>
                <p className="text-xs mt-1 opacity-70">{v.descricao}</p>
                {/* DATA LIMPA - sem BRT, sem Local, sem UTC, sem timezone */}
                <p className="text-xs mt-2 font-bold">
                  📅 {formatarDataLocal(v.data_inicio)} → {formatarDataLocal(v.data_fim)}
                </p>
                <p className="text-[10px] mt-1">R$ {v.valor_hora} • {v.cidade_nome}</p>
              </div>
              <span className="text-[10px] bg-yellow-400 text-black px-2 py-1 font-black border-2 border-black">{v.status} #{v.id}</span>
            </div>
            
            {/* BOTÕES LIMPOS - sem timezone */}
            <div className="flex gap-2 mt-3">
              <button 
                onClick={() => editar(v)} 
                className="px-3 py-1 bg-black text-white border-2 border-black text-[10px] font-black uppercase"
              >
                ✎ EDITAR
              </button>
              <button 
                onClick={() => cancelar(v.id)} 
                className="px-3 py-1 bg-red-600 text-white border-2 border-black text-[10px] font-black uppercase"
              >
                ✕ CANCELAR
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
