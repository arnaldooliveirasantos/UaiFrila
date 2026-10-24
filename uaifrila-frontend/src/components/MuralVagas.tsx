import React, { useEffect, useState } from 'react';

interface Vaga {
    id: number;
    funcao: string;
    data_hora: string;
    endereco_completo: string;
    valor_visivel?: number;
    total_cartao?: number;
    total_pix_desconto?: number;
    status: string;
}

export const MuralVagas: React.FC<{ tipoUsuario: 'FREELA' | 'CONTRATANTE' }> = ({ tipoUsuario }) => {
    const [vagas, setVagas] = useState<Vaga[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        const buscarMural = async () => {
            try {
                const token = localStorage.getItem('@UaiFrila:token');
                const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
                const resposta = await fetch(`${API_BASE}/vagas/mural`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ tipo: tipoUsuario })
                });
                const dados = await resposta.json();
                if (!resposta.ok) throw new Error(dados.erro || 'Falha ao carregar mural.');
                setVagas(dados);
            } catch (err: any) {
                setErro(err.message);
            } finally {
                setCarregando(false);
            }
        };
        buscarMural();
    }, [tipoUsuario]);

    const handleCandidatar = async (vagaId: number) => {
        try {
            const token = localStorage.getItem('@UaiFrila:token');
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            const resposta = await fetch(`${API_BASE}/vagas/candidatar`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ vagaId })
            });
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.erro || 'Falha ao registrar candidatura.');
            alert('🎉 Candidatura registrada com sucesso!');
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (carregando) return <div className="text-center text-sm p-8 text-gray-400">Carregando jobs disponíveis...</div>;
    if (erro) return <div className="text-center text-sm p-8 text-red-500">⚠️ {erro}</div>;
    if (vagas.length === 0) return <div className="text-center text-sm p-8 text-gray-500">Nenhum job disponível no momento.</div>;

    return (
        <div className="w-full flex flex-col gap-4">
            <h2 className="text-xl font-black uppercase text-yellow-400 tracking-tight">🏃 Mural de Vagas em Uberlândia</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vagas.map(vaga => {
                    const urlMapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vaga.endereco_completo + ' Uberlândia MG Brasil')}`;
                    return (
                        <div key={vaga.id} className="w-full rounded-xl p-5 bg-yellow-400 text-black shadow-lg flex flex-col justify-between gap-4">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-black text-xl uppercase tracking-wide">{vaga.funcao}</h3>
                                    <span className="bg-red-600 text-white text-[9px] px-2 py-0.5 rounded font-black uppercase">{vaga.status}</span>
                                </div>
                                <a href={urlMapa} target="_blank" rel="noopener noreferrer" className="text-blue-900 font-bold hover:underline cursor-pointer block text-xs mt-2">
                                    📍 {vaga.endereco_completo}
                                </a>
                                <p className="text-[11px] text-gray-700 mt-1">{vaga.data_hora}</p>
                            </div>
                            <div className="border-t border-black/20 pt-3 flex items-end justify-between">
                                {tipoUsuario === 'FREELA' ? (
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-700">Valor Líquido:</p>
                                        <p className="text-2xl font-black text-green-900">R$ {vaga.valor_visivel?.toFixed(2)}</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-700">A pagar (Cartão):</p>
                                        <p className="text-xl font-black text-red-950">R$ {vaga.total_cartao?.toFixed(2)}</p>
                                        <p className="text-[10px] text-emerald-900 font-bold">Pix: R$ {vaga.total_pix_desconto?.toFixed(2)}</p>
                                    </div>
                                )}
                                {tipoUsuario === 'FREELA' && (
                                    <button onClick={() => handleCandidatar(vaga.id)} className="bg-black text-white text-xs font-black uppercase px-3 py-2 rounded-lg hover:bg-neutral-800 transition cursor-pointer">
                                        Quero Trampar
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
