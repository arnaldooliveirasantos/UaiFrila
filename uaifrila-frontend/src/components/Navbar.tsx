import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { LogoIcone } from './LogoIcone';

interface NavbarProps {
    telaAtiva: string;
    onNavegar: (tela: string) => void;
    usuario: any;
    onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ telaAtiva, onNavegar, usuario, onLogout }) => {
    const { toggleTheme, theme } = useTheme();
    const [menuAberto, setMenuAberto] = useState(false);

    return (
        <nav className={`fixed top-0 left-0 w-full border-b text-white z-50 font-sans shadow-2xl transition-colors duration-300 ${
            theme === 'dark' ? 'bg-[#000000] border-[#0066FF]' : 'bg-[#FFFFFF] border-[#000000] !text-black'
        }`}>
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavegar('HOME')}>
                    <LogoIcone className="w-10 h-10 border border-gray-800 rounded-xl" />
                    <span className={`text-[10px] font-mono tracking-widest uppercase font-black ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        v12.1 • LIVE
                    </span>
                </div>

                <div className="hidden lg:flex items-center gap-2">
                    <button onClick={() => { onNavegar('HOME'); setMenuAberto(false); }} className={`text-xs font-black uppercase px-3 py-1.5 rounded-lg border-2 transition cursor-pointer ${telaAtiva === 'HOME' ? (theme === 'dark' ? 'bg-gradient-to-r from-[#FF00FF] to-[#0066FF] border-transparent text-white' : 'bg-[#E53935] border-black text-white') : (theme === 'dark' ? 'text-white border-transparent' : 'text-black border-transparent')}`}>Home</button>
                    <button onClick={() => { onNavegar('CADASTRO_UNIFICADO'); setMenuAberto(false); }} className={`text-xs font-black uppercase px-2 py-1.5 border-b-2 cursor-pointer ${telaAtiva === 'CADASTRO_UNIFICADO' ? (theme === 'dark' ? 'border-[#0066FF] text-white' : 'border-[#E53935] text-black') : 'border-transparent text-gray-400'}`}>📋 Cadastro</button>
                    <button onClick={() => { onNavegar('MURAL'); setMenuAberto(false); }} className={`text-xs font-black uppercase px-2 py-1.5 border-b-2 cursor-pointer ${telaAtiva === 'MURAL' ? (theme === 'dark' ? 'border-[#0066FF] text-white' : 'border-[#E53935] text-black') : 'border-transparent text-gray-400'}`}>📱 Mural</button>
                    <button onClick={() => { onNavegar('TRAMPOS'); setMenuAberto(false); }} className={`text-xs font-black uppercase px-2 py-1.5 border-b-2 cursor-pointer ${telaAtiva === 'TRAMPOS' ? (theme === 'dark' ? 'border-[#0066FF] text-white' : 'border-[#E53935] text-black') : 'border-transparent text-gray-400'}`}>⏱️ Trampos</button>
                    {usuario?.is_admin && (
                        <button onClick={() => { onNavegar('ADMIN'); setMenuAberto(false); }} className="text-xs font-black uppercase px-2 py-1.5 border-b-2 border-transparent text-amber-400">👑 Admin</button>
                    )}
                    <button onClick={() => { onNavegar('TERMOS_COMPLETOS'); setMenuAberto(false); }} className={`text-xs font-black uppercase px-2 py-1.5 border-b-2 cursor-pointer ${telaAtiva === 'TERMOS_COMPLETOS' ? (theme === 'dark' ? 'border-[#0066FF] text-white' : 'border-[#E53935] text-black') : 'border-transparent text-gray-400'}`}>📄 Termos</button>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={toggleTheme} className={`text-[10px] border-2 px-2 py-1 rounded font-black uppercase transition cursor-pointer ${theme === 'dark' ? 'bg-neutral-900 border-[#0066FF] text-white' : 'bg-[#FFC700] border-black text-black'}`}>
                        {theme === 'dark' ? '☀️ Claro' : '🌙 Escuro'}
                    </button>
                    {usuario && (
                        <button onClick={onLogout} className="hidden lg:block text-[10px] font-black uppercase px-2 py-1 rounded bg-red-600 text-white">Sair</button>
                    )}
                    <button onClick={() => setMenuAberto(!menuAberto)} className={`lg:hidden focus:outline-none p-1 text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        {menuAberto ? '✕' : '☰'}
                    </button>
                </div>
            </div>

            {menuAberto && (
                <div className={`lg:hidden border-t px-4 py-3 flex flex-col gap-2 font-black text-xs uppercase tracking-wide ${theme === 'dark' ? 'bg-black border-gray-900 text-white' : 'bg-white border-black text-black'}`}>
                    <button onClick={() => { onNavegar('HOME'); setMenuAberto(false); }} className="text-left py-2 border-b border-gray-100/10">🏠 Home Page</button>
                    <button onClick={() => { onNavegar('CADASTRO_UNIFICADO'); setMenuAberto(false); }} className="text-left py-2 border-b border-gray-100/10">📋 Cadastro</button>
                    <button onClick={() => { onNavegar('MURAL'); setMenuAberto(false); }} className="text-left py-2 border-b border-gray-100/10">📱 Mural</button>
                    <button onClick={() => { onNavegar('TRAMPOS'); setMenuAberto(false); }} className="text-left py-2 border-b border-gray-100/10">⏱️ Meus Trampos</button>
                    <button onClick={() => { onNavegar('TERMOS_COMPLETOS'); setMenuAberto(false); }} className="text-left py-2">📄 Termos</button>
                    {usuario && <button onClick={() => { onLogout?.(); setMenuAberto(false); }} className="text-left py-2 text-red-500">🚪 Sair</button>}
                </div>
            )}
        </nav>
    );
};
