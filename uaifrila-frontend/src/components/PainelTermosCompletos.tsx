import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { PainelEdicaoTermos } from './PainelEdicaoTermos';

interface ItemTermo { item_id: number; texto_item: string; ordem: number; versao: number; }

export const PainelTermosCompletos: React.FC<{ usuario: any }> = ({ usuario }) => {
    const { theme } = useTheme();
    const [perfilAtivo, setPerfilAtivo] = useState<number>(2);
    const [itens, setItens] = useState<ItemTermo[]>([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        if (!perfilAtivo || isNaN(perfilAtivo)) return;
        setCarregando(true);

        // 🌟 Leitura estrita e pura do arquivo .env do Vite, sem fallbacks hardcoded no código
        const API_BASE = import.meta.env.VITE_API_URL;

        fetch(`${API_BASE}/termos/vigente/${perfilAtivo}`)
            .then(res => res.json())
            .then(dados => { if (dados && Array.isArray(dados)) setItens(dados); else setItens([]); })
            .catch(err => console.error("Erro leitura de termos:", err))
            .finally(() => setCarregando(false));
    }, [perfilAtivo]);

    return (
        <div className="w-full flex flex-col gap-4">
            <div className={`w-full max-w-3xl mx-auto p-6 border-2 rounded-3xl font-sans transition-all duration-300 ${
                theme === 'dark' ? 'bg-[#000000] border-[#0066FF] text-white' : 'bg-[#FFFFFF] border-[#000000] text-black shadow-sm'
            }`}>
                <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
                    <h2 className="text-base font-black uppercase tracking-tight">📄 Termo de Aceite Regulatório</h2>
                    <span className="text-[9px] font-mono bg-fuchsia-600 text-white font-black px-2 py-0.5 rounded">
                        {usuario?.is_admin ? "MODO GERENCIAL" : "VISUALIZAÇÃO PÚBLICA"}
                    </span>
                </div>

                {/* Abas de Navegação Pública do Termo */}
                <div className="flex gap-2 mb-4 border-b border-gray-900 pb-3">
                    <button onClick={() => setPerfilAtivo(2)} className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition cursor-pointer ${perfilAtivo === 2 ? 'bg-[#0066FF] text-white' : 'bg-neutral-800 text-gray-400'}`}>Regras do Freelancer</button>
                    <button onClick={() => setPerfilAtivo(3)} className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition cursor-pointer ${perfilAtivo === 3 ? 'bg-[#FF00FF] text-white' : 'bg-neutral-800 text-gray-400'}`}>Regras do Estabelecimento</button>
                </div>

                {carregando ? <div className="text-xs text-gray-500 font-mono">Buscando cláusulas...</div> : 
                 itens.length === 0 ? <div className="text-xs text-gray-500">Nenhum sub-item ativo localizado.</div> : (
                    <div className="flex flex-col gap-3">
                        {itens.map((item, index) => (
                            <div key={item.item_id || index} className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${theme === 'dark' ? 'bg-[#080808] border-gray-900 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                <span className="font-black text-[#0066FF] font-mono">{index + 1}.</span>
                                <p>{item.texto_item}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {usuario?.is_admin && <PainelEdicaoTermos />}
        </div>
    );
};
