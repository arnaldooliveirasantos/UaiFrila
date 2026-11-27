import React, { useMemo, useState } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import { apiFetch } from '../utils/Api';
import { WizardNavegacao } from './WizardEtapas';
// Tela SEPARADA de agenda da vaga: dias + periodos + valor POR TURNO.
// A TelaCadastroVaga abre esta tela e volta com as escolhas (onConfirmar).
// REGRA: candidatura e TUDO-OU-NADA (todos os dias). O valor por turno serve
// so para o acerto em caso de IMPREVISTO (freela nao pode continuar).
// Turno que passa da meia-noite pertence ao dia em que COMECA.
export type Turno = { data: string; hora_inicio: string; hora_fim: string; valor_servico: number; valor_transporte?: number };
const PRESETS = [
  { nome: 'Manhã', inicio: '08:00', fim: '12:00' },
  { nome: 'Tarde', inicio: '13:00', fim: '18:00' },
  { nome: 'Noite', inicio: '18:00', fim: '00:00' },
  { nome: 'Madrugada', inicio: '00:00', fim: '06:00' },
  { nome: 'Dia todo', inicio: '08:00', fim: '18:00' },
];

const paraMin = (h: string) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
const duracaoMin = (hi: string, hf: string) => { const d = paraMin(hf) - paraMin(hi); return d <= 0 ? d + 1440 : d; };
const fmtData = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); const dt = new Date(y, m - 1, d); return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }); };
const fmtHoras = (min: number) => { const h = Math.floor(min / 60); const mm = min % 60; return mm ? `${h}h${String(mm).padStart(2, '0')}` : `${h}h`; };
function agrupar(turnos: Turno[]): Record<string, Turno[]> { const g: Record<string, Turno[]> = {}; for (const t of turnos) { (g[t.data] = g[t.data] || []).push({ ...t }); } for (const k of Object.keys(g)) g[k].sort((a, b) => paraMin(a.hora_inicio) - paraMin(b.hora_inicio)); return g; }
export default function TelaAgendaVaga({ turnosIniciais = [], onConfirmar, onCancelar, etapas, etapa, antecedenciaMinutos = 30 }: { turnosIniciais?: Turno[]; onConfirmar: (t: Turno[]) => void; onCancelar: () => void; etapas?: string[]; etapa?: number; antecedenciaMinutos?: number }) {
  const ETAPAS_AGENDA = etapas || ['O que é a vaga', 'Dias e turnos', 'Endereço e valores', 'Revisão'];
  const ETAPA_AGENDA = etapa ?? 1;
  const styles = useUaiFrilaStyles();
  const [porDia, setPorDia] = useState<Record<string, Turno[]>>(() => agrupar(turnosIniciais));
  const [mesCursor, setMesCursor] = useState(() => { const p = Object.keys(agrupar(turnosIniciais))[0]; if (p) { const [y, m] = p.split('-').map(Number); return { y, m: m - 1 }; } const h = new Date(); return { y: h.getFullYear(), m: h.getMonth() }; });
  const [novoInicio, setNovoInicio] = useState('18:00');
  const [novoFim, setNovoFim] = useState('00:00');
  const [novoValor, setNovoValor] = useState('150');
  const [novoTransporte, setNovoTransporte] = useState('15');
  const [valorTodos, setValorTodos] = useState('');
  const [valorTransporteTodos, setValorTransporteTodos] = useState('');
  // Rascunho do período PERSONALIZADO de cada dia (início/fim/valor próprios).
  // O "Adicionar a todos" continua usando novoInicio/novoFim/novoValor — nada muda nele.
  const [customDia, setCustomDia] = useState<Record<string, { inicio: string; fim: string; valor: string; transporte?: string }>>({});
  const draftDia = (d: string) => customDia[d] || { inicio: '18:00', fim: '00:00', valor: '', transporte: '' };
  const setDraftDia = (d: string, patch: Partial<{ inicio: string; fim: string; valor: string; transporte?: string }>) => setCustomDia((c) => ({ ...c, [d]: { ...draftDia(d), ...patch } }));
  const adicionarCustomNoDia = (d: string) => {
    const r = draftDia(d);
    // Valor em branco = usa o valor do campo "Adicionar a todos" (novoValor).
    adicionarNoDia(d, r.inicio, r.fim, Number((r.valor || novoValor).replace(',', '.')) || 0, Number((r.transporte || novoTransporte).replace(',', '.')) || 0);
  };
  const [erro, setErro] = useState('');
  const dias = useMemo(() => Object.keys(porDia).sort(), [porDia]);
  const totalHorasMin = useMemo(() => Object.values(porDia).flat().reduce((s, t) => s + duracaoMin(t.hora_inicio, t.hora_fim), 0), [porDia]);
  const totalValor = useMemo(() => Object.values(porDia).flat().reduce((s, t) => s + Number(t.valor_servico || 0), 0), [porDia]);
  const totalTransporte = useMemo(() => Object.values(porDia).flat().reduce((s, t) => s + Number(t.valor_transporte || 0), 0), [porDia]);
  const totalTurnos = useMemo(() => Object.values(porDia).flat().length, [porDia]);
  // Dias anteriores a hoje: NAO selecionaveis (botao desabilitado + toggle travado).
  const hojeDt = new Date();
  const hojeISO = `${hojeDt.getFullYear()}-${String(hojeDt.getMonth() + 1).padStart(2, '0')}-${String(hojeDt.getDate()).padStart(2, '0')}`;
  const toggleDia = (iso: string) => { if (iso < hojeISO) return; setPorDia((p) => { const n = { ...p }; if (n[iso]) delete n[iso]; else n[iso] = []; return n; }); };
  const adicionarParaTodos = (inicio: string, fim: string, valor: number, transporte = 0) => {
    if (!dias.length) { setErro('Selecione pelo menos um dia no calendário.'); return; }
    if (duracaoMin(inicio, fim) < 30) { setErro('Período mínimo de 30 minutos.'); return; }
    setErro('');
    setPorDia((p) => { const n: Record<string, Turno[]> = {}; for (const d of dias) { const ja = (p[d] || []).some((x) => x.hora_inicio === inicio && x.hora_fim === fim); n[d] = ja ? p[d] : [...(p[d] || []), { data: d, hora_inicio: inicio, hora_fim: fim, valor_servico: valor, valor_transporte: transporte }].sort((a, b) => paraMin(a.hora_inicio) - paraMin(b.hora_inicio)); } return n; });
  };
  const adicionarNoDia = (dia: string, inicio: string, fim: string, valor: number, transporte = 0) => {
    if (duracaoMin(inicio, fim) < 30) { setErro('Período mínimo de 30 minutos.'); return; }
    setErro('');
    setPorDia((p) => { const lista = p[dia] || []; if (lista.some((x) => x.hora_inicio === inicio && x.hora_fim === fim)) { setErro('Esse período já existe neste dia.'); return p; } return { ...p, [dia]: [...lista, { data: dia, hora_inicio: inicio, hora_fim: fim, valor_servico: valor, valor_transporte: transporte }].sort((a, b) => paraMin(a.hora_inicio) - paraMin(b.hora_inicio)) }; });
  };
  const removerTurno = (dia: string, idx: number) => setPorDia((p) => ({ ...p, [dia]: p[dia].filter((_, i) => i !== idx) }));
  const alterarValor = (dia: string, idx: number, valor: number) => setPorDia((p) => ({ ...p, [dia]: p[dia].map((x, i) => i === idx ? { ...x, valor_servico: valor } : x) }));
  const alterarTransporte = (dia: string, idx: number, transporte: number) => setPorDia((p) => ({ ...p, [dia]: p[dia].map((x, i) => i === idx ? { ...x, valor_transporte: transporte } : x) }));
  const aplicarTransporteTodos = () => { const v = Number(valorTransporteTodos.replace(',', '.')); if (v < 0 || isNaN(v)) { setErro('Informe um transporte válido para aplicar a todos.'); return; } setErro(''); setPorDia((p) => { const n: Record<string, Turno[]> = {}; for (const d of Object.keys(p)) n[d] = p[d].map((x) => ({ ...x, valor_transporte: v })); return n; }); };
  const aplicarValorTodos = () => { const v = Number(valorTodos.replace(',', '.')); if (!v || v < 0) { setErro('Informe um valor válido para aplicar a todos.'); return; } setErro(''); setPorDia((p) => { const n: Record<string, Turno[]> = {}; for (const d of Object.keys(p)) n[d] = p[d].map((t) => ({ ...t, valor_servico: v })); return n; }); };
  const confirmar = async () => {
    if (!dias.length) { setErro('Selecione pelo menos um dia.'); return; }
    const vazios = dias.filter((d) => !(porDia[d] || []).length);
    if (vazios.length) { setErro(`Falta período em: ${vazios.map(fmtData).join(', ')}`); return; }
    const todos: Turno[] = dias.flatMap((d) => porDia[d]).sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : paraMin(a.hora_inicio) - paraMin(b.hora_inicio)));
    // Validacao desta etapa (campos obrigatorios da agenda):
    const semValor = todos.filter((x) => !(Number(x.valor_servico) > 0));
    if (semValor.length) { setErro('Todo turno precisa de valor do serviço maior que R$ 0.'); return; }
    const curto = todos.filter((x) => duracaoMin(x.hora_inicio, x.hora_fim) < 30);
    if (curto.length) { setErro('Todo turno precisa de pelo menos 30 minutos.'); return; }
    const inicioWall = `${todos[0].data}T${todos[0].hora_inicio}`;
    const agora = new Date(); agora.setMinutes(agora.getMinutes() + antecedenciaMinutos);
    if (new Date(inicioWall) < agora) { setErro(`Entrada deve ser > agora + ${antecedenciaMinutos}min`); return; }
    // NADA e salvo aqui: sem PUT /api/vagas/:id/turnos. Os turnos vao no
    // payload unico do publicar, na etapa Revisao (onConfirmar so devolve).
    onConfirmar(todos);
  };
  // Calendario do mes em exibicao (semana comeca na segunda)
  const celulas = useMemo(() => {
    const primeiro = new Date(mesCursor.y, mesCursor.m, 1);
    const inicioSemana = (primeiro.getDay() + 6) % 7; // 0 = segunda
    const diasNoMes = new Date(mesCursor.y, mesCursor.m + 1, 0).getDate();
    const arr: (string | null)[] = [];
    for (let i = 0; i < inicioSemana; i++) arr.push(null);
    for (let d = 1; d <= diasNoMes; d++) arr.push(`${mesCursor.y}-${String(mesCursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    return arr;
  }, [mesCursor]);
  const nomeMes = new Date(mesCursor.y, mesCursor.m, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.typography.h1}>Dias e horários da vaga</h1>
      <p className={styles.typography.body + ' mt-2'}>Toque nos dias no calendário, depois escolha os períodos. O turno que passa da meia-noite conta no dia em que começa.</p>
      {erro && <div className={styles.errorBox + ' mt-4'}>{erro}</div>}
      <div className="flex flex-wrap gap-2 mt-4">
      </div>
      <div className={styles.card + ' mt-4'}>
        <div className="flex items-center justify-between">
          <button disabled={mesCursor.y === hojeDt.getFullYear() && mesCursor.m === hojeDt.getMonth()} onClick={() => setMesCursor((c) => c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 })} className={styles.buttonGhost}>‹ Anterior</button>
          <p className={styles.typography.h3 + ' capitalize'}>{nomeMes}</p>
          <button onClick={() => setMesCursor((c) => c.m === 11 ? { y: c.y + 1, m: 0 } : { ...c, m: c.m + 1 })} className={styles.buttonGhost}>Próximo ›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 mt-3 text-center">
          {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((s) => <p key={s} className={styles.typography.caption}>{s}</p>)}
          {celulas.map((iso, i) => iso === null ? <span key={i} /> : (() => { const sel = !!porDia[iso]; const qtd = (porDia[iso] || []).length; const passado = iso < hojeISO; return (
            <button key={iso} disabled={passado} title={passado ? 'Dia passado — não é possível selecionar' : undefined} onClick={() => toggleDia(iso)} className={`py-2 rounded-lg text-sm font-bold ${passado ? 'opacity-30 cursor-not-allowed line-through' : sel ? 'bg-green-600 text-white' : styles.isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
              {Number(iso.slice(-2))}{sel && <span className="block text-[10px] font-normal">{qtd ? `${qtd} turno${qtd > 1 ? 's' : ''}` : 'sem turno'}</span>}
            </button>); })())}
        </div>
        <p className={styles.typography.caption + ' mt-2'}>Dia verde = selecionado. Dia selecionado sem turno aparece como "sem turno" — adicione um período abaixo.</p>
      </div>
      <div className={styles.card + ' mt-4'}>
        <p className={styles.typography.h3}>Período para todos os dias selecionados</p>
        <p className={styles.typography.caption + ' mt-1'}>Um toque adiciona o período em todos os dias. Depois ajuste cada dia abaixo, se precisar.</p>
        <div className="flex flex-wrap gap-2 mt-3">{PRESETS.map((p) => <button key={p.nome} onClick={() => adicionarParaTodos(p.inicio, p.fim, Number(novoValor) || 0, Number(novoTransporte.replace(',', '.')) || 0)} className={styles.badge('warning')}>{p.nome} {p.inicio}–{p.fim}</button>)}</div>
        <div className="flex flex-wrap items-end gap-2 mt-3">
          <div><label className={styles.label}>Início</label><input type="time" value={novoInicio} onChange={(e) => setNovoInicio(e.target.value)} className={styles.input} /></div>
          <div><label className={styles.label}>Fim</label><input type="time" value={novoFim} onChange={(e) => setNovoFim(e.target.value)} className={styles.input} /></div>
          <div><label className={styles.label}>Valor por turno R$</label><input inputMode="decimal" value={novoValor} onChange={(e) => setNovoValor(e.target.value.replace(/[^0-9.,]/g, ''))} className={styles.input} /></div>
          <div><label className={styles.label}>Transporte por turno R$</label><input inputMode="decimal" value={novoTransporte} onChange={(e) => setNovoTransporte(e.target.value.replace(/[^0-9.,]/g, ''))} className={styles.input} /></div>
          <button onClick={() => adicionarParaTodos(novoInicio, novoFim, Number(novoValor.replace(',', '.')) || 0, Number(novoTransporte.replace(',', '.')) || 0)} className={styles.buttonSecondary}>Adicionar a todos</button>
        </div>
        <div className="flex flex-wrap items-end gap-2 mt-3">
          <div><label className={styles.label}>Aplicar valor R$ a todos os turnos</label><input inputMode="decimal" value={valorTodos} onChange={(e) => setValorTodos(e.target.value.replace(/[^0-9.,]/g, ''))} placeholder="Ex.: 150" className={styles.input} /></div>
          <button onClick={aplicarValorTodos} className={styles.buttonSecondary}>Aplicar valor a todos</button>
          <div><label className={styles.label}>Aplicar transporte R$ a todos os turnos</label><input inputMode="decimal" value={valorTransporteTodos} onChange={(e) => setValorTransporteTodos(e.target.value.replace(/[^0-9.,]/g, ''))} placeholder="Ex.: 15" className={styles.input} /></div>
          <button onClick={aplicarTransporteTodos} className={styles.buttonSecondary}>Aplicar transporte a todos</button>
        </div>
      </div>
      {dias.length > 0 && <div className="mt-4 grid gap-4">{dias.map((d) => (
        <div key={d} className={styles.cardSmall}>
          <div className="flex justify-between items-center"><p className={styles.typography.body + ' font-black capitalize'}>{fmtData(d)}</p><button onClick={() => toggleDia(d)} className={styles.buttonGhost}>Remover dia</button></div>
          {(porDia[d] || []).length === 0 && <p className={styles.typography.bodySmall + ' mt-2'}>Sem turno ainda — adicione um período para este dia.</p>}
          {(porDia[d] || []).map((t, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-2 mt-2">
              <span className={styles.badge('default')}>{t.hora_inicio}–{t.hora_fim}</span>
              <span className={styles.typography.caption}>{fmtHoras(duracaoMin(t.hora_inicio, t.hora_fim))}{duracaoMin(t.hora_inicio, t.hora_fim) > 0 && paraMin(t.hora_fim) <= paraMin(t.hora_inicio) ? ' • atravessa a meia-noite' : ''}</span>
              <label className={styles.label + ' ml-auto'}>Valor do turno R$</label>
              <input inputMode="decimal" value={String(t.valor_servico)} onChange={(e) => alterarValor(d, idx, Number(e.target.value.replace(',', '.')) || 0)} className={styles.input + ' w-28'} />
              <label className={styles.label}>Transporte R$</label>
              <input inputMode="decimal" value={String(t.valor_transporte ?? 0)} onChange={(e) => alterarTransporte(d, idx, Number(e.target.value.replace(',', '.')) || 0)} className={styles.input + ' w-28'} />
              <button onClick={() => removerTurno(d, idx)} className={styles.buttonGhost}>✕</button>
            </div>))}
          <div className="flex flex-wrap gap-2 mt-3">{PRESETS.map((p) => <button key={p.nome} onClick={() => adicionarNoDia(d, p.inicio, p.fim, Number(novoValor) || 0, Number(novoTransporte.replace(',', '.')) || 0)} className={styles.badge('default')}>+ {p.nome}</button>)}</div>
          <div className="flex flex-wrap items-end gap-2 mt-3">
            <div><label className={styles.label}>Início deste dia</label><input type="time" value={draftDia(d).inicio} onChange={(e) => setDraftDia(d, { inicio: e.target.value })} className={styles.input} /></div>
            <div><label className={styles.label}>Fim deste dia</label><input type="time" value={draftDia(d).fim} onChange={(e) => setDraftDia(d, { fim: e.target.value })} className={styles.input} /></div>
            <div><label className={styles.label}>Valor deste turno R$</label><input inputMode="decimal" value={draftDia(d).valor} onChange={(e) => setDraftDia(d, { valor: e.target.value.replace(/[^0-9.,]/g, '') })} placeholder={novoValor || 'Ex.: 150'} className={styles.input} /></div>
            <div><label className={styles.label}>Transporte deste turno R$</label><input inputMode="decimal" value={draftDia(d).transporte || ''} onChange={(e) => setDraftDia(d, { transporte: e.target.value.replace(/[^0-9.,]/g, '') })} placeholder={novoTransporte || 'Ex.: 15'} className={styles.input} /></div>
            <button onClick={() => adicionarCustomNoDia(d)} className={styles.buttonSecondary}>Adicionar neste dia</button>
          </div>
        </div>))}
      </div>}
      <div className={styles.cardSmall + ' mt-4'}>
        <p className={styles.typography.h3}>Resumo</p>
        <p className={styles.typography.body + ' mt-1'}>{dias.length} dia{dias.length === 1 ? '' : 's'} • {totalTurnos} turno{totalTurnos === 1 ? '' : 's'} • {fmtHoras(totalHorasMin)} no total • Transporte total R$ {totalTransporte.toFixed(2)}</p>
        <p className={styles.typography.body + ' font-black'}>Valor total do serviço: R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        <p className={styles.typography.caption + ' mt-1'}>A candidatura vale para todos os dias. O valor por turno só é usado no acerto se houver imprevisto e o freela não puder continuar.</p>
      </div>
      <WizardNavegacao etapas={ETAPAS_AGENDA} etapa={ETAPA_AGENDA} onVoltar={onCancelar} onAvancar={confirmar} onFinalizar={confirmar} avancarLabel="Continuar →" finalizarLabel="Continuar →" carregando={false} podeFinalizar={dias.length > 0} />
    </div>);
}
