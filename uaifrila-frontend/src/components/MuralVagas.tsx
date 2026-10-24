import React, { useEffect, useState } from 'react';
import { apiFetch } from '../services/api';

export const MuralVagas: React.FC<{ tipoUsuario: string }> = ({ tipoUsuario }) => {
    const [vagas, setVagas] = useState<any[]>([]);
    useEffect(() => {
        apiFetch('/vagas/mural', { method: 'POST', body: JSON.stringify({ tipo: tipoUsuario }) }).then(d => setVagas(d)).catch(() => {});
    }, [tipoUsuario]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vagas.map((v, i) => (
                <div key={i} className="p-4 bg-yellow-400 text-black rounded-xl">
                    <h4 className="font-black uppercase">{v.funcao}</h4>
                    <p className="text-xs">📍 {v.endereco_completo}</p>
                </div>
            ))}
        </div>
    );
};