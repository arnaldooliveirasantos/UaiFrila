import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const LandingPage: React.FC<{ onSelecionarAcao: (acao: 'LOGIN' | 'CADASTRO') => void }> = ({ onSelecionarAcao }) => {
    const { styles } = useTheme();
    return (
        <div className={`rounded-3xl p-8 border-2 ${styles.bgQuadros}`} style={styles.grid}>
            <h1 className="text-4xl font-black uppercase mb-2">Contrate freelas de bar em 2 minutos.</h1>
            <div className="flex gap-2 mt-4">
                <button onClick={() => onSelecionarAcao('CADASTRO')} className={`px-4 py-2 rounded text-xs ${styles.btnPrimary}`}>Começar Agora</button>
                <button onClick={() => onSelecionarAcao('LOGIN')} className="text-xs text-gray-400 underline">Fazer Login</button>
            </div>
        </div>
    );
};