import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

interface ItemTermo { texto_item: string; ordem: number; }

export const PainelEdicaoTermos: React.FC = () => {
    const { theme } = useTheme();
    const [perfilId, setPerfilId] = useState<2 | 3>(2);
    const [itens, setItens] = useState<ItemTermo[]>([]);
    const [novoTexto, setNovoTexto] = useState('');
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const carregarTermoPorID = async () => {
        try {
            const res = await fetch(`${API_BASE}/termos/vigente/${perfilId}`);
            const dados = await res.json();
            if (dados && dados.length > 0) {
                setItens(dados);
            } else {
                setItens([]);
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => { carregarTermoPorID(); }, [perfilId]);

    const handleAdicionarItem = () => {
        if (!novoTexto.trim()) return;
        setItens([...itens, { texto_item: novoTexto, ordem: itens.length + 1 }]);
        setNovoTexto('');
    };

    const handlePublicarNovaVersao = async () => {
        if (itens.length === 0) return alert("O termo precisa ter itens.");
        const token = localStorage.getItem('@UaiFrila:token');
        try {
            const res = await fetch(`${API_BASE}/admin/termos/salvar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ tipo_usuario_id: perfilId, itens })
            });
            if (res.ok) {
                alert("✨ Nova versão publicada!");
                carregarTermoPorID();
            }
        } catch (err) { alert("Erro ao salvar."); }
    };

    return (
        <div className={`w-full max-w-3xl mx-auto p-5 border-2 rounded-3xl mt-4 ${theme === 'dark' ? 'bg-[#000000] border-[#0066FF]':'bg-white border-gray-200'}`}>
            <h3 className="text-sm font-black uppercase text-[#0066FF] mb-3">⚙️ Painel de Cláusulas</h3>
            <div className="flex gap-2 mb-4">
                <button onClick={() => setPerfilId(2)} className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg ${perfilId === 2 ? 'bg-[#0066FF] text-white':'bg-neutral-800 text-gray-400'}`}>Freela (ID #2)</button>
                <button onClick={() => setPerfilId(3)} className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg ${perfilId === 3 ? 'bg-[#FF00FF] text-white':'bg-neutral-800 text-gray-400'}`}>Contratante (ID #3)</button>
            </div>
            <div className="flex flex-col gap-2 mb-4">
                {itens.map((item, idx) => (
                    <div key={idx} className="p-3 bg-neutral-900 border border-gray-800 rounded-xl flex justify-between items-center text-xs text-white">
                        <p><strong className="text-[#0066FF]">{idx + 1}.</strong> {item.texto_item}</p>
                        <button onClick={() => setItens(itens.filter((_, i) => i !== idx))} className="text-red-500 font-bold ml-2">Remover</button>
                    </div>
                ))}
            </div>
            <textarea value={novoTexto} onChange={(e) => setNovoTexto(e.target.value)} placeholder="Nova cláusula..." rows={2} className="w-full bg-transparent border border-gray-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#0066FF]" />
            <div className="flex justify-between items-center mt-3">
                <button onClick={handleAdicionarItem} className="bg-neutral-800 text-white text-xs font-black px-4 py-1.5 rounded-lg">Adicionar</button>
                <button onClick={handlePublicarNovaVersao} className="bg-[#0066FF] text-white text-xs font-black px-4 py-1.5 rounded-lg">Publicar v12 →</button>
            </div>
        </div>
    );
};
