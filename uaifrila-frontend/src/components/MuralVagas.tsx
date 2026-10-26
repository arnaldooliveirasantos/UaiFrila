import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface Vaga { id:number; funcao:string; data_hora:string; endereco_completo:string; valor_visivel?:number; total_cartao?:number; total_pix_desconto?:number; status:string; contratante_id?:number; }

export default function MuralVagas({ tipoUsuario }: { tipoUsuario?: any }) {
  const { styles } = useTheme();
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const API = import.meta.env.VITE_API_URL ;

  useEffect(() => {
    const buscar = async () => {
      try {
        const token = localStorage.getItem('@UaiFrila:token');
        if (!token) { setErro('Faça login para ver mural'); setLoading(false); return; }
        const res = await fetch(`${API}/vagas/mural`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tipo: typeof tipoUsuario === 'string' ? tipoUsuario : 'FREELA' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);
        setVagas(data);
      } catch (e: any) { setErro(e.message); } finally { setLoading(false); }
    };
    buscar();
  }, [tipoUsuario]);

  const candidatar = async (vagaId: number) => {
    try {
      const token = localStorage.getItem('@UaiFrila:token');
      const res = await fetch(`${API}/vagas/candidatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vagaId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      alert('Candidatura registrada!');
    } catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className="p-8 text-center">Carregando vagas da API...</div>;
  if (erro) return <div className="p-8 text-center text-[#E53935] font-bold">{erro}</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-black uppercase">Mural de Vagas - Sem Mock, só API</h2>
      <p className="text-xs mt-1 opacity-70">Freela vê valor líquido sem taxa. Contratante vê total cartão (14%) e Pix desconto (10%). Endereço clicável azul #0066FF abre Google Maps</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {vagas.map(vaga => {
          const urlMapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vaga.endereco_completo + ' Uberlândia MG Brasil')}`;
          const isFreela = typeof tipoUsuario === 'string' ? tipoUsuario === 'FREELA' : true;
          return (
            <div key={vaga.id} className={`p-5 ${isFreela ? 'bg-[#FFC700] text-black' : 'bg-white text-black'} border-2 border-black`}>
              <div className="flex justify-between">
                <h3 className="font-black uppercase">{vaga.funcao}</h3>
                <span className="bg-[#E53935] text-white text-[9px] px-2 py-0.5 font-black">{vaga.status}</span>
              </div>
              <a href={urlMapa} target="_blank" rel="noopener noreferrer" className="text-[#0066FF] font-bold hover:underline cursor-pointer block text-xs mt-2">📍 {vaga.endereco_completo} <span className="ml-2">🗺 Ver no mapa</span></a>
              <p className="text-[10px] mt-1 font-bold">{vaga.data_hora}</p>
              <div className="mt-3 border-t border-black/20 pt-3 flex justify-between items-end">
                <div>
                  {isFreela ? (
                    <>
                      <p className="text-[10px] uppercase font-bold">Valor Líquido (sem taxa):</p>
                      <p className="text-2xl font-black">R$ {vaga.valor_visivel?.toFixed(2)}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] uppercase font-bold">Total Cartão (14%): R$ {vaga.total_cartao?.toFixed(2)}</p>
                      <p className="text-lg font-black text-green-700">Pix Desconto (10%): R$ {vaga.total_pix_desconto?.toFixed(2)}</p>
                    </>
                  )}
                </div>
                <button onClick={() => candidatar(vaga.id)} className="bg-black text-white text-xs font-black uppercase px-3 py-2">Quero Trampar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
