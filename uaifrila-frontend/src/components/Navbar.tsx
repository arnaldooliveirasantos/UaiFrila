import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import LogoIcone from './LogoIcone';

export default function Navbar({ telaAtiva, setTelaAtiva, usuario, onLogout }: any) {
  const { toggleTheme, styles, isDark } = useTheme();
  const [menuAberto, setMenuAberto] = useState(false);
  
  const menu = [    { id: 'mural', label: 'Mural', auth: true },
    { id: 'perfil', label: 'Meu Perfil', auth: true },
    { id: 'publicar', label: 'Publicar', role: 'contratante' },
    { id: 'candidatos', label: 'Candidatos', role: 'contratante' },
    { id: 'trampos', label: 'Meus Trampos', auth: true },
    { id: 'cidades', label: 'Cidades', admin: true },
    { id: 'expansao', label: 'Expansão', admin: true },
    { id: 'transacoes', label: 'Transações', admin: true },
    { id: 'variaveis', label: 'Variáveis', admin: true },
    { id: 'codigo', label: 'Código Freela', public: true },
  ];

  const filtrado = menu.filter((m:any) => {
    if (m.admin && !usuario?.is_admin) return false;
    if (m.role === 'contratante' && !usuario?.is_contratante && !usuario?.is_admin) return false;
    if (m.auth && !usuario) return false;
    return true;
  });

  const handleNav = (id: string) => { setTelaAtiva(id); setMenuAberto(false); };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b-2 ${isDark ? 'border-[#0066FF]/50 bg-black/95' : 'border-black bg-white/95 shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNav(usuario ? 'mural' : 'home')}>
          <LogoIcone size={44} />
          <span className={`font-black text-xl tracking-tighter hidden sm:block ${isDark ? 'text-white' : 'text-black'}`}>UAI FRILA</span>
        </div>

        {/* Desktop menu - CORRIGIDO MODO CLARO */}
        <div className="hidden lg:flex items-center gap-1">
          {filtrado.map((item:any) => {
            const ativo = telaAtiva === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => handleNav(item.id)} 
                className={`px-3 py-2 text-xs font-black uppercase tracking-wide border-2 transition-all ${
                  ativo 
                    ? isDark 
                      ? 'bg-[#0066FF] text-white border-[#0066FF]' 
                      : 'bg-black text-white border-black'
                    : isDark
                      ? 'bg-transparent text-white border-transparent hover:border-white hover:text-white'
                      : 'bg-white text-black border-black/20 hover:border-black hover:bg-gray-50 hover:text-black'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme} 
            className={`w-10 h-10 border-2 flex items-center justify-center font-black text-xs transition-colors ${
              isDark 
                ? 'bg-[#0066FF] text-white border-[#0066FF]' 
                : 'bg-[#FFC700] text-black border-black'
            }`}
          >
            {isDark ? '☾' : '☀'}
          </button>
          
          <div className="hidden md:flex items-center gap-2">
            {usuario ? (
              <>
                <span className={`text-xs font-bold max-w-[120px] truncate ${isDark ? 'text-white' : 'text-black'}`}>{usuario.nome}</span>
                <button onClick={onLogout} className="px-3 py-2 bg-[#E53935] text-white border-2 border-black text-xs font-black uppercase hover:bg-red-600">Sair</button>
              </>
            ) : (
              <>
                <button onClick={() => handleNav('login')} className={`px-4 py-2 border-2 text-xs font-black uppercase transition-colors ${isDark ? 'bg-white text-black border-white hover:bg-gray-100' : 'bg-white text-black border-black hover:bg-gray-50'}`}>Login</button>
                <button onClick={() => handleNav('cadastro')} className={`px-4 py-2 text-xs font-black uppercase border-2 transition-colors ${isDark ? 'bg-[#0066FF] text-white border-[#0066FF] hover:bg-blue-600' : 'bg-[#E53935] text-white border-black hover:bg-red-600'}`}>Cadastro</button>
              </>
            )}
          </div>

          <button onClick={() => setMenuAberto(!menuAberto)} className={`lg:hidden w-10 h-10 border-2 flex flex-col items-center justify-center gap-1 transition-colors ${isDark ? 'bg-black border-white' : 'bg-white border-black'}`}>
            <span className={`block w-5 h-0.5 transition-all ${isDark ? 'bg-white' : 'bg-black'} ${menuAberto ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`block w-5 h-0.5 ${isDark ? 'bg-white' : 'bg-black'} ${menuAberto ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 transition-all ${isDark ? 'bg-white' : 'bg-black'} ${menuAberto ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>
      </div>

      {menuAberto && (
        <div className={`lg:hidden absolute top-[72px] left-0 right-0 border-b-2 max-h-[80vh] overflow-y-auto shadow-xl ${isDark ? 'bg-black border-[#0066FF]' : 'bg-white border-black'}`}>
          <div className="p-4 space-y-2">
            {filtrado.map((item:any) => {
              const ativo = telaAtiva === item.id;
              return (
                <button 
                  key={item.id} 
                  onClick={() => handleNav(item.id)} 
                  className={`w-full text-left px-4 py-3 text-sm font-black uppercase border-2 transition-colors ${
                    ativo 
                      ? isDark ? 'bg-[#0066FF] text-white border-[#0066FF]' : 'bg-black text-white border-black'
                      : isDark ? 'bg-transparent text-white border-white/20 hover:border-white' : 'bg-white text-black border-black/20 hover:border-black hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <div className={`border-t-2 mt-4 pt-4 space-y-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
              {usuario ? (
                <button onClick={() => { onLogout(); setMenuAberto(false); }} className="w-full px-4 py-3 bg-[#E53935] text-white border-2 border-black text-sm font-black uppercase">Sair</button>
              ) : (
                <>
                  <button onClick={() => handleNav('login')} className={`w-full px-4 py-3 border-2 text-sm font-black uppercase ${isDark ? 'bg-white text-black border-white' : 'bg-white text-black border-black'}`}>Login</button>
                  <button onClick={() => handleNav('cadastro')} className={`w-full px-4 py-3 text-sm font-black uppercase border-2 ${isDark ? 'bg-[#0066FF] text-white border-[#0066FF]' : 'bg-[#E53935] text-white border-black'}`}>Cadastro</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}