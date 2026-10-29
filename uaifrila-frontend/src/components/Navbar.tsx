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
  const isDual = () => getTipo() === 'DUAL' || getNivel() === 20;
  const isFinanceiro = () => getNivel() >= 50 || ['FINANCEIRO','ADMIN','SUPER_ADMIN'].includes(getTipo());
  const isSuporte = () => getNivel() >= 60 || ['SUPORTE','ADMIN','SUPER_ADMIN'].includes(getTipo());
  const isModerador = () => getNivel() >= 80 || ['MODERADOR','ADMIN','SUPER_ADMIN'].includes(getTipo());
  const isAdmin = () => getNivel() >= 90 || ['ADMIN','SUPER_ADMIN'].includes(getTipo());
  const isSuperAdmin = () => getTipo() === 'SUPER_ADMIN' || getNivel() >= 100;

  const menu = [
    { id: 'mural', label: 'Mural', auth: true, nivel: 0, tipos: ['FREELA','CONTRATANTE','DUAL','FINANCEIRO','SUPORTE','MODERADOR','ADMIN','SUPER_ADMIN'] },
    { id: 'perfil', label: 'Meu Perfil', auth: true, nivel: 0, tipos: ['FREELA','CONTRATANTE','DUAL','FINANCEIRO','SUPORTE','MODERADOR','ADMIN','SUPER_ADMIN'] },
    { id: 'trampos', label: 'Meus Trampos', auth: true, nivel: 0, tipos: ['FREELA','CONTRATANTE','DUAL','FINANCEIRO','SUPORTE','MODERADOR','ADMIN','SUPER_ADMIN'] },
    { id: 'publicar', label: 'Publicar Vaga',auth: true,role: 'contratante', nivel: 10, tipos: ['CONTRATANTE','DUAL','ADMIN','SUPER_ADMIN'] },
    { id: 'candidatos', label: 'Candidatos',auth: true, role: 'contratante', nivel: 10, tipos: ['CONTRATANTE','DUAL','ADMIN','SUPER_ADMIN'] },
    { id: 'transacoes', label: 'Transações',auth: true, role: 'financeiro', nivel: 50, tipos: ['FINANCEIRO','ADMIN','SUPER_ADMIN'] },
    { id: 'cidades', label: 'Cidades',auth: true, role: 'admin', nivel: 80, tipos: ['MODERADOR','ADMIN','SUPER_ADMIN'] },
    { id: 'expansao', label: 'Expansão',auth: true, role: 'admin', nivel: 90, tipos: ['ADMIN','SUPER_ADMIN'] },
    { id: 'variaveis', label: 'Variáveis',auth: true, role: 'super_admin', nivel: 100, tipos: ['SUPER_ADMIN'] },
    { id: 'codigo', label: 'Código Freela', public: true, nivel: 0, tipos: [] },
  ];

  const filtrado = menu.filter((m:any) => {
    if (m.public) return true;
    if (!usuario) return false;
    if (m.auth) return true;
    if (getNivel() >= m.nivel) return true;
    if (m.tipos.includes(getTipo())) return true;
    if (m.role === 'contratante' && (isContratante() || isAdmin() || isSuperAdmin())) return true;
    if (m.role === 'financeiro' && isFinanceiro()) return true;
    if (m.role === 'admin' && (isModerador() || isAdmin() || isSuperAdmin())) return true;
    if (m.role === 'super_admin' && isSuperAdmin()) return true;
    return false;
  });

  const handleNav = (id: string) => { 
    if (id === 'publicar') {
      localStorage.removeItem('uaifrila_vaga_editar');
    }
    setTelaAtiva(id); 
    setMenuAberto(false); 
  };

  const getBadgeVariant = (): 'default' | 'success' | 'warning' | 'danger' => {
    const tipo = getTipo();
    if (tipo === 'SUPER_ADMIN') return 'default';
    if (tipo === 'ADMIN') return 'warning';
    if (tipo === 'FINANCEIRO') return 'success';
    if (tipo === 'MODERADOR') return 'default';
    if (tipo === 'SUPORTE') return 'default';
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

        <div className="hidden lg:flex items-center gap-1 flex-wrap max-w-[70%]">
          {filtrado.map((item:any) => {
            const ativo = telaAtiva === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => handleNav(item.id)} 
                className={ativo ? styles.buttonPrimary() : styles.buttonSecondary}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme} 
            className={styles.buttonSecondary}
            title="Alternar tema"
          >
            {styles.isDark ? '☾' : '☀'}
          </button>
          
          <div className="hidden md:flex items-center gap-2">
            {usuario ? (
              <>
                <span className={`text-xs font-bold max-w-[120px] truncate ${styles.isDark ? 'text-white' : 'text-black'}`}>{usuario.nome_completo || usuario.nome}</span>
                <button onClick={onLogout} className={styles.buttonDanger}>Sair</button>
              </>
            ) : (
              <>
                <button onClick={() => handleNav('login')} className={styles.buttonSecondary}>Login</button>
                <button onClick={() => handleNav('cadastro')} className={styles.buttonPrimary()}>Cadastro</button>
              </>
            )}
          </div>

          <button onClick={() => setMenuAberto(!menuAberto)} className={`${styles.buttonSecondary} lg:hidden w-10 h-10 flex flex-col items-center justify-center gap-1`}>
            <span className={`block w-5 h-0.5 transition-all ${styles.isDark ? 'bg-white' : 'bg-black'} ${menuAberto ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`block w-5 h-0.5 ${styles.isDark ? 'bg-white' : 'bg-black'} ${menuAberto ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 transition-all ${styles.isDark ? 'bg-white' : 'bg-black'} ${menuAberto ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </button>
        </div>
      </div>

      {menuAberto && (
        <div className={`lg:hidden absolute top-[72px] left-0 right-0 border-b-2 max-h-[80vh] overflow-y-auto shadow-xl ${styles.isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-black'}`}>
          <div className="p-4 space-y-2">
            {usuario && (
              <div className={styles.cardSmall}>
                <span className={styles.label}>Perfil atual</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={styles.badge(getBadgeVariant())}>{getTipo()}</span>
                  <span className="text-xs font-bold truncate">{usuario.nome_completo || usuario.nome}</span>
                </div>
              </div>
            )}
            {filtrado.map((item:any) => {
              const ativo = telaAtiva === item.id;
              return (
                <button 
                  key={item.id} 
                  onClick={() => handleNav(item.id)} 
                  className={`${ativo ? styles.buttonPrimary() : styles.buttonSecondary} w-full text-left justify-between flex items-center`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className={`border-t-2 mt-4 pt-4 space-y-2 ${styles.isDark ? 'border-zinc-700' : 'border-black/10'}`}>
              {usuario ? (
                <button onClick={() => { onLogout(); setMenuAberto(false); }} className={`${styles.buttonDanger} w-full`}>Sair</button>
              ) : (
                <>
                  <button onClick={() => handleNav('login')} className={`${styles.buttonSecondary} w-full`}>Login</button>
                  <button onClick={() => handleNav('cadastro')} className={`${styles.buttonPrimary()} w-full`}>Cadastro</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
