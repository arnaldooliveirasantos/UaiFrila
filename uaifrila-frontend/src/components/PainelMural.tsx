import { useEffect, useState } from 'react';
import { apiGetPublic, apiFetch, getToken } from '../utils/Api';
import { calcularDistanciaKm, formatarDistancia } from '../utils/Distancia';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

// Mural - CORRIGIDO + Patch 20 (filtro + ordenação):
// - Filtro: busca por texto, função, cidade, valor mínimo/máximo,
//   data a partir de, distância máxima (só aparece com endereço ativo).
// - Ordenação: mais próximas no tempo, maior valor, menor valor,
//   mais perto de você, A–Z. Padrão: mais próximas no tempo.
// - Tudo filtra no front, sobre as vagas já carregadas (sem endpoint novo).
// Mural - CORRIGIDO:
// 1. Botão Candidatar para FREELA/DUAL (antes não tinha botão nenhum - a lista era só leitura).
//    Chama POST /api/candidaturas { vaga_id } com token. Sem token -> pede login.
//    Se já candidatou (minhaCandidatura) -> botão "Já candidatou" desabilitado.
//    Se a vaga é minha (contratante_id === meu id) -> não mostra Candidatar.
// 2. Vagas com início anterior a hoje NÃO aparecem (antes apareciam todas).
//    Filtro no front (defesa) + no backend (VagaService.listarMuralParaUsuario).
//    Compara só a DATA (ignora hora): hoje = new Date() zerado.
function getTipo(usuario: any): string {
  if (!usuario) return 'VISITANTE';
  if (usuario.tipo_chave) return String(usuario.tipo_chave).toUpperCase();
  if (usuario.tipo?.chave) return String(usuario.tipo.chave).toUpperCase();
  if (usuario.tipo_usuario_id === 1) return 'FREELA';
  if (usuario.tipo_usuario_id === 2) return 'CONTRATANTE';
  if (usuario.tipo_usuario_id === 3) return 'DUAL';
  return 'FREELA';
}
function inicioValido(vaga: any): boolean {
  const d = vaga.data_inicio || vaga.dataInicio;
  if (!d) return true;
  const inicio = new Date(d); inicio.setHours(0, 0, 0, 0);
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return inicio.getTime() >= hoje.getTime();
}
export function PainelMural({ usuario, setTelaAtiva }: { usuario?: any; setTelaAtiva?: (t: string) => void }) {
  const styles = useUaiFrilaStyles();
  const [vagas, setVagas] = useState<any[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [candidatando, setCandidatando] = useState<number | null>(null);
  const [cancelando, setCancelando] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  // Endereco ATIVO do usuario (lat/lng): referencia da distancia de cada vaga.
  const [meuEndereco, setMeuEndereco] = useState<any>(null);
  // Patch 20 — filtro + ordenação (tudo no front, sem endpoint novo).
  const [busca, setBusca] = useState('');
  const [filtroFuncao, setFiltroFuncao] = useState('');
  const [filtroCidade, setFiltroCidade] = useState('');
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [dataAPartirDe, setDataAPartirDe] = useState('');
  const [distanciaMax, setDistanciaMax] = useState('');
  const [ordenacao, setOrdenacao] = useState<'tempo' | 'maior-valor' | 'menor-valor' | 'distancia' | 'az'>('tempo');
  const [filtroAberto, setFiltroAberto] = useState(true);

  const valorVaga = (v: any): number => Number(v.valor_total ?? v.valor_servico ?? v.valor ?? 0);
  const cidadeVaga = (v: any): string => [v.cidade_nome || v.cidade || '', v.cidade_estado || ''].filter(Boolean).join(' - ');
  const distanciaVaga = (v: any): number | null =>
    calcularDistanciaKm(meuEndereco?.latitude, meuEndereco?.longitude, v.endereco_latitude, v.endereco_longitude);
  const limparFiltros = () => {
    setBusca(''); setFiltroFuncao(''); setFiltroCidade(''); setValorMin(''); setValorMax('');
    setDataAPartirDe(''); setDistanciaMax(''); setOrdenacao('tempo');
  };
  const filtroAtivo = !!(busca || filtroFuncao || filtroCidade || valorMin || valorMax || dataAPartirDe || distanciaMax || ordenacao !== 'tempo');

  // Opções dos selects: vêm das próprias vagas carregadas (sem endpoint novo).
  const funcoesDisponiveis = Array.from(new Set(vagas.map((v: any) => String(v.funcao || '').trim()).filter(Boolean))).sort();
  const cidadesDisponiveis = Array.from(new Set(vagas.map((v: any) => cidadeVaga(v)).filter(Boolean))).sort();

  const vagasFiltradas = (() => {
    const texto = busca.trim().toLowerCase();
    const min = valorMin === '' ? null : Number(valorMin);
    const max = valorMax === '' ? null : Number(valorMax);
    const aPartir = dataAPartirDe ? new Date(dataAPartirDe + 'T00:00:00') : null;
    const distMax = distanciaMax === '' ? null : Number(distanciaMax);
    const filtradas = vagas.filter((v: any) => {
      if (texto) {
        const hay = `${v.titulo || ''} ${v.descricao || ''} ${v.funcao || ''} ${cidadeVaga(v)} ${v.bairro || ''}`.toLowerCase();
        if (!hay.includes(texto)) return false;
      }
      if (filtroFuncao && String(v.funcao || '') !== filtroFuncao) return false;
      if (filtroCidade && cidadeVaga(v) !== filtroCidade) return false;
      const valor = valorVaga(v);
      if (min !== null && !Number.isNaN(min) && valor < min) return false;
      if (max !== null && !Number.isNaN(max) && valor > max) return false;
      if (aPartir) {
        const d = v.data_inicio ? new Date(v.data_inicio) : null;
        if (d && d < aPartir) return false;
      }
      if (distMax !== null && !Number.isNaN(distMax)) {
        const dist = distanciaVaga(v);
        if (dist === null || dist > distMax) return false;
      }
      return true;
    });
    const porTempo = (a: any, b: any) => {
      const da = a.data_inicio ? new Date(a.data_inicio).getTime() : 0;
      const db = b.data_inicio ? new Date(b.data_inicio).getTime() : 0;
      return da - db;
    };
    return [...filtradas].sort((a: any, b: any) => {
      if (ordenacao === 'maior-valor') return valorVaga(b) - valorVaga(a);
      if (ordenacao === 'menor-valor') return valorVaga(a) - valorVaga(b);
      if (ordenacao === 'distancia') {
        const da = distanciaVaga(a); const db = distanciaVaga(b);
        if (da === null && db === null) return porTempo(a, b);
        if (da === null) return 1;
        if (db === null) return -1;
        return da - db;
      }
      if (ordenacao === 'az') return String(a.titulo || a.funcao || '').localeCompare(String(b.titulo || b.funcao || ''), 'pt-BR');
      return porTempo(a, b);
    });
  })();
  const tipo = getTipo(usuario);
  const podeCandidatar = ['FREELA', 'DUAL'].includes(tipo);
  useEffect(() => {
    let mounted = true;
    const carregar = async () => {
      try {
        setLoading(true); setErro(null);
        let data;
        data = await apiGetPublic('/api/vagas/abertas');
        const lista = data?.vagas || data?.data || data?.mural || data || [];
        const arr = Array.isArray(lista) ? lista : [];
        // Filtro 2: tira vagas com início < hoje (defesa no front; backend também filtra).
        // REGRA DO DONO: a vaga do criador nunca some — o filtro de data não
        // tira a vaga própria, nem depois que o trampo já começou/passou.
        // Patch 20: vaga JÁ CANDIDATADA pelo usuário NÃO volta para o Mural.
        // Antes o front só escondia o botão ("Já candidatou") e a vaga continuava
        // na lista; ao recarregar, ela reaparecia. Agora ela é excluída aqui,
        // junto com o filtro de data (a vaga própria continua aparecendo).
        const ehMinha = (v: any) => usuario && Number(v.contratante_id) === Number(usuario.id);
        const jaCandidatei = (v: any) => !!(v.minha_candidatura || v.minhaCandidatura || v.ja_candidatou);
        const futuras = arr.filter((v: any) =>
          (inicioValido(v) || ehMinha(v)) && !(jaCandidatei(v) && !ehMinha(v)));
        if (mounted) setVagas(futuras);
      } catch (e: any) { if (mounted) setErro(e.message); } finally { if (mounted) setLoading(false); }
    };
    carregar();
    // Endereco ativo do usuario (so logado): a distancia de cada vaga e
    // calculada no front a partir dele. Sem token ou sem endereco ativo,
    // o Mural nao exibe distancia.
    if (getToken()) {
      apiFetch('/api/enderecos/meus').then((d: any) => {
        const lista = d?.enderecos || d?.data || [];
        const arr = Array.isArray(lista) ? lista : [];
        const ativo = arr.find((e: any) => e.ativo === true || e.ativo === 1) || null;
        if (mounted) setMeuEndereco(ativo);
      }).catch(() => {});
    }
    return () => { mounted = false; };
  }, []);
  // Editar: a TelaCadastroVaga le esta chave no mount e abre em modo edicao.
  // Nenhum botao escrevia a chave — por isso o Editar nao existia no Mural.
  const editarVaga = (vaga: any) => {
    localStorage.setItem('uaifrila_vaga_editar', JSON.stringify(vaga));
    if (setTelaAtiva) setTelaAtiva('publicar');
    else setMsg('Não foi possível abrir a edição.');
  };
  const cancelarVaga = async (vagaId: number) => {
    if (!window.confirm('Cancelar esta vaga? Ela sai do mural.')) return;
    setCancelando(vagaId); setMsg('');
    try {
      await apiFetch(`/api/vagas/${vagaId}/cancelar`, { method: 'PUT' });
      setVagas(prev => prev.filter(v => v.id !== vagaId));
      setMsg('Vaga cancelada.');
    } catch (e: any) { setMsg(e.message || 'Não foi possível cancelar a vaga'); } finally { setCancelando(null); }
  };
  const candidatar = async (vagaId: number) => {
    if (!getToken()) { setMsg('Faça login como Freela para se candidatar.'); return; }
    if (!podeCandidatar) { setMsg('Só Freela/DUAL pode se candidatar.'); return; }
    setCandidatando(vagaId); setMsg('');
    try {
      await apiFetch('/api/candidaturas', { method: 'POST', body: JSON.stringify({ vaga_id: vagaId }) });
      // Vaga ja candidatada sai do Mural (regra do backend): ela passa a ser
      // acompanhada em Meus Trampos.
      setVagas(prev => prev.filter(v => v.id !== vagaId));
      setMsg('Candidatura enviada! Acompanhe em Meus Trampos.');
    } catch (e: any) { setMsg(e.message || 'Não foi possível candidatar'); } finally { setCandidatando(null); }
  };
  // Bloco "Dias e horários" de uma vaga. Fica FORA do JSX: o agrupamento dos
  // turnos por dia estava dentro de um IIFE no meio do JSX (linha 128) e o
  // parser do Babel quebrava com "Adjacent JSX elements must be wrapped".
  // Com turnos: uma linha por dia (dia + horários com valor). Sem turnos:
  // cai para a data/hora única da vaga (compatibilidade com vagas antigas).
  // Normaliza a data do turno para YYYY-MM-DD, seja ela string, Date ou ISO.
  // Sem isso, "Thu Nov 19 ..." vira NaN e o card mostra "Invalid Date".
  const dataTurnoISO = (v: any): string => {
    if (!v) return '';
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    const s = String(v);
    const m = s.match(/^\d{4}-\d{2}-\d{2}/);
    if (m) return m[0];
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return '';
  };
  const diasHorarios = (vaga: any, dt: Date | null, hora: string) => {
    // Aceita turnos em snake_case (API), camelCase ou string JSON.
    let turnos: any[] = [];
    const bruto = vaga.turnos ?? vaga.vaga_turnos;
    if (Array.isArray(bruto)) turnos = bruto;
    else if (typeof bruto === 'string') { try { const p = JSON.parse(bruto); if (Array.isArray(p)) turnos = p; } catch {} }
    if (turnos.length) {
      const g: Record<string, any[]> = {};
      for (const x of turnos) {
        const d = dataTurnoISO(x.data ?? x.dia);
        if (!d) continue;
        if (d) (g[d] = g[d] || []).push(x);
      }
      const dias = Object.keys(g).sort();
      if (dias.length) {
        return dias.map((d) => {
          const [y, m, dd] = d.split('-').map(Number);
          const dt2 = new Date(y, m - 1, dd);
          return (<div key={d} className="font-black capitalize">{dt2.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })} — {g[d].map((x: any) => `${String(x.hora_inicio ?? x.horaInicio ?? x.inicio ?? '').slice(0, 5)}–${String(x.hora_fim ?? x.horaFim ?? x.fim ?? '').slice(0, 5)} (R$ ${(Number(x.valor_servico ?? x.valorServico ?? x.valor ?? 0) || 0).toFixed(2)})`).join(' • ')}</div>);
        });
      }
    }
    // Sem turnos: fallback mostra o INTERVALO (antes mostrava so o 1o dia).
    const fim = vaga.data_fim ? new Date(vaga.data_fim) : null;
    if (dt && fim && dt.toDateString() !== fim.toDateString()) {
      return (<div><div className="font-black">{dt.toLocaleDateString('pt-BR')} — {fim.toLocaleDateString('pt-BR')}</div>{hora && <div className={styles.typography.caption}>a partir das {hora}</div>}</div>);
    }
    return (<div><div className="font-black">{dt ? dt.toLocaleDateString('pt-BR') : '—'}</div>{hora && <div className={styles.typography.caption}>às {hora}</div>}</div>);
  };
  if (loading) return <div className={styles.pageContainer}><div className={styles.card}>Carregando mural...</div></div>;
  if (erro) return <div className={styles.pageContainer}><div className={styles.errorBox}>ERRO MURAL: {erro}</div></div>;
  const inputCls = "w-full border-2 border-zinc-300 bg-white text-black px-3 py-2 text-[13px] font-bold placeholder:text-zinc-400 focus:outline-none focus:border-black";
  const labelCls = "block text-[10px] font-black uppercase text-zinc-500 mb-1";
  return (<div className={styles.pageContainer}>
    <div className="flex items-center justify-between mb-4"><h1 className={styles.typography.h1}>Mural de Vagas ({vagasFiltradas.length}{filtroAtivo ? ` de ${vagas.length}` : ''})</h1><span className={styles.badge('success')}>Público</span></div>
    {msg && <div className={styles.cardSmall + ' mb-4'}><p className={styles.typography.body}>{msg}</p></div>}
    {/* Patch 20 — filtro + ordenação do Mural. */}
    <div className={styles.cardSmall + ' mb-4'}>
      <button onClick={() => setFiltroAberto(!filtroAberto)} className="w-full flex items-center justify-between text-left">
        <span className="text-[12px] font-black uppercase">🔍 Filtrar vagas{filtroAtivo ? ' • filtro ativo' : ''}</span>
        <span className="text-[12px] font-black">{filtroAberto ? '▾' : '▸'}</span>
      </button>
      {filtroAberto && (
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <label className={labelCls}>Buscar</label>
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Título, descrição, função, cidade, bairro..." className={inputCls} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Função</label>
              <select value={filtroFuncao} onChange={(e) => setFiltroFuncao(e.target.value)} className={inputCls}>
                <option value="">Todas as funções</option>
                {funcoesDisponiveis.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Cidade</label>
              <select value={filtroCidade} onChange={(e) => setFiltroCidade(e.target.value)} className={inputCls}>
                <option value="">Todas as cidades</option>
                {cidadesDisponiveis.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Ordenar por</label>
              <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value as any)} className={inputCls}>
                <option value="tempo">Mais próximas no tempo</option>
                <option value="maior-valor">Maior valor</option>
                <option value="menor-valor">Menor valor</option>
                <option value="distancia">Mais perto de você</option>
                <option value="az">Título (A–Z)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Valor mínimo (R$)</label>
              <input type="number" min="0" value={valorMin} onChange={(e) => setValorMin(e.target.value)} placeholder="Ex.: 100" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Valor máximo (R$)</label>
              <input type="number" min="0" value={valorMax} onChange={(e) => setValorMax(e.target.value)} placeholder="Ex.: 1000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>A partir de</label>
              <input type="date" value={dataAPartirDe} onChange={(e) => setDataAPartirDe(e.target.value)} className={inputCls} />
            </div>
            {meuEndereco && (
              <div>
                <label className={labelCls}>Distância máxima</label>
                <select value={distanciaMax} onChange={(e) => setDistanciaMax(e.target.value)} className={inputCls}>
                  <option value="">Qualquer distância</option>
                  <option value="5">Até 5 km</option>
                  <option value="10">Até 10 km</option>
                  <option value="25">Até 25 km</option>
                  <option value="50">Até 50 km</option>
                </select>
              </div>
            )}
          </div>
          {filtroAtivo && (
            <div>
              <button onClick={limparFiltros} className="text-[11px] font-black uppercase border-2 border-zinc-300 px-3 py-2 bg-white text-black">✕ Limpar filtros</button>
            </div>
          )}
        </div>
      )}
    </div>
    <div className="grid gap-4">{vagasFiltradas.map((vaga: any) => {
      const ehMinha = usuario && Number(vaga.contratante_id) === Number(usuario.id);
      // Campo real da API: minha_candidatura (antes lia minhaCandidatura/ja_candidatou,
      // que nao existem na resposta — o botao nunca virava "Ja candidatou").
      const ja = !!vaga.minha_candidatura;
      return (<div key={vaga.id} className={styles.card}>
        <div className="flex justify-between items-start"><h3 className={styles.typography.h2}>{vaga.titulo || vaga.funcao}</h3><span className={styles.badge('warning')}>{vaga.status || vaga.status_chave || 'ABERTA'}</span></div>
        <p className={`${styles.typography.body} mt-2`}>{vaga.descricao}</p>
        {(() => {
          const valor = Number(vaga.valor_total ?? vaga.valor_servico ?? vaga.valor ?? 0);
          const cidade = [vaga.cidade_nome || vaga.cidade || '', vaga.cidade_estado || ''].filter(Boolean).join(' - ');
          const dt = vaga.data_inicio ? new Date(vaga.data_inicio) : null;
          const hora = dt && (dt.getHours() !== 0 || dt.getMinutes() !== 0) ? dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
          // Distancia: calculada AQUI no front (Haversine) entre o endereco ativo
          // do usuario e o endereco da vaga. Sem coordenada dos dois lados,
          // o item nao aparece.
          const distancia = calcularDistanciaKm(meuEndereco?.latitude, meuEndereco?.longitude, vaga.endereco_latitude, vaga.endereco_longitude);
          const distanciaTexto = formatarDistancia(distancia);
          return (
            <div className={`${styles.valorBox} mt-3 grid grid-cols-2 md:grid-cols-3 gap-3`}>
              <div><div className={styles.typography.caption}>Você recebe</div><div className="font-black">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></div>
              <div><div className={styles.typography.caption}>Cidade</div><div className="font-black">{cidade || '—'}</div>{vaga.bairro && <div className={styles.typography.caption}>{vaga.bairro}</div>}</div>
              <div className="col-span-2 md:col-span-3"><div className={styles.typography.caption}>Dias e horários</div>
                {diasHorarios(vaga, dt, hora)}
              </div>
              <div><div className={styles.typography.caption}>Função</div><div className="font-black">{vaga.funcao || '—'}</div></div>
              {distanciaTexto && <div><div className={styles.typography.caption}>Distância</div><div className="font-black">📍 {distanciaTexto} de você</div></div>}
            </div>
          );
        })()}
        <div className="mt-4 flex flex-wrap gap-2">
          {podeCandidatar && !ehMinha && !ja && vaga.permite_candidatar !== false && (<button disabled={candidatando === vaga.id} onClick={() => candidatar(vaga.id)} className={styles.buttonPrimary(candidatando === vaga.id)}>{candidatando === vaga.id ? 'Enviando...' : 'Candidatar-se'}</button>)}
          {ehMinha && vaga.permite_editar !== false && (<button onClick={() => editarVaga(vaga)} className={styles.buttonWarning}>Editar</button>)}
          {ehMinha && vaga.permite_cancelar !== false && (<button disabled={cancelando === vaga.id} onClick={() => cancelarVaga(vaga.id)} className={styles.buttonDanger}>{cancelando === vaga.id ? 'Cancelando...' : 'Cancelar vaga'}</button>)}
        </div>
        {ehMinha && <span className={styles.badge('default') + ' mt-4 inline-block'}>Sua vaga</span>}
        {!podeCandidatar && usuario && <span className={styles.typography.caption + ' mt-4 block'}>Só Freela/DUAL pode se candidatar.</span>}
        {!usuario && <span className={styles.typography.caption + ' mt-4 block'}>Faça login como Freela para se candidatar.</span>}
      </div>);
    })}{vagasFiltradas.length === 0 && (<div className={styles.cardSmall}><p className={styles.typography.body}>{filtroAtivo ? 'Nenhuma vaga com esse filtro — ajuste ou limpe os filtros.' : 'Nenhuma vaga no mural - publique uma vaga!'}</p></div>)}</div>
  </div>);
}
export default PainelMural;
