
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import LogoIcone from './LogoIcone';

export default function Navbar({ telaAtiva, setTelaAtiva, usuario, onLogout }: any) {
  const { toggleTheme } = useTheme();
  const styles = useUaiFrilaStyles();
  const [menuAberto, setMenuAberto] = useState(false);
  
  const getTipo = () => (usuario?.tipo_chave || usuario?.role || 'FREELA').toUpperCase();
  const getNivel = () => usuario?.nivel_permissao ?? 0;
  
  const isFreela = () => ['FREELA','DUAL'].includes(getTipo()) || getNivel() === 0;
  const isContratante = () => ['CONTRATANTE','DUAL'].includes(getTipo()) || getNivel() >= 10;
  const isAdmin = () => getNivel() >= 90 || ['ADMIN','SUPER_ADMIN'].includes(getTipo());
  const isSuperAdmin = () => getTipo() === 'SUPER_ADMIN' || getNivel() >= 100;

  // MENU FIXO - Todos botões redirecionando corretamente
  const menu = [
    { id: 'mural', label: 'Mural', auth: true, show: () => !!usuario },
    { id: 'perfil', label: 'Meu Perfil', auth: true, show: () => !!usuario },
    { id: 'publicar', label: 'Publicar Vaga', auth: true, show: () => !!usuario && (isContratante() || isAdmin() || isSuperAdmin()) },
    { id: 'trampos', label: 'Meus Trampos', auth: true, show: () => !!usuario },
    { id: 'transacoes', label: 'Transações', auth: true, show: () => !!usuario }, // Liberado para todos logados
    { id: 'expansao', label: 'Expansão', auth: true, show: () => !!usuario }, // Liberado para todos logados
    { id: 'cidades', label: 'Cidades', auth: true, show: () => !!usuario && isAdmin() },
    { id: 'variaveis', label: 'Variáveis', auth: true, show: () => !!usuario && isSuperAdmin() },
    { id: 'codigoFreela', label: 'Código Freela', public: true, show: () => true },
  ];

  const filtrado = menu.filter((m:any) => m.show());

  const handleNav = (id: string) => { 
    if (id === 'publicar') {
      localStorage.removeItem('uaifrila_vaga_editar');
    }
    console.log('[Navbar] Navegando para:', id);
    setTelaAtiva(id); 
    setMenuAberto(false); 
  };

  const getBadgeVariant = (): 'default' | 'success' | 'warning' | 'danger' => {
    const tipo = getTipo();
    if (tipo === 'SUPER_ADMIN') return 'default';
    if (tipo === 'ADMIN') return 'warning';
    if (tipo === 'FINANCEIRO') return 'success';
    if (tipo === 'DUAL') return 'warning';
    if (tipo === 'CONTRATANTE') return 'danger';
    return 'warning';
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b-2 ${styles.isDark ? 'bg-zinc-900/95 border-zinc-700' : 'bg-white/95 border-black'} ${styles.isDark ? 'shadow-[0_0_0_1px_rgba(255,255,255,0.1)]' : 'shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNav(usuario ? 'mural' : 'home')}>
          <LogoIcone size={44} />
          <span className={`font-black text-xl tracking-tighter hidden sm:block ${styles.isDark ? 'text-white' : 'text-black'}`}>UAI FRILA</span>
          {usuario && <span className={styles.badge(getBadgeVariant())}>{getTipo()}</span>}
        </div>

        <div className="hidden lg:flex items-center gap-1 flex-wrap max-w-[75%]">
          {filtrado.map((item:any) => {
            const ativo = telaAtiva === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => handleNav(item.id)} 
                className={ativo ? styles.buttonPrimary() + ' px-3 py-1 text-xs w-auto' : styles.buttonSecondary + ' text-xs px-3 py-1'}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className={styles.buttonSecondary + ' text-xs px-2 py-1'} title="Alternar tema">
            {styles.isDark ? '☾' : '☀'}
          </button>
          
          <div className="hidden md:flex items-center gap-2">
            {usuario ? (
              <>
                <span className={`text-xs font-bold max-w-[120px] truncate ${styles.isDark ? 'text-white' : 'text-black'}`}>{usuario.nome_completo || usuario.nome}</span>
                <button onClick={onLogout} className={styles.buttonDanger + ' text-xs'}>Sair</button>
              </>
            ) : (
              <>
                <button onClick={() => handleNav('login')} className={styles.buttonSecondary + ' text-xs'}>Login</button>
                <button onClick={() => handleNav('cadastro')} className={styles.buttonPrimary() + ' px-3 py-1 text-xs w-auto'}>Cadastro</button>
              </>
            )}
          </div>

          <button onClick={() => setMenuAberto(!menuAberto)} className="lg:hidden p-2 border-2 border-black bg-white text-black">☰</button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuAberto && (
        <div className={`lg:hidden border-t-2 p-4 space-y-2 ${styles.isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-black'}`}>
          {filtrado.map((item:any) => (
            <button key={item.id} onClick={() => handleNav(item.id)} className={`w-full text-left px-3 py-2 border-2 font-black text-xs uppercase ${telaAtiva===item.id ? 'bg-black text-white border-black' : styles.isDark ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-white text-black border-black'}`}>
              {item.label}
            </button>
          ))}
          {usuario ? (
            <button onClick={() => { onLogout(); setMenuAberto(false); }} className={styles.buttonDanger + ' w-full'}>Sair - {usuario.nome_completo || usuario.nome}</button>
          ) : (
            <>
              <button onClick={() => handleNav('login')} className={styles.buttonSecondary + ' w-full'}>Login</button>
              <button onClick={() => handleNav('cadastro')} className={styles.buttonPrimary() + ' w-full'}>Cadastro</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
