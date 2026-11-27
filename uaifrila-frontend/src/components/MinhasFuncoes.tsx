import React, { useEffect, useMemo, useState } from 'react';
import { listarCategoriasComFuncoes, listarMinhasFuncoes, salvarMinhaFuncao, removerMinhaFuncao, FAIXAS } from '../services/FuncoesService';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
// NO PADRAO DO SISTEMA: tudo via useUaiFrilaStyles() - nenhuma cor hardcoded.
// Antes: bg-black, bg-red-100, bg-green-50, border rounded... fora do design
// system e sem respeitar o tema claro/escuro.
function normalizarLista(d: any): any[] {
  const lista = d?.data?.data || d?.data || d || [];
  if (!Array.isArray(lista)) return [];
  // Formato 1: [{categoria_nome, funcao_id, funcao_nome}]
  // Formato 2: [{id, nome, funcoes:[{id,nome}]}] (categorias com funcoes aninhadas)
  if (lista.length && lista[0]?.funcoes) {
    const out: any[] = [];
    for (const c of lista) for (const f of (c.funcoes || [])) out.push({ categoria_nome: c.nome || c.categoria_nome, categoria_id: c.id, funcao_id: f.id, funcao_nome: f.nome });
    return out;
  }
  return lista;
}
export default function MinhasFuncoes() {
  const styles = useUaiFrilaStyles();
  const [linhas, setLinhas] = useState<any[]>([]);
  const [minhas, setMinhas] = useState<any[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const carregar = async () => {
    setCarregando(true); setErro('');
    try {
      const [c, m] = await Promise.all([listarCategoriasComFuncoes(), listarMinhasFuncoes()]);
      setLinhas(normalizarLista(c));
      const minhasLista = Array.isArray(m) ? m : (m?.data || []);
      setMinhas(minhasLista);
    } catch (e: any) { setErro(e.message || 'Erro ao carregar funções'); } finally { setCarregando(false); }
  };
  useEffect(() => { carregar(); }, []);
  const categorias = useMemo(() => ['Todas', ...Array.from(new Set(linhas.map((l: any) => l.categoria_nome).filter(Boolean)))], [linhas]);
  const funcoesFiltradas = useMemo(() => {
    const mapa = new Map<number, any>();
    linhas.forEach((l: any) => { if (l.funcao_id && !mapa.has(l.funcao_id)) mapa.set(l.funcao_id, { id: l.funcao_id, nome: l.funcao_nome, categoria: l.categoria_nome }); });
    return Array.from(mapa.values()).filter((f: any) => (categoriaFiltro === 'Todas' || f.categoria === categoriaFiltro) && String(f.nome || '').toLowerCase().includes(busca.toLowerCase()));
  }, [linhas, categoriaFiltro, busca]);
  const minha = (funcaoId: number) => minhas.find((m: any) => Number(m.funcao_id) === funcaoId);
  const alterar = (funcaoId: number, campo: string, valor: any) => {
    setMinhas((prev) => { const ex = prev.find((m: any) => Number(m.funcao_id) === funcaoId);
      if (ex) return prev.map((m: any) => Number(m.funcao_id) === funcaoId ? { ...m, [campo]: valor, _alterada: true } : m);
      return [...prev, { funcao_id: funcaoId, tempo_experiencia_meses: 6, onde_trabalhou: '', ainda_trabalha: true, [campo]: valor, _nova: true }]; });
  };
  const salvarTodas = async () => { setSalvando(true); setErro(''); try { for (const m of minhas.filter((x: any) => x._alterada || x._nova)) await salvarMinhaFuncao({ funcao_id: m.funcao_id, tempo_experiencia_meses: m.tempo_experiencia_meses, onde_trabalhou: m.onde_trabalhou, ainda_trabalha: m.ainda_trabalha }); await carregar(); } catch (e: any) { setErro(e.message || 'Erro ao salvar'); } finally { setSalvando(false); } };
  const remover = async (funcaoId: number) => { await removerMinhaFuncao(funcaoId); setMinhas((p) => p.filter((m: any) => Number(m.funcao_id) !== funcaoId)); };
  const comprovadas = minhas.filter((m: any) => Number(m.trampos_comprovados || 0) > 0);
  if (carregando) return <div className={styles.pageContainer}><div className={styles.card}><p className="animate-pulse">Carregando suas funções...</p></div></div>;
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.typography.h1}>Minhas funções</h1>
      <p className={styles.typography.body + ' mt-2'}>Conte onde você já trabalhou. O contratante vê isso na hora de te escolher.</p>
      {erro && <div className={styles.errorBox + ' mt-4'}>{erro} <button onClick={carregar} className={styles.buttonGhost}>Tentar de novo</button></div>}
      <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar função... ex: Garçom" className={styles.input + ' mt-4'} />
      <div className="flex flex-wrap gap-2 mt-3">{categorias.map((c) => <button key={c} onClick={() => setCategoriaFiltro(c)} className={categoriaFiltro === c ? styles.badge('warning') : styles.badge('default')}>{c}</button>)}</div>
      {comprovadas.length > 0 && <div className={styles.cardSmall + ' mt-6'}><p className={styles.typography.h3}>✓ Comprovadas no app (automático, não editável)</p>{comprovadas.map((m: any) => <p key={m.funcao_id} className={styles.typography.bodySmall + ' mt-2'}>{m.funcao_nome} — {m.trampos_comprovados} trampos concluídos, média {m.media_avaliacao_funcao ? Number(m.media_avaliacao_funcao).toFixed(1) : '—'} na função</p>)}</div>}
      {funcoesFiltradas.length === 0 && <div className={styles.cardSmall + ' mt-6'}><p className={styles.typography.body}>Nenhuma função encontrada{busca ? ` para "${busca}"` : ''}. {linhas.length === 0 ? 'O catálogo de funções está vazio — rode o seed de categorias/funções no banco e clique em Recarregar.' : 'Tente limpar a busca ou trocar a categoria.'}</p><button onClick={carregar} className={styles.buttonGhost}>Recarregar</button></div>}
      <div className="mt-6 grid gap-4">{funcoesFiltradas.map((f: any) => { const m = minha(f.id); const sel = !!m; return (
        <div key={f.id} className={styles.cardSmall}>
          <div className="flex justify-between items-start"><div><p className={styles.typography.body + ' font-black'}>{f.nome}</p><p className={styles.typography.caption}>{f.categoria}</p></div>
          <label className={'flex items-center gap-2 ' + styles.typography.bodySmall}><input type="checkbox" checked={sel} onChange={(e) => { if (e.target.checked) alterar(f.id, 'tempo_experiencia_meses', 6); else remover(f.id); }} /> Já trabalhei</label></div>
          {sel && <div className="mt-3 grid gap-2"><label className={styles.label}>Tempo de experiência<select value={m.tempo_experiencia_meses} onChange={(e) => alterar(f.id, 'tempo_experiencia_meses', Number(e.target.value))} className={styles.select + ' mt-1'}>{FAIXAS.map((fx: any) => <option key={fx.meses} value={fx.meses}>{fx.label}</option>)}</select></label>
          <label className={styles.label}>Onde trabalhou<input value={m.onde_trabalhou || ''} onChange={(e) => alterar(f.id, 'onde_trabalhou', e.target.value)} className={styles.input + ' mt-1'} placeholder="Ex: Buffet X, Restaurante Y" /></label>
          <label className={'flex items-center gap-2 ' + styles.typography.bodySmall}><input type="checkbox" checked={!!m.ainda_trabalha} onChange={(e) => alterar(f.id, 'ainda_trabalha', e.target.checked)} /> Ainda trabalho com isso</label></div>}
        </div>); })}
      </div>
      {minhas.some((m: any) => m._alterada || m._nova) && <button onClick={salvarTodas} disabled={salvando} className={styles.buttonPrimary(salvando) + ' mt-6'}>{salvando ? 'Salvando...' : 'Salvar minhas funções'}</button>}
    </div>);
}
