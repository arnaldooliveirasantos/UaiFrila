import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface MesaProps {
    vagaId: number;
    avaliadoId: number;
    nomeAlvo: string;
    papelAlvo: 'FREELA' | 'BAR';
    onConcluido: () => void;
}

export const PainelMesaAvaliacao: React.FC<MesaProps> = ({ vagaId, avaliadoId, nomeAlvo, papelAlvo, onConcluido }) => {
    const { theme, styles } = useTheme();
    const [nota, setNota] = useState<number>(5);
    const [comentario, setComentario] = useState('');
    const [enviando, setEnviando] = useState(false);

    const enviarAvaliacao = async (e: React.FormEvent) => {
        e.preventDefault();
        setEnviando(true);
        
        const token = localStorage.getItem('@UaiFrila:token');
        const usuarioLogado = JSON.parse(localStorage.getItem('@UaiFrila:usuario') || '{}');
        const API_BASE = import.meta.env.VITE_API_URL || 'http://192.168.24';

        try {
            const res = await fetch(`${API_BASE}/avaliacoes/disparar`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    avaliadorId: usuarioLogado.id,
                    avaliadoId,
                    vagaId,
                    nota,
                    comentario
                })
            });

            if (!res.ok) throw new Error('Falha ao registrar nota.');
            alert('⭐️ Avaliação publicada! O ecossistema UAI FRILA agradece o seu feedback.');
            onConcluido();
        } catch (err) {
            alert('❌ Erro de rede ao transmitir pontuação.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className={`w-full max-w-md mx-auto p-6 border-2 rounded-3xl ${styles.bgQuadros}`} style={styles.grid}>
            <div className="border-b border-gray-800 pb-3 mb-4">
                <span className="text-[9px] font-mono font-black uppercase bg-[#FFC700] text-black px-2 py-0.5 rounded">
                    Fechamento de Turno
                </span>
                <h3 className="text-base font-black uppercase mt-1 tracking-tight">
                    ⭐️ Avaliar {papelAlvo === 'FREELA' ? 'Freelancer' : 'Estabelecimento'}
                </h3>
                <p className="text-xs text-gray-400 font-bold mt-0.5">Profissional: {nomeAlvo}</p>
            </div>

            <form onSubmit={enviarAvaliacao} className="flex flex-col gap-4">
                <div>
                    <label className="text-[10px] uppercase font-black tracking-wider text-gray-400 block mb-2">
                        Selecione a Nota Reputacional
                    </label>
                    <div className="flex gap-2 justify-center py-2 bg-neutral-900/20 border border-gray-800 rounded-xl">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => setNota(num)}
                                className={`w-10 h-10 rounded-lg text-xs font-black uppercase transition border-2 ${
                                    nota >= num 
                                        ? 'bg-[#FFC700] text-black border-black' 
                                        : 'bg-black text-gray-600 border-gray-900'
                                }`}
                            >
                                {num} ★
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-[10px] uppercase font-black tracking-wider text-gray-400 block mb-1">
                        Depoimento Crítico / Comentários
                    </label>
                    <textarea
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        placeholder="Como foi a postura, pontualidade e entrega técnica durante o plantão?"
                        rows={3}
                        className={`w-full rounded-lg p-2.5 text-xs outline-none resize-none ${styles.input}`}
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={enviando}
                    className={`w-full py-3 rounded-xl font-black uppercase text-xs tracking-wider transition ${styles.btnPrimary}`}
                >
                    {enviando ? 'Emitindo Protocolo...' : 'Disparar Nota de Auditoria'}
                </button>
            </form>
        </div>
    );
};
