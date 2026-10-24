import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../services/api';

export const PainelPublicarVaga: React.FC = () => {
    const { styles } = useTheme();
    const [endereco, setEndereco] = useState('');

    const handlePublicar = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiFetch('/vagas/criar', { method: 'POST', body: JSON.stringify({ funcao: 'Garçom', enderecoCompleto: endereco, horasEstimadas: 5, valorHoraLimpo: 20 }) });
            alert('🎉 Turno publicado!'); setEndereco('');
        } catch {}
    };

    return (
        <form onSubmit={handlePublicar} className={`p-6 border-2 rounded-3xl ${styles.bgQuadros}`}>
            <h3 className="text-xs font-black uppercase mb-3">🚀 Publicar Plantão</h3>
            <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Endereço do Estabelecimento" className={`w-full p-2 text-xs mb-2 ${styles.input}`} required />
            <button type="submit" className={`w-full py-2 rounded text-xs ${styles.btnPrimary}`}>Lançar Vaga</button>
        </form>
    );
};