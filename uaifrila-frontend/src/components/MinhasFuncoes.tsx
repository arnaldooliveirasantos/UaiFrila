import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../utils/Api';
import { listarCategoriasComFuncoes, listarMinhasFuncoes, salvarMinhaFuncao, removerMinhaFuncao, FAIXAS } from '../services/FuncoesService';
// Tela "Minhas Funções": o freela declara em que já trabalhou + tempo de experiência.
// O comprovado no app (trampos finalizados) vem da API e NÃO é editável.
export default function MinhasFuncoes() {
  const [linhas, setLinhas] = useState<any[]>([]);
  const [minhas, setMinhas] = useState<any[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const carregar = async () => {
    try { const [c, m] = await Promise.all([listarCategoriasComFuncoes(), listarMinhasFuncoes()]); setLinhas(c); setMinhas(m); }
    catch (e: any) { setErro(e.message || 'Erro ao carregar funções'); }
  };
  useEffect(() => { carregar(); }, []);
  const categorias = useMemo(() => ['Todas', ...Array.from(new Set(linhas.map((l: any) => l.categoria_nome).filter(Boolean)))], [linhas]);
  const funcoesFiltradas = useMemo(() => {
    const mapa = new Map<number, any>();
    linhas.forEach((l: any) => { if (l.funcao_id && !mapa.has(l.funcao_id)) mapa.set(l.funcao_id, { id: l.funcao_id, nome: l.funcao_nome, categoria: l.categoria_nome }); });
    return Array.from(mapa.values()).filter((f: any) => (categoriaFiltro === 'Todas' || f.categoria === categoriaFiltro) && f.nome.toLowerCase().includes(busca.toLowerCase()));
  }, [linhas, categoriaFiltro, busca]);
  const minha = (funcaoId: number) => minhas.find((m: any) => Number(m.funcao_id) === funcaoId);
  const alterar = (funcaoId: number, campo: string, valor: any) => {
    setMinhas((prev) => { const ex = prev.find((m: any) => Number(m.funcao_id) === funcaoId);
      if (ex) return prev.map((m: any) => Number(m.funcao_id) === funcaoId ? { ...m, [campo]: valor, _alterada: true } : m);
      return [...prev, { funcao_id: funcaoId, tempo_experiencia_meses: 6, onde_trabalhou: '', ainda_trabalha: true, [campo]: valor, _nova: true }]; });
  };
  const salvarTodas = async () => {
    setSalvando(true); setErro('');
    try { for (const m of minhas.filter((x: any) => x._alterada || x._nova)) await salvarMinhaFuncao({ funcao_id: m.funcao_id, tempo_experiencia_meses: m.tempo_experiencia_meses, onde_trabalhou: m.onde_trabalhou, ainda_trabalha: m.ainda_trabalha }); await carregar(); }
    catch (e: any) { setErro(e.message || 'Erro ao salvar'); } finally { setSalvando(false); }
  };
  const remover = async (funcaoId: number) => { await removerMinhaFuncao(funcaoId); setMinhas((p) => p.filter((m: any) => Number(m.funcao_id) !== funcaoId)); };
  const comprovadas = minhas.filter((m: any) => Number(m.trampos_comprovados || 0) > 0);
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-black uppercase">Minhas funções</h2>
      <p className="text-xs mt-1 opacity-70">Conte onde você já trabalhou. O contratante vê isso na hora de te escolher.</p>
      {erro && <div className="mt-4 p-3 text-xs bg-red-100 text-red-700 rounded">{erro}</div>}
      <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar função... ex: Garçom" className="mt-4 w-full border rounded px-3 py-2 text-sm" />
      <div className="flex flex-wrap gap-2 mt-3">{categorias.map((c) => <button key={c} onClick={() => setCategoriaFiltro(c)} className={`px-3 py-1 text-xs font-black rounded-full ${categoriaFiltro === c ? 'bg-black text-white' : 'border'}`}>{c}</button>)}</div>
      {comprovadas.length > 0 && <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded"><p className="text-xs font-black uppercase text-green-800">✓ Comprovadas no app (automático, não editável)</p>
        {comprovadas.map((m: any) => <p key={m.funcao_id} className="text-xs mt-2">{m.funcao_nome} — {m.trampos_comprovados} trampos concluídos, média {m.media_avaliacao_funcao ? Number(m.media_avaliacao_funcao).toFixed(1) : '—'} na função</p>)}</div>}
      <div className="mt-6 grid gap-4">{funcoesFiltradas.map((f: any) => { const m = minha(f.id); const sel = !!m; return (
        <div key={f.id} className={`p-4 border rounded ${sel ? 'border-black' : ''}`}>
          <div className="flex justify-between items-start"><div><p className="font-black">{f.nome}</p><p className="text-xs opacity-70">{f.categoria}</p></div>
            <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={sel} onChange={(e) => e.target.checked ? alterar(f.id, 'tempo_experiencia_meses', 6) : remover(f.id)} /> Já trabalhei</label></div>
          {sel && <div className="mt-3"><p className="text-xs font-black uppercase">Tempo de experiência</p>
            <div className="flex flex-wrap gap-2 mt-2">{FAIXAS.map((fx) => <button key={fx.label} onClick={() => alterar(f.id, 'tempo_experiencia_meses', fx.meses)} className={`px-3 py-1 text-xs rounded-full ${Number(m.tempo_experiencia_meses) === fx.meses ? 'bg-black text-white' : 'border'}`}>{fx.label}</button>)}</div>
            <input value={m.onde_trabalhou || ''} onChange={(e) => alterar(f.id, 'onde_trabalhou', e.target.value)} placeholder="Onde trabalhou? (opcional)" className="mt-3 w-full border rounded px-3 py-2 text-sm" />
            <label className="text-xs flex items-center gap-2 mt-2"><input type="checkbox" checked={!!m.ainda_trabalha} onChange={(e) => alterar(f.id, 'ainda_trabalha', e.target.checked)} /> Ainda trabalho com isso</label>
            {m.nivel && <p className="text-xs mt-2">Nível: <b>{m.nivel}</b> {m.comprovada ? '• Comprovada no app' : '• Declarada'}</p>}</div>}
        </div>); })}</div>
      <button disabled={salvando} onClick={salvarTodas} className="mt-6 w-full py-3 bg-black text-white text-sm font-black uppercase rounded">{salvando ? 'Salvando...' : 'Salvar minhas funções'}</button>
      <p className="text-xs opacity-70 mt-3">Funções declaradas aparecem como “Declarada”. Funções com trampos no app ganham o selo “Comprovada no app”.</p>
    </div>
  );
}
