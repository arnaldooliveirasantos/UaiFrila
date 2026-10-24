import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface Candidato {
    id: number;
    nome: string;
    whatsapp: string;
    media: string;
    trampos: number;
    distancia: string;
    foto: string;
}

export const PainelGerenciarCandidatos: React.FC<{ vagaId: number; onVoltar: () => void }> = ({ vagaId, onVoltar }) => {
    const { theme, styles } = useTheme();
    const [candidatos, setCandidatos] = useState<Candidato[]>([]);
    const [carregando, setCarregando] = useState(true);
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    useEffect(() => {
        fetch(`${API_BASE}/vagas/${vagaId}/candidatos`)
            .then(res => res.json())
            .then(dados => { if (Array.isArray(dados)) setCandidatos(dados); })
            .catch(err => console.error(err))
            .finally(() => setCarregando(false));
    }, [vagaId, API_BASE]);

    const aprovarFreela = (id: number) => {
        alert(`🏃 Profissional aprovado!`);
    };

    return (
        <div className={`w-full p-6 border-2 rounded-3xl ${styles.bgQuadros}`} style={styles.grid}>
            <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-6">
                <div>
                    <h3 className="text-lg font-black uppercase text-[#0066FF]">👥 Candidatos ao Turno</h3>
                    <p className="text-[10px] text-gray-500 font-mono">VAGA ID: #{vagaId}</p>
                </div>
                <button onClick={onVoltar} className="text-[10px] font-black uppercase px-3 py-1.5 border bg-neutral-800 text-white rounded-lg">✕ Fechar</button>
            </div>
            {carregando ? <div className="text-xs text-gray-500">Carregando...</div> :
             candidatos.length === 0 ? <div className="text-xs text-gray-500 p-4 text-center border-2 border-dashed rounded-xl">Nenhum candidato.</div> :
             <div className="flex flex-col gap-4">
                {candidatos.map((c) => {
                    const bloqueado = parseFloat(c.media) < 3.5;
                    return (
                        <div key={c.id} className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row justify-between gap-4 ${bloqueado ? 'bg-red-500/10 border-[#E53935]' : (theme === 'dark' ? 'bg-[#050505] border-gray-900' : 'bg-gray-50 border-gray-200')}`}>
                            <div className="flex items-center gap-4">
                                <img src={c.foto} alt="Avatar" className="w-12 h-12 bg-black rounded-xl border" />
                                <div>
                                    <div className="flex items-center gap-2"><h4 className="font-black text-sm uppercase">{c.nome}</h4><span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${bloqueado ? 'bg-[#E53935] text-white' : 'bg-[#FFC700] text-black'}`}>⭐ {c.media}</span></div>
                                    <p className="text-[11px] text-gray-400">📍 {c.distancia}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="px-3 py-2 bg-emerald-600 text-white text-[10px] rounded-xl font-black">WhatsApp</a>
                                {!bloqueado && <button onClick={() => aprovarFreela(c.id)} className={`px-3 py-2 text-[10px] rounded-xl ${styles.btnPrimary}`}>Aprovar</button>}
                            </div>
                        </div>
                    );
                })}
             </div>
            }
        </div>
    );
};
