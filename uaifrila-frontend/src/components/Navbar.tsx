import React from 'react';
import { useTheme } from '../context/ThemeContext';
import LogoIcone from './LogoIcone';

interface NavbarProps {
  telaAtiva: string;
  setTelaAtiva: (tela: string) => void;
  usuario: any;
  onLogout: () => void;
}

export default function Navbar({ telaAtiva, setTelaAtiva, usuario, onLogout }: NavbarProps) {
  const { theme, toggleTheme, styles, isDark } = useTheme();

  const menu = [
    { id: 'home', label: 'Home', public: true },
    { id: 'mural', label: 'Mural', auth: true },
    { id: 'publicar', label: 'Publicar', role: 'contratante' },
    { id: 'candidatos', label: 'Candidatos', role: 'contratante' },
    { id: 'trampos', label: 'Meus Trampos', auth: true },
    { id: 'cidades', label: 'Cidades', admin: true },
    { id: 'expansao', label: 'Expansão', admin: true },
    { id: 'transacoes', label: 'Transações', admin: true },
    { id: 'variaveis', label: 'Variáveis', admin: true },
    { id: 'codigo', label: 'Código Freela', public: true },
  ];

  const filtrado = menu.filter(m => {
    if (m.admin && !usuario?.is_admin) return false;
    if (m.role === 'contratante' && !usuario?.is_contratante && !usuario?.is_admin) return false;
    if (m.auth && !usuario) return false;
    return true;
  });

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b-2 border-black dark:border-[#0066FF]/50 bg-white/90 dark:bg-black/90">
      <div className="max-w-7xl mx-auto px-4 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setTelaAtiva('home')}>
          <LogoIcone size={36} />
          <span className="font-black text-xl tracking-tighter">UAI FRILA</span>
        </div>

        <div className="hidden lg:flex items-center gap-1">
          {filtrado.map(item => (
            <button
              key={item.id}
              onClick={() => setTelaAtiva(item.id)}
              className={`px-3 py-2 text-xs font-black uppercase tracking-wide border-2 transition-all ${telaAtiva === item.id ? 'bg-black text-white border-black dark:bg-[#0066FF] dark:border-[#0066FF]' : 'bg-transparent border-transparent hover:border-black dark:hover:border-white'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className={`w-10 h-10 border-2 border-black dark:border-[#0066FF] flex items-center justify-center font-black text-xs ${isDark ? 'bg-[#0066FF] text-white' : 'bg-[#FFC700] text-black'}`}>
            {isDark ? '☾' : '☀'}
          </button>
          {usuario ? (
            <>
              <span className="hidden md:block text-xs font-bold max-w-[120px] truncate">{usuario.nome}</span>
              <button onClick={onLogout} className="px-3 py-2 bg-[#E53935] text-white border-2 border-black text-xs font-black uppercase">Sair</button>
            </>
          ) : (
            <>
              <button onClick={() => setTelaAtiva('login')} className={`px-4 py-2 border-2 border-black text-xs font-black uppercase ${styles.btnYellow}`}>Login</button>
              <button onClick={() => setTelaAtiva('cadastro')} className={`px-4 py-2 text-xs font-black uppercase ${styles.btnPrimary}`}>Cadastro</button>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <div className="lg:hidden border-t-2 border-black dark:border-[#0066FF]/30 bg-white dark:bg-black px-2 py-2 flex gap-1 overflow-x-auto">
        {filtrado.map(item => (
          <button key={item.id} onClick={() => setTelaAtiva(item.id)} className={`whitespace-nowrap px-3 py-2 text-[10px] font-black uppercase border-2 ${telaAtiva === item.id ? 'bg-black text-white' : 'bg-transparent border-black/20'}`}>
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
