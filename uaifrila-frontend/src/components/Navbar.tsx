import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { LogoIcone } from './LogoIcone';

export const Navbar: React.FC<{ telaAtiva: string, onNavegar: (t: string) => void, usuario: any, onLogout: () => void }> = ({ telaAtiva, onNavegar, usuario, onLogout }) => {
    const { toggleTheme, theme } = useTheme();
    return (
        <nav className={`fixed top-0 left-0 w-full border-b h-16 px-4 flex items-center justify-between z-50 transition-colors duration-300 ${theme==='dark'?'bg-black border-[#0066FF] text-white':'bg-white border-black text-black'}`}>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavegar('HOME')}>
                {/* Ajustado explicitamente para w-6 h-6 para corrigir a distorção visual */}
                <LogoIcone className="w-6 h-6 rounded-md" /> 
                <span className="text-xs font-mono font-black tracking-wider">UAI FRILA</span>
            </div>
            <div className="flex gap-4 text-xs font-black uppercase items-center">
                <button onClick={() => onNavegar('HOME')} className={`transition hover:text-blue-500 cursor-pointer ${telaAtiva==='HOME'?'text-blue-500':''}`}>Home</button>
                <button onClick={() => onNavegar('MURAL')} className={`transition hover:text-blue-500 cursor-pointer ${telaAtiva==='MURAL'?'text-blue-500':''}`}>Mural</button>
                {usuario && <button onClick={onLogout} className="bg-red-600 px-2 py-1 rounded text-white font-bold text-[11px] cursor-pointer hover:bg-red-700 transition">Sair</button>}
                <button onClick={toggleTheme} className="ml-1 font-mono text-sm cursor-pointer p-1 rounded hover:bg-neutral-800/10 transition">{theme==='dark'?'☀️':'🌙'}</button>
            </div>
        </nav>
    );
};