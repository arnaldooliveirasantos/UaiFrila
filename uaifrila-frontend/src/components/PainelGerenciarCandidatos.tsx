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

    useEffect(() => {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://192.168.24';
        fetch(`${API_BASE}/vagas/${vagaId}/candidatos`)
            .then(res => res.json())
            .then(dados => { if (Array.isArray(dados)) setCandidatos(dados); })
            .catch(err => console.error(err))
            .finally(() => setCarregando(false));
    }, [vagaId]);

    const aprovarFreela = (id: number) => {
        alert(`🏃 Profissional aprovado! Notificação enviada via barramento.`);
    };

    return (
        <div className={`w-full p-6 border-2 rounded-3xl ${styles.bgQuadros}`} style={styles.grid}>
            <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-6">
                <div>
                    <h3 className="text-lg font-black uppercase text-[#0066FF]">👥 Candidatos ao Turno</h3>
                    <p className="text-[10px] text-gray-500 font-mono">VAGA ID REQUISITANTE: #{vagaId}</p>
                </div>
                <button onClick={onVoltar} className="text-[10px] font-black uppercase px-3 py-1.5 border border-black bg-neutral-800 text-white rounded-lg cursor-pointer">✕ Fechar</button>
            </div>

            {carregando ? (
                <div className="text-xs font-mono text-gray-500">Avaliando scores de rede...</div>
            ) : candidatos.length === 0 ? (
                <div className="text-xs text-gray-500 font-bold p-4 text-center border-2 border-dashed border-gray-800 rounded-xl">Nenhum profissional se candidatou a este turno até o momento.</div>
            ) : (
                <div className="flex flex-col gap-4">
                    {candidatos.map((c) => {
                        const estaBloqueado = parseFloat(c.media) < 3.5;

                        return (
                            <div 
                                key={c.id} 
                                className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition ${
                                    estaBloqueado 
                                        ? 'bg-red-500/10 border-[#E53935]' 
                                        : (theme === 'dark' ? 'bg-[#050505] border-gray-900' : 'bg-gray-50 border-gray-200')
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <img src={c.foto} alt="Avatar" className="w-12 h-12 bg-black rounded-xl border border-gray-800" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-black text-sm uppercase">{c.nome}</h4>
                                            <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded ${
                                                estaBloqueado ? 'bg-[#E53935] text-white' : 'bg-[#FFC700] text-black'
                                            }`}>
                                                ⭐️ {c.media} ({c.trampos} Turnos)
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 font-bold mt-0.5">
                                            📍 Distância aproximada: <strong className={theme === 'dark' ? 'text-[#0066FF]' : 'text-black'}>{c.distancia}</strong>
                                        </p>
                                    </div>
                                </div>

                                <div className="w-full sm:w-auto flex items-center justify-end gap-2">
                                    {estaBloqueado ? (
                                        <span className="text-[9px] font-black uppercase tracking-wider text-[#E53935] bg-[#E53935]/20 px-3 py-2 rounded-xl border border-[#E53935]/40">
                                            🚫 CADASTRO SUSPENSO/BLOQUEADO
                                        </span>
                                    ) : (
                                        <>
                                            <a 
                                                href={`https://wa.me{c.whatsapp.replace(/\D/g, '')}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="px-3 py-2 bg-emerald-600 text-white font-black uppercase text-[10px] rounded-xl tracking-wider shadow-sm"
                                            >
                                                💬 WhatsApp
                                            </a>
                                            <button 
                                                onClick={() => aprovarFreela(c.id)}
                                                className={`px-3 py-2 text-[10px] rounded-xl cursor-pointer ${styles.btnPrimary}`}
                                            >
                                                ✔ Aprovar
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
