import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/Api';
import { useTheme } from '../context/ThemeContext';
import LogoIcone from './LogoIcone';

// Navbar com menus em CATEGORIAS + SUBCATEGORIAS (Patch 13).
// - Desktop (xl+): cada categoria é um botão que abre um dropdown com os itens.
// - Hambúrguer (< xl): categorias empilhadas, UM ITEM POR LINHA, com cabeçalho
//   da categoria e seta para recolher/expandir (começa tudo expandido).
// - Mesmos ids de tela do App.tsx (nada de rota nova): 'expansao-cidades' era
//   'expansao' aqui e caía em tela em branco — corrigido.

type ItemMenu = { id: string; label: string; icon: string; show: () => boolean };
type GrupoMenu = { titulo: string; icon: string; itens: ItemMenu[] };

export default function Navbar({ telaAtiva, setTelaAtiva, usuario, onLogout }: any) {
  const { toggleTheme, isDark } = useTheme();
  const [menuAberto, setMenuAberto] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  // Dropdown aberto no desktop (título do grupo) e grupos recolhidos no hambúrguer.
  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null);
  const [gruposRecolhidos, setGruposRecolhidos] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!usuario) { setNaoLidas(0); return; }
    let vivo = true;
    apiFetch('/api/notificacoes/nao-lidas').then((d: any) => { if (vivo) setNaoLidas(Number(d?.data?.nao_lidas ?? d?.nao_lidas ?? 0)); }).catch(() => {});
    return () => { vivo = false; };
  }, [usuario, telaAtiva]);

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
    if (usuario.tipo_usuario_id === 1) return 'FREELA';
    if (usuario.tipo_usuario_id === 2) return 'CONTRATANTE';
    if (usuario.tipo_usuario_id === 3) return 'DUAL';
    return 'FREELA';
  };

  const getNivel = (): number => usuario?.nivel_permissao ?? usuario?.nivel ?? 0;
  const checkContratante = (): boolean => ['CONTRATANTE', 'DUAL', 'ADMIN', 'SUPER_ADMIN', 'FINANCEIRO'].includes(getTipo());
  // Transações é quem PAGA (contratante). Freela RECEBE - ele vê Meus Ganhos, não Transações.
  const checkContratanteOuAdmin = (): boolean => ['CONTRATANTE', 'DUAL', 'ADMIN', 'SUPER_ADMIN', 'FINANCEIRO'].includes(getTipo());
  const checkFreelaOuDual = (): boolean => ['FREELA', 'DUAL'].includes(getTipo());
  // Patch 16: Minhas Funções aparece para QUALQUER perfil exceto Contratante
  // (FREELA, DUAL, ADMIN, SUPER_ADMIN, FINANCEIRO). Antes era só FREELA/DUAL.
  const checkNaoContratante = (): boolean => getTipo() !== 'CONTRATANTE';
  const checkAdmin = (): boolean => getNivel() >= 90 || ['ADMIN', 'SUPER_ADMIN'].includes(getTipo());
  const checkSuperAdmin = (): boolean => getTipo() === 'SUPER_ADMIN' || getNivel() >= 100;

  // CATEGORIAS (a ordem é a ordem de exibição). Cada item mantém o mesmo id de
  // tela do App.tsx — a regra de quem vê o quê não mudou, só a organização.
  const grupos: GrupoMenu[] = [
    {
      titulo: 'Início', icon: '🏠',
      itens: [
        { id: 'mural', label: 'Mural', icon: '🏠', show: () => !!usuario },
        { id: 'notificacoes', label: 'Notificações', icon: '🔔', show: () => !!usuario },
      ],
    },
    {
      titulo: 'Meus trampos', icon: '💼',
      itens: [
        { id: 'trampos', label: 'Meus Trampos', icon: '💼', show: () => !!usuario },
        { id: 'publicar', label: 'Publicar Vaga', icon: '➕', show: () => !!usuario && checkContratante() },
        { id: 'candidatos', label: 'Candidatos', icon: '👥', show: () => !!usuario && checkContratante() },
      ],
    },
    {
      titulo: 'Financeiro', icon: '💰',
      itens: [
        { id: 'transacoes', label: 'Transações', icon: '💰', show: () => !!usuario && checkContratanteOuAdmin() },
        { id: 'ganhos', label: 'Meus Ganhos', icon: '💵', show: () => !!usuario && checkFreelaOuDual() },
      ],
    },
    {
      titulo: 'Minha conta', icon: '👤',
      itens: [
        { id: 'perfil', label: 'Meu Perfil', icon: '👤', show: () => !!usuario },
        { id: 'minhas-funcoes', label: 'Minhas Funções', icon: '🛠️', show: () => !!usuario && checkNaoContratante() },
        { id: 'pix', label: 'Meus Dados PIX', icon: '🔑', show: () => !!usuario },
      ],
    },
    {
      titulo: 'Administração', icon: '⚙️',
      itens: [
        { id: 'cidades', label: 'Cidades', icon: '🏙️', show: () => !!usuario && checkAdmin() },
        { id: 'expansao-cidades', label: 'Expansão', icon: '🚀', show: () => !!usuario && checkAdmin() },
        { id: 'variaveis', label: 'Variáveis', icon: '⚙️', show: () => !!usuario && checkSuperAdmin() },
        { id: 'financeiro', label: 'Financeiro', icon: '📊', show: () => !!usuario && checkSuperAdmin() },
        { id: 'permissoes', label: 'Permissões', icon: '🔐', show: () => !!usuario && checkSuperAdmin() },
      ],
    },
    {
      titulo: 'Sobre', icon: 'ℹ️',
      itens: [
        { id: 'codigoFreela', label: 'Código Freela', icon: '🔗', show: () => true },
      ],
    },
  ];

  // Só grupos com pelo menos 1 item visível aparecem. Visitante sem login só vê
  // "Sobre → Código Freela" (o resto exige login).
  const gruposVisiveis = grupos
    .map((g) => ({ ...g, itens: g.itens.filter((i) => i.show()) }))
    .filter((g) => g.itens.length > 0);

  const handleNav = (id: string) => {
    if (id === 'publicar') localStorage.removeItem('uaifrila_vaga_editar');
    setTelaAtiva(id);
    setMenuAberto(false);
    setDropdownAberto(null);
  };

  const toggleGrupoHamburguer = (titulo: string) =>
    setGruposRecolhidos((g) => ({ ...g, [titulo]: !g[titulo] }));

  const seloNotificacoes = (item: ItemMenu) =>
    item.id === 'notificacoes' && naoLidas > 0 ? (
      <span className="ml-1 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 border border-white">{naoLidas}</span>
    ) : null;

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

        {/* DESKTOP: uma aba por categoria; o dropdown lista as subcategorias. */}
        <div className="hidden xl:flex items-center gap-1">
          {gruposVisiveis.map((grupo) => {
            const aberto = dropdownAberto === grupo.titulo;
            const temItemAtivo = grupo.itens.some((i) => telaAtiva === i.id);
            return (
              <div key={grupo.titulo} className="relative">
                <button
                  onClick={() => setDropdownAberto(aberto ? null : grupo.titulo)}
                  className={`text-[10px] font-black uppercase px-2.5 py-1.5 border-2 transition-all ${temItemAtivo || aberto ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white hover:bg-white hover:text-black'}`}
                >
                  {grupo.icon} {grupo.titulo} {aberto ? '▴' : '▾'}
                </button>
                {aberto && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownAberto(null)} />
                    <div className={`absolute left-0 top-full mt-1 z-50 w-56 border-2 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-black border-white'} p-1 flex flex-col gap-1`}>
                      {grupo.itens.map((item) => {
                        const ativo = telaAtiva === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleNav(item.id)}
                            className={`w-full text-left text-[11px] font-black uppercase px-3 py-2.5 border-2 ${ativo ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white hover:bg-white hover:text-black'}`}
                          >
                            {item.icon} {item.label}{seloNotificacoes(item)}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
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
            title="Menu"
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

      {/* HAMBÚRGUER: categorias empilhadas, UM ITEM POR LINHA. */}
      {menuAberto && (
        <div className={`xl:hidden border-t-2 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-black border-white'} p-2 max-h-[calc(100vh-56px)] overflow-y-auto`}>
          <div className="flex flex-col gap-3">
            {gruposVisiveis.map((grupo) => {
              const recolhido = !!gruposRecolhidos[grupo.titulo];
              return (
                <div key={grupo.titulo} className="flex flex-col gap-1">
                  <button
                    onClick={() => toggleGrupoHamburguer(grupo.titulo)}
                    className={`w-full flex items-center justify-between text-left text-[11px] font-black uppercase px-3 py-2 border-b-2 ${isDark ? 'text-zinc-300 border-zinc-700' : 'text-zinc-300 border-zinc-700'}`}
                  >
                    <span>{grupo.icon} {grupo.titulo}</span>
                    <span>{recolhido ? '▸' : '▾'}</span>
                  </button>
                  {!recolhido && grupo.itens.map((item) => {
                    const ativo = telaAtiva === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNav(item.id)}
                        className={`w-full text-left text-[12px] font-black uppercase px-3 py-3 border-2 ${ativo ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white'}`}
                      >
                        {item.icon} {item.label}{seloNotificacoes(item)}
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {usuario ? (
              <button onClick={() => { setMenuAberto(false); onLogout(); }} className="w-full mt-1 text-[12px] font-black uppercase bg-red-600 text-white border-2 border-white px-3 py-3">🚪 Sair ({usuario.nome_completo?.split(' ')[0] || usuario.email})</button>
            ) : (
              <div className="flex flex-col gap-1 mt-1">
                <button onClick={() => handleNav('login')} className="w-full text-[12px] font-black uppercase bg-white text-black border-2 border-white px-3 py-3">Login</button>
                <button onClick={() => handleNav('cadastro')} className="w-full text-[12px] font-black uppercase bg-[#E53935] text-white border-2 border-white px-3 py-3">Cadastro</button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
