import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

// Relatório "Meus Ganhos" - quanto o usuário ganhou fazendo Trampos. SEM MOCK.
// Filtros: período (data_inicio/data_fim), status, contratante_id, função, busca.
// Fonte: GET /api/ganhos/meus (backend calcula bruto - comissão 15% = líquido).
const fmt = (v: any) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;
export default function MeusGanhos() {
  const styles = useUaiFrilaStyles();
  const [ganhos, setGanhos] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>({ total_bruto: 0, total_comissao: 0, total_liquido: 0, total_trampos: 0, total_horas: 0 });
  const [comissao, setComissao] = useState(15);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [f, setF] = useState({ data_inicio: '', data_fim: '', status: 'TODOS', contratante_id: '', funcao: '', busca: '' });
  const carregar = useCallback(async () => {
    setCarregando(true); setErro('');
    try {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(f)) if (v) qs.set(k, String(v));
      const data = await apiFetch(`/api/ganhos/meus?${qs.toString()}`);
      setGanhos(data.ganhos || data.data || []); setResumo(data.resumo || { total_bruto: 0, total_comissao: 0, total_liquido: 0, total_trampos: 0, total_horas: 0 }); setComissao(data.comissao_percentual ?? 15);
    } catch (e: any) { setErro(e.message || 'Não foi possível carregar os ganhos'); setGanhos([]); } finally { setCarregando(false); }
  }, [f]);
  useEffect(() => { carregar(); }, [carregar]);
  const limpar = () => setF({ data_inicio: '', data_fim: '', status: 'TODOS', contratante_id: '', funcao: '', busca: '' });
  return (<div className={styles.pageContainer}>
    <div className="flex items-center justify-between mb-6"><h1 className={styles.typography.h1}>Meus Ganhos</h1><span className={styles.badge('success')}>Comissão {comissao}%</span></div>
    <div className={styles.card}><div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div><div className={styles.typography.caption}>Total líquido</div><div className="font-black text-2xl text-green-700">{fmt(resumo.total_liquido)}</div></div>
      <div><div className={styles.typography.caption}>Total bruto</div><div className="font-black text-xl">{fmt(resumo.total_bruto)}</div></div>
      <div><div className={styles.typography.caption}>Comissão ({comissao}%)</div><div className="font-black text-xl text-red-600">- {fmt(resumo.total_comissao)}</div></div>
      <div><div className={styles.typography.caption}>Trampos / Horas</div><div className="font-black text-xl">{resumo.total_trampos} · {resumo.total_horas}h</div></div>
    </div></div>
    <div className={styles.card + ' mt-4'}><h3 className={styles.typography.h3}>Filtros</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
      <div><label className={styles.label}>De</label><input type="date" value={f.data_inicio} onChange={e => setF({ ...f, data_inicio: e.target.value })} className={styles.input} /></div>
      <div><label className={styles.label}>Até</label><input type="date" value={f.data_fim} onChange={e => setF({ ...f, data_fim: e.target.value })} className={styles.input} /></div>
      <div><label className={styles.label}>Status</label><select value={f.status} onChange={e => setF({ ...f, status: e.target.value })} className={styles.select}><option value="TODOS">Todos</option><option value="FINALIZADO">Finalizado</option><option value="CONCLUIDO">Concluído</option><option value="EM_ANDAMENTO">Em andamento</option></select></div>
      <div><label className={styles.label}>Função</label><input value={f.funcao} onChange={e => setF({ ...f, funcao: e.target.value })} className={styles.input} placeholder="Garçom, Cozinheiro..." /></div>
      <div><label className={styles.label}>Contratante ID</label><input value={f.contratante_id} onChange={e => setF({ ...f, contratante_id: e.target.value.replace(/\D/g, '') })} className={styles.input} placeholder="ID" inputMode="numeric" /></div>
      <div><label className={styles.label}>Busca</label><input value={f.busca} onChange={e => setF({ ...f, busca: e.target.value })} className={styles.input} placeholder="Título ou descrição" /></div>
    </div><div className="flex gap-2 mt-4"><button onClick={carregar} className={styles.buttonPrimary(false)}>Filtrar</button><button onClick={limpar} className={styles.buttonGhost}>Limpar</button></div></div>
    {carregando && <div className={styles.card + ' mt-4'}><p className="animate-pulse">Carregando ganhos...</p></div>}
    {erro && <div className={styles.errorBox + ' mt-4'}>{erro}</div>}
    {!carregando && !erro && <div className={styles.card + ' mt-4'}>{ganhos.length === 0 ? <p className={styles.typography.body}>Nenhum trampo encontrado para esses filtros.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b-2 border-black"><th className="p-2">Trampo / Vaga</th><th className="p-2">Contratante</th><th className="p-2">Data</th><th className="p-2">Status</th><th className="p-2 text-right">Bruto</th><th className="p-2 text-right">Comissão</th><th className="p-2 text-right">Líquido</th></tr></thead><tbody>{ganhos.map((g: any) => <tr key={g.id} className="border-b"><td className="p-2 font-bold">#{g.vaga_id || g.id} {g.vaga_titulo || ''}<div className="text-xs font-normal opacity-60">{g.funcao || ''} · {g.cidade_nome || ''}</div></td><td className="p-2">{g.contratante_nome || `#${g.contratante_id || ''}`}</td><td className="p-2">{g.data_fim ? new Date(g.data_fim).toLocaleDateString() : g.data_inicio ? new Date(g.data_inicio).toLocaleDateString() : g.criado_em ? new Date(g.criado_em).toLocaleDateString() : ''}</td><td className="p-2">{g.status}</td><td className="p-2 text-right">{fmt(g.valor_bruto)}</td><td className="p-2 text-right text-red-600">- {fmt(g.comissao)}</td><td className="p-2 text-right font-black text-green-700">{fmt(g.valor_liquido)}</td></tr>)}</tbody></table></div>}</div>}
  </div>);
}
