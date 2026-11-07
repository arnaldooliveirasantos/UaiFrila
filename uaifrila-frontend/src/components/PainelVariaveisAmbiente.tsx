import React, { useEffect, useMemo, useState } from 'react';
import { VariavelService, VariavelSistema } from '../services/VariavelService';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
// Botão de tema só existe no Navbar

// Painel Variáveis - variaveis_sistema COM FILTRO + Styles/Context CORRETOS
// - Usa useUaiFrilaStyles() - NÃO usa cor hardcoded
// - buttonPrimary é FUNÇÃO: styles.buttonPrimary(disabled)
// - buttonSecondary é STRING: styles.buttonSecondary (SEM parênteses)
// - isDark vem do hook: const { isDark } = styles;
// - REGRA: SEM botão de tema aqui. Troca de tema só no Navbar.

type FiltroTipo = 'todas' | 'numericas' | 'texto';

export default function PainelVariaveisAmbiente() {
  const styles = useUaiFrilaStyles();
  // REGRA: botão de tema NÃO existe nesta tela - só no Navbar.
  // O tema vem sozinho via useUaiFrilaStyles().
  const [variaveis, setVariaveis] = useState<VariavelSistema[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [editando, setEditando] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState<string | null>(null);

  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<string>('todas');
  const [tipoValor, setTipoValor] = useState<FiltroTipo>('todas');
  const [soAlteradas, setSoAlteradas] = useState(false);
  const [soSemDescricao, setSoSemDescricao] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    try {
      let lista: any[] = [];
      try { lista = await new VariavelService().listar(); }
      catch { lista = await (VariavelService as any).listar(); }
      setVariaveis(Array.isArray(lista) ? lista : []);
    } catch (e: any) { setErro(e.message); } finally { setCarregando(false); }
  };
  useEffect(() => { carregar(); }, []);

  const categorias = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const v of variaveis) { const cat = (v.categoria || 'geral').trim() || 'geral'; mapa.set(cat, (mapa.get(cat) || 0) + 1); }
    return Array.from(mapa.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [variaveis]);

  const totalAlteradas = Object.keys(editando).length;

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return variaveis.filter((v) => {
      if (categoria !== 'todas' && (v.categoria || 'geral') !== categoria) return false;
      const ehNumerico = v.valor_numerico !== null && v.valor_numerico !== undefined && String(v.valor_numerico) !== '';
      if (tipoValor === 'numericas' && !ehNumerico) return false;
      if (tipoValor === 'texto' && ehNumerico) return false;
      if (soAlteradas) { const novo = editando[v.chave]; if (novo === undefined || novo === String(v.valor)) return false; }
      if (soSemDescricao && (v.descricao || '').trim() !== '') return false;
      if (termo) {
        const haystack = `${v.chave} ${v.descricao || ''} ${v.valor || ''} ${v.categoria || ''} ${v.valor_numerico ?? ''}`.toLowerCase();
        const palavras = termo.split(/\s+/).filter(Boolean);
        if (!palavras.every((p) => haystack.includes(p))) return false;
      }
      return true;
    });
  }, [variaveis, busca, categoria, tipoValor, soAlteradas, soSemDescricao, editando]);

  const limparFiltros = () => { setBusca(''); setCategoria('todas'); setTipoValor('todas'); setSoAlteradas(false); setSoSemDescricao(false); };
  const temFiltroAtivo = busca.trim() !== '' || categoria !== 'todas' || tipoValor !== 'todas' || soAlteradas || soSemDescricao;

  const salvar = async (chave: string) => {
    try {
      const valor = editando[chave];
      if (valor === undefined || valor === '') return;
      setSalvando(chave);
      await new VariavelService().atualizar(chave, valor);
      await carregar();
      setEditando((prev) => { const n = { ...prev }; delete n[chave]; return n; });
    } catch (e: any) { setErro(e.message); } finally { setSalvando(null); }
  };

  // Destaque usa styles.badge('warning') - NÃO usa bg-[#FFC700] hardcoded
  const destacar = (texto: string) => {
    const termo = busca.trim();
    if (!termo || !texto) return texto;
    const idx = texto.toLowerCase().indexOf(termo.toLowerCase());
    if (idx === -1) return texto;
    return (<>{texto.slice(0, idx)}<span className={styles.badge('warning')}>{texto.slice(idx, idx + termo.length)}</span>{texto.slice(idx + termo.length)}</>);
  };

  const atalhos = [
    { rotulo: '💰 Taxas / Comissão', busca: 'TAXA COMISSAO' },
    { rotulo: '🚫 Cancelamento', busca: 'CANCELAMENTO' },
    { rotulo: '💲 Valor mínimo', busca: 'VALOR MINIMO' },
    { rotulo: '📱 Notificação', busca: 'NOTIFICAR' },
    { rotulo: '⏰ Prazo', busca: 'PRAZO' },
  ];

  if (carregando) return <div className={styles.pageContainer}><div className={styles.card}>Carregando variáveis...</div></div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h2 className={styles.typography.h1}>Variáveis - variaveis_sistema</h2>
          <button type="button" onClick={carregar} className={styles.buttonSecondary}>Recarregar</button>
        </div>
        {erro && <div className={styles.errorBox}>{erro}</div>}

        {/* FILTRO - usa styles.cardSmall, NÃO bg-zinc-50 hardcoded */}
        <div className={`${styles.cardSmall} space-y-3 mt-4`}>
          <div className="flex gap-2 flex-wrap">
            <input value={busca} onChange={(e) => setBusca(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setBusca(''); }} placeholder="🔍 Buscar por chave, descrição ou valor... ex: TAXA_PIX, cancelamento, 75" className={`${styles.input} flex-1 min-w-[260px]`} autoFocus />
            {temFiltroAtivo && (<button type="button" onClick={limparFiltros} className={styles.buttonSecondary}>✕ Limpar filtros</button>)}
          </div>

          <div className="flex gap-2 flex-wrap">
            <span className={styles.typography.caption}>Atalhos:</span>
            {atalhos.map((a) => (
              <button key={a.rotulo} type="button" onClick={() => setBusca(a.busca)} className={busca === a.busca ? styles.badge('warning') : styles.badge('default')}>{a.rotulo}</button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <span className={styles.typography.caption}>Categoria:</span>
            <button type="button" onClick={() => setCategoria('todas')} className={categoria === 'todas' ? styles.badge('warning') : styles.badge('default')}>Todas ({variaveis.length})</button>
            {categorias.map(([cat, qtd]) => (
              <button key={cat} type="button" onClick={() => setCategoria(categoria === cat ? 'todas' : cat)} className={categoria === cat ? styles.badge('warning') : styles.badge('default')}>{cat} ({qtd})</button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <span className={styles.typography.caption}>Tipo:</span>
            {(['todas', 'numericas', 'texto'] as FiltroTipo[]).map((t) => (
              <button key={t} type="button" onClick={() => setTipoValor(t)} className={tipoValor === t ? styles.badge('warning') : styles.badge('default')}>{t === 'todas' ? 'Todos' : t === 'numericas' ? 'Só numéricas' : 'Só texto'}</button>
            ))}
            <label className="flex items-center gap-1 text-[11px] font-bold cursor-pointer">
              <input type="checkbox" checked={soAlteradas} onChange={(e) => setSoAlteradas(e.target.checked)} /> Só alteradas ({totalAlteradas})
            </label>
            <label className="flex items-center gap-1 text-[11px] font-bold cursor-pointer">
              <input type="checkbox" checked={soSemDescricao} onChange={(e) => setSoSemDescricao(e.target.checked)} /> Só sem descrição
            </label>
          </div>

          <p className={styles.typography.caption}>Mostrando <b>{filtradas.length}</b> de <b>{variaveis.length}</b> variáveis{temFiltroAtivo && <> • Filtro ativo</>}{totalAlteradas > 0 && <> • {totalAlteradas} alterada(s) não salva(s)</>}</p>
        </div>

        <div className="mt-6 space-y-3">
          {filtradas.map((v) => {
            const alterada = editando[v.chave] !== undefined && editando[v.chave] !== String(v.valor);
            return (
              <div key={v.chave} className={styles.cardSmall + ' flex justify-between items-center'}>
                <div className="flex-1 min-w-0">
                  <p className={styles.typography.h3}>{destacar(v.chave)}</p>
                  <p className={styles.typography.caption}>{v.descricao || '(sem descrição)'} • Cat: {v.categoria || 'geral'} • Num: {v.valor_numerico ?? '-'}</p>
                  <p className={`${styles.typography.bodySmall} mt-1 font-mono`}>Atual: {v.valor}</p>
                  {alterada && <p className="text-[11px] font-bold"><span className={styles.badge('warning')}>✏️ Alterada - clique em Salvar</span></p>}
                </div>
                <div className="flex gap-2 items-center ml-4 shrink-0">
                  <input value={editando[v.chave] ?? String(v.valor)} onChange={(e) => setEditando((p) => ({ ...p, [v.chave]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') salvar(v.chave); }} className={styles.input + ' w-32'} />
                  {/* buttonPrimary É FUNÇÃO - passa disabled */}
                  <button type="button" onClick={() => salvar(v.chave)} disabled={salvando === v.chave || !alterada} className={styles.buttonPrimary(salvando === v.chave || !alterada)}>{salvando === v.chave ? 'Salvando...' : 'Salvar'}</button>
                </div>
              </div>
            );
          })}
          {filtradas.length === 0 && (
            <div className={styles.cardSmall + ' text-center'}>
              <p className={styles.typography.body}>Nenhuma variável encontrada com esse filtro.</p>
              <p className={styles.typography.caption}>{temFiltroAtivo ? 'Tente limpar o filtro ou buscar por outra palavra.' : 'Verifique se o backend está rodando: SELECT * FROM variaveis_sistema;'}</p>
              {temFiltroAtivo && <button type="button" onClick={limparFiltros} className={`${styles.buttonSecondary} mt-3`}>Limpar filtros</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
