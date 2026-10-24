import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../services/api';

export const PainelTermosCompletos: React.FC<{ usuario: any }> = () => {
    const { styles } = useTheme();
    const [itens, setItens] = useState<any[]>([]);
    useEffect(() => {
        apiFetch('/termos/vigente/2').then(d => setItens(d)).catch(() => {});
    }, []);
    return (
        <div className={`p-6 border-2 rounded-3xl ${styles.bgQuadros}`}>
            <h3 className="text-sm font-black uppercase mb-3">📄 Cláusulas Legais</h3>
            {itens.map((item, idx) => <p key={idx} className="text-xs border-b border-gray-800 py-1">{item.texto_item}</p>)}
        </div>
    );
};