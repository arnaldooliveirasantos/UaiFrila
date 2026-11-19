import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/Api';
import { useTheme } from '../context/ThemeContext';
import LogoIcone from './LogoIcone';

// Navbar (Patch 18) — hambúrguer 3+4 + menu desktop melhorado.
// - Desktop (xl+): menu horizontal com submenu no HOVER (ideia 1), botão
//   "Publicar Vaga" em destaque (2), sino com contador (4), avatar com
//   dropdown de Minha conta (5), linha "você está aqui" (6), resumo rápido (7),
//   menu fixo no topo (8 — já era fixed, mantido).
// - Hambúrguer (< xl): gaveta 3+4 — perfil no topo, categorias em acordeão
//   (uma aberta por vez, com contador), Sair fixo no rodapé, item ativo com
//   barra verde à esquerda.
// - Mesmos ids de tela do App.tsx (nada de rota nova).

type ItemMenu = { id: string; label: string; icon: string; show: () => boolean };
type GrupoMenu = { titulo: string; icon: string; itens: ItemMenu[] };

export default function Navbar({ telaAtiva, setTelaAtiva, usuario, onLogout }: any) {
  const { toggleTheme, isDark } = useTheme();
  const [menuAberto, setMenuAberto] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  // Dropdown aberto no desktop (título do grupo) e grupos recolhidos no hambúrguer.
  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null);
  // Avatar (desktop): dropdown de Minha conta. Hambúrguer: acordeão 3+4 — UMA
  // categoria aberta por vez (o título guarda qual está aberta).
  const [avatarAberto, setAvatarAberto] = useState(false);
  const [grupoAberto, setGrupoAberto] = useState<string | null>(null);
  const [tramposAtivos, setTramposAtivos] = useState<number | null>(null);
  const [ganhosMes, setGanhosMes] = useState<number | null>(null);
  const [fotoQuebrada, setFotoQuebrada] = useState(false);
  // Foto do usuário: mesma validação do FotoPerfil.tsx (base64 data:image
  // válida ou URL http/https). Se não existir ou quebrar, cai para a inicial.
  const fotoUrl = (() => {
    const f = usuario?.foto;
    if (!f || typeof f !== 'string') return null;
    if (f.startsWith('data:image/')) return f.includes(',') && f.length > 100 ? f : null;
    return f.startsWith('http://') || f.startsWith('https://') ? f : null;
  })();
  const mostrarFoto = !!fotoUrl && !fotoQuebrada;
  useEffect(() => { setFotoQuebrada(false); }, [usuario?.foto]);

  useEffect(() => {
    if (!usuario) { setNaoLidas(0); return; }
    let vivo = true;
    apiFetch('/api/notificacoes/nao-lidas').then((d: any) => { if (vivo) setNaoLidas(Number(d?.data?.nao_lidas ?? d?.nao_lidas ?? 0)); }).catch(() => {});
    return () => { vivo = false; };
  }, [usuario, telaAtiva]);

  useEffect(() => {
    if (!usuario) { setTramposAtivos(null); setGanhosMes(null); return; }
    let vivo = true;
    // Trampos ativos: tenta vagas (contratante) e candidaturas (freela).
    // Endpoint que não existir/falhar só esconde o card, não quebra o menu.
    const contar = (d: any): number | null => {
      const lista = Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : null);
      if (!lista) return null;
      return lista.filter((x: any) => {
        const s = String(x?.status ?? x?.status_chave ?? '').toUpperCase();
        return !['CONCLUIDO', 'CONCLUÍDO', 'CANCELADO', 'REJEITADO', 'FINALIZADO'].includes(s);
      }).length;
    };
    apiFetch('/api/vagas/minhas').then((d: any) => { if (vivo) { const n = contar(d); if (n !== null) setTramposAtivos(n); } }).catch(() => {});
    apiFetch('/api/candidaturas/minhas').then((d: any) => { if (vivo) { const n = contar(d); if (n !== null && tramposAtivos === null) setTramposAtivos(n); } }).catch(() => {});
    apiFetch('/api/ganhos').then((d: any) => {
      if (!vivo) return;
      const v = Number(d?.data?.total_mes ?? d?.total_mes ?? d?.data?.total ?? d?.total);
      if (!Number.isNaN(v)) setGanhosMes(v);
    }).catch(() => {});
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

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
        // Patch 24 (= Patch 23, mas sobre o Navbar certo): item que faltava para abrir a tela.
        // Só admin (checkAdmin), igual a Cidades/Expansão. Aparece no hambúrguer e no desktop.
        { id: 'provedores-pagamento', label: 'Provedores de Pagamento', icon: '🏦', show: () => !!usuario && checkAdmin() },
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

  // Patch 18: no DESKTOP a categoria "Minha conta" não aparece na barra —
  // acessa-se pelo avatar. No hambúrguer ela continua aparecendo.
  const gruposDesktop = gruposVisiveis.filter((g) => g.titulo !== 'Minha conta');

  const handleNav = (id: string) => {
    if (id === 'publicar') localStorage.removeItem('uaifrila_vaga_editar');
    setTelaAtiva(id);
    setMenuAberto(false);
    setDropdownAberto(null);
    setAvatarAberto(false);
  };

  // Acordeão 3+4: abrir uma categoria fecha as outras.
  const toggleGrupoHamburguer = (titulo: string) =>
    setGrupoAberto((atual) => (atual === titulo ? null : titulo));

  // Grupo que contém a tela atual (para abrir o acordeão nele por padrão).
  const grupoDaTelaAtual = (gruposVisiveis: GrupoMenu[]) =>
    gruposVisiveis.find((g) => g.itens.some((i) => telaAtiva === i.id))?.titulo ?? null;
  const grupoAcordeaoAberto = grupoAberto ?? grupoDaTelaAtual(gruposVisiveis);

  // Nome/inicial para o perfil do hambúrguer e o avatar.
  const nomeExibir = usuario?.nome_completo || usuario?.nome || usuario?.email || 'Usuário';
  const inicial = String(nomeExibir).trim().charAt(0).toUpperCase() || 'U';

  // Rótulo da tela atual para a linha "você está aqui" (ideia 6).
  const labelTelaAtual = (() => {
    for (const g of gruposVisiveis) {
      const item = g.itens.find((i) => telaAtiva === i.id);
      if (item) return item.label;
    }
    const extras: Record<string, string> = { home: 'Início', login: 'Login', cadastro: 'Cadastro' };
    return extras[String(telaAtiva)] ?? 'Mural';
  })();



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
          {gruposDesktop.map((grupo) => {
            const aberto = dropdownAberto === grupo.titulo;
            const temItemAtivo = grupo.itens.some((i) => telaAtiva === i.id);
            return (
              <div
                key={grupo.titulo}
                className="relative"
                onMouseEnter={() => setDropdownAberto(grupo.titulo)}
                onMouseLeave={() => setDropdownAberto(null)}
              >
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
          {/* Ideia 2: CTA Publicar Vaga em destaque (só quem pode publicar vê). */}
          {usuario && checkContratante() && (
            <button
              onClick={() => handleNav('publicar')}
              className="hidden md:block text-[10px] font-black uppercase bg-green-600 text-white border-2 border-white px-3 py-1.5 hover:bg-green-700"
            >
              ➕ Publicar Vaga
            </button>
          )}
          {/* Ideia 4: sino fixo no topo com contador de não lidas. */}
          {usuario && (
            <button
              onClick={() => handleNav('notificacoes')}
              className="relative w-8 h-8 hidden sm:flex items-center justify-center border-2 border-white bg-black text-white hover:bg-white hover:text-black text-[14px]"
              title="Notificações"
            >
              🔔
              {naoLidas > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-black px-1 py-px border border-white leading-none">{naoLidas}</span>
              )}
            </button>
          )}
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="xl:hidden w-8 h-8 flex items-center justify-center border-2 border-white bg-black text-white"
            title="Menu"
          >
            {menuAberto ? '✕' : '☰'}
          </button>
          {/* Ideia 5: avatar abre Minha conta (perfil, funções, PIX, sair). */}
          {usuario ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setAvatarAberto(!avatarAberto)}
                className="w-8 h-8 flex items-center justify-center rounded-full overflow-hidden bg-green-600 text-white border-2 border-white font-black text-[13px]"
                title={nomeExibir}
              >
                {mostrarFoto ? (
                  <img src={fotoUrl as string} alt="" aria-hidden="true" className="w-full h-full object-cover" onError={() => setFotoQuebrada(true)} />
                ) : (inicial)}
              </button>
              {avatarAberto && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAvatarAberto(false)} />
                  <div className={`absolute right-0 top-full mt-1 z-50 w-56 border-2 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-black border-white'} p-1 flex flex-col gap-1`}>
                    <div className="px-3 py-2 border-b-2 border-zinc-700">
                      <div className="text-[12px] font-black text-white truncate">{nomeExibir}</div>
                      <div className="text-[10px] font-bold text-green-400">{getTipo()}</div>
                    </div>
                    {(gruposVisiveis.find((g) => g.titulo === 'Minha conta')?.itens ?? []).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleNav(item.id)}
                        className={`w-full text-left text-[11px] font-black uppercase px-3 py-2.5 border-2 ${telaAtiva === item.id ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white hover:bg-white hover:text-black'}`}
                      >
                        {item.icon} {item.label}{seloNotificacoes(item)}
                      </button>
                    ))}
                    <button onClick={() => { setAvatarAberto(false); onLogout(); }} className="w-full text-left text-[11px] font-black uppercase px-3 py-2.5 bg-red-600 text-white border-2 border-white hover:bg-red-700">🚪 Sair</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="hidden md:flex gap-1">
              <button onClick={() => handleNav('login')} className="text-[10px] font-black uppercase bg-white text-black border-2 border-white px-3 py-1.5">Login</button>
              <button onClick={() => handleNav('cadastro')} className="text-[10px] font-black uppercase bg-[#E53935] text-white border-2 border-white px-3 py-1.5">Cadastro</button>
            </div>
          )}
        </div>
      </div>

      {/* Ideia 6: linha "você está aqui". Ideia 7: resumo rápido. */}
      {usuario && (
        <div className={`border-t ${isDark ? 'border-zinc-700' : 'border-zinc-800'}`}>
          <div className="max-w-7xl mx-auto px-2 md:px-4 py-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-[10px] font-bold text-zinc-400">
              Você está em: <span className="text-white font-black uppercase">{labelTelaAtual}</span>
              {' '}· Perfil: <span className="text-green-400 font-black">{getTipo()}</span>
            </span>
            <span className="ml-auto flex items-center gap-3 text-[10px] font-black uppercase">
              <button onClick={() => handleNav('notificacoes')} className="text-white hover:underline">🔔 {naoLidas} não lidas</button>
              {tramposAtivos !== null && (
                <button onClick={() => handleNav('trampos')} className="text-white hover:underline">💼 {tramposAtivos} trampos ativos</button>
              )}
              {ganhosMes !== null && (
                <button onClick={() => handleNav('ganhos')} className="text-green-400 hover:underline">💵 R$ {ganhosMes.toFixed(2).replace('.', ',')} no mês</button>
              )}
            </span>
          </div>
        </div>
      )}

      {/* HAMBÚRGUER 3+4: gaveta com perfil no topo, acordeão (uma aberta por
          vez, com contador), item ativo com barra verde, Sair fixo no rodapé. */}
      {menuAberto && (
        <div className={`xl:hidden border-t-2 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-black border-white'} flex flex-col max-h-[calc(100vh-56px)]`}>
          {/* Perfil no topo (ideia 3). */}
          {usuario && (
            <button onClick={() => handleNav('perfil')} className="flex items-center gap-3 px-3 py-3 text-left border-b-2 border-zinc-700">
              <span className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full overflow-hidden bg-green-600 text-white border-2 border-white font-black text-[18px]">
                {mostrarFoto ? (
                  <img src={fotoUrl as string} alt="" aria-hidden="true" className="w-full h-full object-cover" onError={() => setFotoQuebrada(true)} />
                ) : (inicial)}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-black text-white truncate">{nomeExibir}</span>
                <span className="block text-[10px] font-bold text-green-400">● {getTipo()}</span>
              </span>
            </button>
          )}
          <div className="overflow-y-auto p-2 flex-1">
            <div className="flex flex-col gap-1">
              {gruposVisiveis.map((grupo) => {
                const aberto = grupoAcordeaoAberto === grupo.titulo;
                return (
                  <div key={grupo.titulo} className="flex flex-col">
                    <button
                      onClick={() => toggleGrupoHamburguer(grupo.titulo)}
                      className="w-full flex items-center justify-between text-left text-[11px] font-black uppercase px-3 py-2.5 border-b-2 border-zinc-700 text-zinc-300"
                    >
                      <span>{grupo.icon} {grupo.titulo}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="bg-zinc-700 text-white text-[9px] font-black px-1.5 py-0.5">{grupo.itens.length}</span>
                        <span>{aberto ? '▾' : '▸'}</span>
                      </span>
                    </button>
                    {aberto && grupo.itens.map((item) => {
                      const ativo = telaAtiva === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNav(item.id)}
                          className={`w-full text-left text-[12px] font-black uppercase px-3 py-3 border-2 border-l-4 ${ativo ? 'bg-white text-black border-white border-l-green-600' : 'bg-transparent text-white border-white border-l-transparent'}`}
                        >
                          {item.icon} {item.label}{seloNotificacoes(item)}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Sair fixo no rodapé (ideia 3) — sempre visível, sem rolar. */}
          <div className="p-2 border-t-2 border-zinc-700">
            {usuario ? (
              <button onClick={() => { setMenuAberto(false); onLogout(); }} className="w-full text-[12px] font-black uppercase bg-red-600 text-white border-2 border-white px-3 py-3">🚪 Sair ({nomeExibir.split(' ')[0]})</button>
            ) : (
              <div className="flex flex-col gap-1">
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
