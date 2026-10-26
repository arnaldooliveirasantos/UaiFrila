import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import LogoIcone from './LogoIcone';

export default function Navbar({ telaAtiva, setTelaAtiva, usuario, onLogout }: any) {
  const { toggleTheme, styles, isDark } = useTheme();
  const [menuAberto, setMenuAberto] = useState(false);
  
  const getTipo = () => (usuario?.tipo_chave || usuario?.role || 'FREELA').toUpperCase();
  const getNivel = () => usuario?.nivel_permissao ?? 0;
  
  const isFreela = () => ['FREELA','DUAL'].includes(getTipo()) || getNivel() === 0;
  const isContratante = () => ['CONTRATANTE','DUAL'].includes(getTipo()) || getNivel() >= 10;
  const isDual = () => getTipo() === 'DUAL' || getNivel() === 20;
  const isFinanceiro = () => getNivel() >= 50 || ['FINANCEIRO','ADMIN','SUPER_ADMIN'].includes(getTipo());
  const isSuporte = () => getNivel() >= 60 || ['SUPORTE','ADMIN','SUPER_ADMIN'].includes(getTipo());
  const isModerador = () => getNivel() >= 80 || ['MODERADOR','ADMIN','SUPER_ADMIN'].includes(getTipo());
  const isAdmin = () => getNivel() >= 90 || ['ADMIN','SUPER_ADMIN'].includes(getTipo());
  const isSuperAdmin = () => getTipo() === 'SUPER_ADMIN' || getNivel() >= 100;

  // Menu completo com restrição por tipo_usuario
  const menu = [
    { id: 'mural', label: 'Mural', auth: true, nivel: 0, tipos: ['FREELA','CONTRATANTE','DUAL','FINANCEIRO','SUPORTE','MODERADOR','ADMIN','SUPER_ADMIN'] },
    { id: 'perfil', label: 'Meu Perfil', auth: true, nivel: 0, tipos: ['FREELA','CONTRATANTE','DUAL','FINANCEIRO','SUPORTE','MODERADOR','ADMIN','SUPER_ADMIN'] },
    { id: 'trampos', label: 'Meus Trampos', auth: true, nivel: 0, tipos: ['FREELA','CONTRATANTE','DUAL','FINANCEIRO','SUPORTE','MODERADOR','ADMIN','SUPER_ADMIN'] },
    { id: 'publicar', label: 'Publicar Vaga', role: 'contratante', nivel: 10, tipos: ['CONTRATANTE','DUAL','ADMIN','SUPER_ADMIN'] },
    { id: 'candidatos', label: 'Candidatos', role: 'contratante', nivel: 10, tipos: ['CONTRATANTE','DUAL','ADMIN','SUPER_ADMIN'] },
    { id: 'transacoes', label: 'Transações', role: 'financeiro', nivel: 50, tipos: ['FINANCEIRO','ADMIN','SUPER_ADMIN'] },
    { id: 'cidades', label: 'Cidades', role: 'admin', nivel: 80, tipos: ['MODERADOR','ADMIN','SUPER_ADMIN'] },
    { id: 'expansao', label: 'Expansão', role: 'admin', nivel: 90, tipos: ['ADMIN','SUPER_ADMIN'] },
    { id: 'variaveis', label: 'Variáveis', role: 'super_admin', nivel: 100, tipos: ['SUPER_ADMIN'] },
    { id: 'codigo', label: 'Código Freela', public: true, nivel: 0, tipos: [] },
  ];

  const filtrado = menu.filter((m:any) => {
    if (m.public) return true;
    if (!usuario) return false;
    if (m.auth) return true;
    // Verifica por nivel_permissao E por tipo_chave
    if (getNivel() >= m.nivel) return true;
    if (m.tipos.includes(getTipo())) return true;
    // Compatibilidade com role antigo
    if (m.role === 'contratante' && (isContratante() || isAdmin() || isSuperAdmin())) return true;
    if (m.role === 'financeiro' && isFinanceiro()) return true;
    if (m.role === 'admin' && (isModerador() || isAdmin() || isSuperAdmin())) return true;
    if (m.role === 'super_admin' && isSuperAdmin()) return true;
    return false;
  });

  const handleNav = (id: string) => { setTelaAtiva(id); setMenuAberto(false); };

  const getBadgeColor = () => {
    const tipo = getTipo();
    if (tipo === 'SUPER_ADMIN') return 'bg-black text-white border-black';
    if (tipo === 'ADMIN') return 'bg-[#FFC700] text-black border-black';
    if (tipo === 'FINANCEIRO') return 'bg-green-600 text-white border-black';
    if (tipo === 'MODERADOR') return 'bg-purple-600 text-white border-black';
    if (tipo === 'SUPORTE') return 'bg-blue-600 text-white border-black';
    if (tipo === 'DUAL') return 'bg-gradient-to-r from-[#FFC700] to-[#E53935] text-black border-black';
    if (tipo === 'CONTRATANTE') return 'bg-[#E53935] text-white border-black';
    return 'bg-[#FFC700] text-black border-black';
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b-2 ${isDark ? 'border-[#0066FF]/50 bg-black/95' : 'border-black bg-white/95 shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNav(usuario ? 'mural' : 'home')}>
          <LogoIcone size={44} />
          <span className={`font-black text-xl tracking-tighter hidden sm:block ${isDark ? 'text-white' : 'text-black'}`}>UAI FRILA</span>
          {usuario && <span className={`ml-2 text-[9px] px-2 py-0.5 border-2 font-black uppercase ${getBadgeColor()}`}>{getTipo()}</span>}
        </div>

        <div className="hidden lg:flex items-center gap-1 flex-wrap max-w-[70%]">
          {filtrado.map((item:any) => {
            const ativo = telaAtiva === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => handleNav(item.id)} 
                className={`px-3 py-2 text-[11px] font-black uppercase tracking-wide border-2 transition-all ${
                  ativo 
                    ? isDark 
                      ? 'bg-[#0066FF] text-white border-[#0066FF]' 
                      : 'bg-black text-white border-black'
                    : isDark
                      ? 'bg-transparent text-white border-transparent hover:border-white hover:text-white'
                      : 'bg-white text-black border-black/20 hover:border-black hover:bg-gray-50 hover:text-black'
                }`}
                title={`Nivel ${item.nivel} - ${item.tipos.join(', ')}`}
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
                <span className={`text-xs font-bold max-w-[120px] truncate ${isDark ? 'text-white' : 'text-black'}`}>{usuario.nome_completo || usuario.nome}</span>
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
            <div className={`p-2 mb-2 text-[10px] font-black uppercase border ${isDark ? 'bg-zinc-900 text-white border-white/20' : 'bg-zinc-100 text-black border-black/20'}`}>
              Logado como: {getTipo()} (nível {getNivel()})
            </div>
            {filtrado.map((item:any) => {
              const ativo = telaAtiva === item.id;
              return (
                <button 
                  key={item.id} 
                  onClick={() => handleNav(item.id)} 
                  className={`w-full text-left px-4 py-3 text-sm font-black uppercase border-2 transition-colors flex justify-between items-center ${
                    ativo 
                      ? isDark ? 'bg-[#0066FF] text-white border-[#0066FF]' : 'bg-black text-white border-black'
                      : isDark ? 'bg-transparent text-white border-white/20 hover:border-white' : 'bg-white text-black border-black/20 hover:border-black hover:bg-gray-50'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-[8px] opacity-60">N{item.nivel}</span>
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
