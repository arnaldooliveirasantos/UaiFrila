import React, { useEffect, useState } from 'react';

export default function MuralVagas(props: any) {
  const API = (import.meta as any).env?.VITE_API_URL || 'http://192.168.24.11:3000/api';
  const [vagas, setVagas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      try {
        const token = localStorage.getItem('uaifrila_token');
        const res = await fetch(`${API}/vagas/mural`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        setVagas(data.vagas || data || []);
      } catch {} finally { setLoading(false); }
    };
    carregar();
  }, []);

  if (loading) return <div className="p-8 font-black">Carregando mural...</div>;

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-black uppercase mb-6">Mural de Vagas - valor_hora = Freela / Horas | endereço em enderecos_Vaga</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vagas.map((v: any) => {
          const inicio = v.data_inicio ? new Date(v.data_inicio).toLocaleString('pt-BR') : '';
          const fim = v.data_fim ? new Date(v.data_fim).toLocaleString('pt-BR') : '';
          const endereco = v.endereco_completo || `${v.cidade_nome || v.endereco_cidade || ''} - ${v.bairro || v.endereco_bairro || ''}`;
          return (
            <div key={v.id} className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-start">
                <h3 className="font-black text-lg">{v.titulo}</h3>
                <span className="bg-[#FFC700] border-2 border-black px-2 py-1 text-xs font-black">R$ {Number(v.valor_hora).toFixed(2).replace('.', ',')}/h</span>
              </div>
              <p className="text-xs opacity-70 mt-1">{v.funcao} | {v.contratante_nome || ''}</p>
              <p className="text-xs mt-2 line-clamp-3">{v.descricao}</p>
              <div className="mt-3 bg-yellow-100 border-2 border-black p-2 text-xs font-bold">
                <div>📍 {endereco}</div>
                <div>🕒 {inicio} → {fim}</div>
              </div>
              <div className="text-[10px] mt-2 opacity-50">vaga.id={v.id} | enderecos_Vaga.vaga_id FK | valor_hora só freela</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
