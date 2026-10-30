
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import LogoIcone from './LogoIcone';
import { useTiposUsuario } from './useTiposUsuario';

export default function Navbar({ telaAtiva, setTelaAtiva, usuario, onLogout }: any) {
  const { toggleTheme } = useTheme();
  const styles = useUaiFrilaStyles();
  const [menuAberto, setMenuAberto] = useState(false);
  const { getTipoUsuario, getBadgeVariant: getBadgeFromHook } = useTiposUsuario();
  
  const tipoUsuario = getTipoUsuario(usuario);
  const getTipo = () => tipoUsuario?.chave?.toUpperCase() || (usuario?.tipo_chave || usuario?.role || 'FREELA').toUpperCase();
  const getNomeExibicao = () => tipoUsuario?.nome_exibicao || getTipo();
  const getNivel = () => tipoUsuario?.nivel_permissao ?? usuario?.nivel_permissao ?? 0;
  const getDescricao = () => tipoUsuario?.descricao || '';
  
  const isFreela = () => {
    const chave = getTipo();
    return ['FREELA','DUAL'].includes(chave) || getNivel() === 0;
  };
  const isContratante = () => {
    const chave = getTipo();
    return ['CONTRATANTE','DUAL'].includes(chave) || getNivel() >= 10;
  };
  const isAdmin = () => getNivel() >= 90 || ['ADMIN','SUPER_ADMIN'].includes(getTipo());
  const isSuperAdmin = () => getTipo() === 'SUPER_ADMIN' || getNivel() >= 100;

  const menu = [
    { id: 'mural', label: 'Mural', auth: true, show: () => !!usuario },
    { id: 'perfil', label: 'Meu Perfil', auth: true, show: () => !!usuario },
    { id: 'publicar', label: 'Publicar Vaga', auth: true, show: () => !!usuario && (isContratante() || isAdmin() || isSuperAdmin()) },
    { id: 'trampos', label: 'Meus Trampos', auth: true, show: () => !!usuario },
    { id: 'transacoes', label: 'Transações', auth: true, show: () => !!usuario },
    { id: 'expansao', label: 'Expansão', auth: true, show: () => !!usuario },
    { id: 'cidades', label: 'Cidades', auth: true, show: () => !!usuario && isAdmin() },
    { id: 'variaveis', label: 'Variáveis', auth: true, show: () => !!usuario && isSuperAdmin() },
    { id: 'codigoFreela', label: 'Código Freela', public: true, show: () => true },
  ];

  const filtrado = menu.filter((m:any) => m.show());

  const handleNav = (id: string) => { 
    if (id === 'publicar') localStorage.removeItem('uaifrila_vaga_editar');
    setTelaAtiva(id); 
    setMenuAberto(false); 
  };

  const badgeVariant = getBadgeFromHook(usuario);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b-2 ${styles.isDark ? 'bg-zinc-900/95 border-zinc-700' : 'bg-white/95 border-black'}`}>
      <div className="max-w-7xl mx-auto px-4 h-[56px] flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNav(usuario ? 'mural' : 'home')}>
          <LogoIcone size={32} />
          <span className={`font-black text-lg tracking-tighter hidden sm:block ${styles.isDark ? 'text-white' : 'text-black'}`}>UAI FRILA</span>
          {usuario && (
            <span className={`${styles.badge(badgeVariant)} text-[10px] px-2 py-0.5`}>
              {getTipo()}
            </span>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-1">
          {filtrado.map((item:any) => {
            const ativo = telaAtiva === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => handleNav(item.id)} 
                className={`text-[11px] font-bold uppercase px-2.5 py-1 border-2 transition-all ${ativo ? 'bg-black text-white border-black' : styles.isDark ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:border-white' : 'bg-white text-black border-black hover:bg-black hover:text-white'}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={toggleTheme} className={`text-[11px] px-2 py-1 border-2 ${styles.isDark ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-white text-black border-black'}`}>
            {styles.isDark ? '☾' : '☀'}
          </button>
          <div className="hidden md:flex items-center gap-2">
            {usuario ? (
              <>
                <span className={`text-[11px] font-bold max-w-[100px] truncate ${styles.isDark ? 'text-white' : 'text-black'}`}>{usuario.nome_completo || usuario.nome}</span>
                <button onClick={onLogout} className={`text-[11px] font-black uppercase px-2 py-1 bg-red-600 text-white border-2 border-black hover:bg-red-700`}>Sair</button>
              </>
            ) : (
              <>
                <button onClick={() => handleNav('login')} className={`text-[11px] font-bold uppercase px-2.5 py-1 border-2 ${styles.isDark ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-white text-black border-black'}`}>Login</button>
                <button onClick={() => handleNav('cadastro')} className={`text-[11px] font-black uppercase px-3 py-1 bg-black text-white border-2 border-black`}>Cadastro</button>
              </>
            )}
          </div>
          <button onClick={() => setMenuAberto(!menuAberto)} className={`lg:hidden p-1.5 border-2 text-[14px] ${styles.isDark ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-white text-black border-black'}`}>☰</button>
        </div>
      </div>

      {menuAberto && (
        <div className={`lg:hidden border-t-2 p-3 space-y-1.5 ${styles.isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-black'}`}>
          {filtrado.map((item:any) => (
            <button key={item.id} onClick={() => handleNav(item.id)} className={`w-full text-left px-3 py-2 border-2 font-black text-[11px] uppercase ${telaAtiva===item.id ? 'bg-black text-white border-black' : styles.isDark ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-white text-black border-black'}`}>
              {item.label}
            </button>
          ))}
          {usuario ? (
            <button onClick={() => { onLogout(); setMenuAberto(false); }} className={`w-full text-left px-3 py-2 bg-red-600 text-white border-2 border-black font-black text-[11px] uppercase`}>Sair - {usuario.nome_completo || usuario.nome} - {getTipo()}</button>
          ) : (
            <>
              <button onClick={() => handleNav('login')} className={`w-full text-left px-3 py-2 border-2 font-black text-[11px] uppercase ${styles.isDark ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-white text-black border-black'}`}>Login</button>
              <button onClick={() => handleNav('cadastro')} className={`w-full text-left px-3 py-2 bg-black text-white border-2 border-black font-black text-[11px] uppercase`}>Cadastro</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
