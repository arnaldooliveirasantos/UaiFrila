import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import LogoIcone from './LogoIcone';

export default function Navbar({ telaAtiva, setTelaAtiva, usuario, onLogout }: any) {
  const { toggleTheme, isDark } = useTheme();
  const [menuAberto, setMenuAberto] = useState(false);

  // FIX: Não depende mais de useTiposUsuario - evita "getTipoUsuario is not a function"
  const getTipo = (): string => {
    if (!usuario) return 'VISITANTE';
    if (usuario.tipo_chave) return String(usuario.tipo_chave).toUpperCase();
    if (usuario.chave) return String(usuario.chave).toUpperCase();
    if (usuario.tipo?.chave) return String(usuario.tipo.chave).toUpperCase();
    if (usuario.tipo_usuario?.chave) return String(usuario.tipo_usuario.chave).toUpperCase();
    if (usuario.role) return String(usuario.role).toUpperCase();
    if (usuario.tipo && typeof usuario.tipo === 'string') return usuario.tipo.toUpperCase();
    const nivel = usuario.nivel_permissao ?? 0;
    if (nivel >= 100) return 'SUPER_ADMIN';
    if (nivel >= 90) return 'ADMIN';
    if (nivel >= 50) return 'FINANCEIRO';
    // fallback por id
    if (usuario.tipo_usuario_id === 1) return 'FREELA';
    if (usuario.tipo_usuario_id === 2) return 'CONTRATANTE';
    if (usuario.tipo_usuario_id === 3) return 'DUAL';
    return 'FREELA';
  };

  const getNivel = (): number => usuario?.nivel_permissao ?? usuario?.nivel ?? 0;

  const checkContratante = (): boolean => {
    const t = getTipo();
    return ['CONTRATANTE','DUAL','ADMIN','SUPER_ADMIN','FINANCEIRO'].includes(t);
  };
  // BUG 2 - Transações aparecia para FREELA:
  // ANTES: transacoes show: () => !!usuario (qualquer logado, inclusive FREELA).
  // Transação é quem PAGA (contratante). Freela RECEBE - ele vê Meus Ganhos, não Transações.
  // AGORA: Transações só para CONTRATANTE/DUAL/ADMIN/FINANCEIRO. FREELA puro não vê.
  const checkContratanteOuAdmin = (): boolean => {
    const t = getTipo();
    return ['CONTRATANTE','DUAL','ADMIN','SUPER_ADMIN','FINANCEIRO'].includes(t);
  };
  const checkFreelaOuDual = (): boolean => {
    const t = getTipo();
    return ['FREELA','DUAL'].includes(t);
  };
  const checkAdmin = (): boolean => {
    const nivel = getNivel();
    const chave = getTipo();
    return nivel >= 90 || ['ADMIN','SUPER_ADMIN'].includes(chave);
  };
  const checkSuperAdmin = (): boolean => {
    const nivel = getNivel();
    const chave = getTipo();
    return chave === 'SUPER_ADMIN' || nivel >= 100;
  };

  const menuBase = [
    { id: 'mural', label: 'Mural', icon: '🏠', show: () => !!usuario },
    { id: 'perfil', label: 'Meu Perfil', icon: '👤', show: () => !!usuario },
    { id: 'minhas-funcoes', label: 'Minhas Funções', icon: '🛠️', show: () => !!usuario && checkFreelaOuDual() },
    { id: 'publicar', label: 'Publicar Vaga', icon: '➕', show: () => !!usuario && checkContratante() },
    { id: 'trampos', label: 'Meus Trampos', icon: '💼', show: () => !!usuario },
    { id: 'transacoes', label: 'Transações', icon: '💰', show: () => !!usuario && checkContratanteOuAdmin() },
    { id: 'ganhos', label: 'Meus Ganhos', icon: '💵', show: () => !!usuario && checkFreelaOuDual() },
    { id: 'pix', label: 'Meus Dados PIX', icon: '🔑', show: () => !!usuario }, // FREELA recebe por PIX; CONTRATANTE também pode cadastrar
    { id: 'codigoFreela', label: 'Código Freela', icon: '🔗', show: () => true },
  ];

  const menuAdmin = [
    { id: 'cidades', label: 'Cidades', icon: '🏙️', show: () => !!usuario && checkAdmin() },
    { id: 'expansao', label: 'Expansão', icon: '🚀', show: () => !!usuario && checkAdmin() },
  ];

  const menuSuperAdmin = [
    { id: 'variaveis', label: 'Variáveis', icon: '⚙️', show: () => !!usuario && checkSuperAdmin() },
    { id: 'financeiro', label: 'Financeiro', icon: '📊', show: () => !!usuario && checkSuperAdmin() },
    { id: 'permissoes', label: 'Permissões', icon: '🔐', show: () => !!usuario && checkSuperAdmin() },
  ];

  const menuCompleto = [...menuBase, ...menuAdmin, ...menuSuperAdmin];
  const filtrado = menuCompleto.filter((m: any) => m.show());

  const handleNav = (id: string) => {
    // Publicar Vaga pelo MENU = vaga NOVA, tela limpa: apaga a chave de edicao.
    // ANTES a chave velha de uma edicao anterior ficava no localStorage e a
    // tela abria carregando a vaga editada, mesmo vindo pelo menu.
    // Nao confundir com o fluxo EDITAR: os botoes Editar (Meus Trampos / Mural)
    // gravam a chave DEPOIS deste clique e ai sim navegam para 'publicar' -
    // eles nao passam por aqui, entao a edicao continua funcionando.
    if (id === 'publicar') localStorage.removeItem('uaifrila_vaga_editar');
    setTelaAtiva(id);
    setMenuAberto(false);
  };

  const getBadgeColor = () => {
    const tipo = getTipo();
    if (tipo === 'SUPER_ADMIN') return 'bg-red-600 text-white border-red-800';
    if (tipo === 'ADMIN') return 'bg-purple-600 text-white border-purple-800';
    if (tipo === 'FINANCEIRO') return 'bg-yellow-500 text-black border-yellow-700';
    if (tipo === 'CONTRATANTE') return 'bg-blue-600 text-white border-blue-800';
    if (tipo === 'FREELA') return 'bg-green-600 text-white border-green-800';
    if (tipo === 'DUAL') return 'bg-orange-500 text-white border-orange-700';
    return 'bg-zinc-800 text-white border-zinc-600';
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b-2 ${isDark ? 'bg-zinc-900/95 border-zinc-700' : 'bg-black border-black'}`}>
      <div className="max-w-7xl mx-auto px-2 md:px-4 h-[56px] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => handleNav(usuario ? 'mural' : 'home')}>
          <div className="bg-white rounded-full p-1">
            <LogoIcone size={28} />
          </div>
          <span className="font-black text-[14px] md:text-[18px] tracking-tighter text-white">UAI FRILA</span>
          {usuario && (
            <span className={`text-[9px] md:text-[10px] font-black px-1.5 md:px-2 py-0.5 border-2 ${getBadgeColor()}`}>
              {getTipo()}
            </span>
          )}
        </div>

        <div className="hidden xl:flex items-center gap-1">
          {filtrado.map((item: any) => {
            const ativo = telaAtiva === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`text-[10px] font-black uppercase px-2.5 py-1.5 border-2 transition-all ${ativo ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white hover:bg-white hover:text-black'}`}
              >
                {item.icon} {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center border-2 border-white bg-black text-white hover:bg-white hover:text-black text-[12px] font-bold"
            title="Tema"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="xl:hidden w-8 h-8 flex items-center justify-center border-2 border-white bg-black text-white"
          >
            {menuAberto ? '✕' : '☰'}
          </button>
          {usuario ? (
            <button onClick={onLogout} className="hidden md:block text-[10px] font-black uppercase bg-red-600 text-white border-2 border-white px-3 py-1.5 hover:bg-red-700">Sair</button>
          ) : (
            <div className="hidden md:flex gap-1">
              <button onClick={() => handleNav('login')} className="text-[10px] font-black uppercase bg-white text-black border-2 border-white px-3 py-1.5">Login</button>
              <button onClick={() => handleNav('cadastro')} className="text-[10px] font-black uppercase bg-[#E53935] text-white border-2 border-white px-3 py-1.5">Cadastro</button>
            </div>
          )}
        </div>
      </div>

      {menuAberto && (
        <div className={`xl:hidden border-t-2 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-black border-white'} p-2`}>
          <div className="grid grid-cols-2 gap-2">
            {filtrado.map((item: any) => {
              const ativo = telaAtiva === item.id;
              return (
                <button key={item.id} onClick={() => handleNav(item.id)} className={`text-[11px] font-black uppercase px-3 py-3 border-2 text-left ${ativo ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white'}`}>
                  {item.icon} {item.label}
                </button>
              );
            })}
            {usuario ? (
              <button onClick={() => { setMenuAberto(false); onLogout(); }} className="col-span-2 mt-2 text-[11px] font-black uppercase bg-red-600 text-white border-2 border-white px-3 py-3">🚪 Sair ({usuario.nome_completo?.split(' ')[0] || usuario.email})</button>
            ) : (
              <>
                <button onClick={() => handleNav('login')} className="text-[11px] font-black uppercase bg-white text-black border-2 border-white px-3 py-3">Login</button>
                <button onClick={() => handleNav('cadastro')} className="text-[11px] font-black uppercase bg-[#E53935] text-white border-2 border-white px-3 py-3">Cadastro</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
