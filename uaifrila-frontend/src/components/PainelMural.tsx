import { useEffect, useState } from 'react';
import { apiGetPublic, apiFetch, getToken } from '../utils/Api';
import { calcularDistanciaKm, formatarDistancia } from '../utils/distancia';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

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
// Dias e horários da vaga, agrupados por dia. Sem turnos, cai para data/hora única.
function renderDiasHorarios(vaga: any, dt: Date | null, hora: string) {
  if (Array.isArray(vaga.turnos) && vaga.turnos.length) {
    const g: Record<string, any[]> = {};
    for (const x of vaga.turnos) {
      const k = String(x.data).slice(0, 10);
      (g[k] = g[k] || []).push(x);
    }
    return Object.keys(g).sort().map((d) => {
      const [y, mo, dd] = d.split('-').map(Number);
      const dt2 = new Date(y, mo - 1, dd);
      const turnos = g[d].map((x: any) => `${String(x.hora_inicio).slice(0, 5)}–${String(x.hora_fim).slice(0, 5)} (R$ ${(Number(x.valor_servico) || 0).toFixed(2)})`).join(' • ');
      return (
        <div key={d} className="font-black capitalize">
          {dt2.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })} — {turnos}
        </div>
      );
    });
  }
  return (
    <>
      <div className="font-black">{dt ? dt.toLocaleDateString('pt-BR') : '—'}</div>
      {hora && <div className={styles.typography.caption}>às {hora}</div>}
    </>
  );
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
        // Filtro 2: tira vagas com início < hoje (defesa no front; backend também filtra)
        const futuras = arr.filter(inicioValido);
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
  const [candidatandoForm, setCandidatandoForm] = useState<number | null>(null);
  const [mensagemPorVaga, setMensagemPorVaga] = useState<Record<number, string>>({});
  const candidatar = async (vagaId: number, mensagem?: string) => {
    if (!getToken()) { setMsg('Faça login como Freela para se candidatar.'); return; }
    if (!podeCandidatar) { setMsg('Só Freela/DUAL pode se candidatar.'); return; }
    setCandidatando(vagaId); setMsg('');
    try {
      await apiFetch('/api/candidaturas', { method: 'POST', body: JSON.stringify({ vaga_id: vagaId, mensagem: (mensagem || '').slice(0, 500) || undefined }) });
      // Vaga ja candidatada sai do Mural (regra do backend): ela passa a ser
      // acompanhada em Meus Trampos.
      setVagas(prev => prev.filter(v => v.id !== vagaId));
      setMsg('Candidatura enviada! Acompanhe em Meus Trampos.'); setCandidatandoForm(null);
    } catch (e: any) { setMsg(e.message || 'Não foi possível candidatar'); } finally { setCandidatando(null); }
  };
  if (loading) return <div className={styles.pageContainer}><div className={styles.card}>Carregando mural...</div></div>;
  if (erro) return <div className={styles.pageContainer}><div className={styles.errorBox}>ERRO MURAL: {erro}</div></div>;
  return (<div className={styles.pageContainer}>
    <div className="flex items-center justify-between mb-6"><h1 className={styles.typography.h1}>Mural de Vagas ({vagas.length})</h1><span className={styles.badge('success')}>Público</span></div>
    {msg && <div className={styles.cardSmall + ' mb-4'}><p className={styles.typography.body}>{msg}</p></div>}
    <div className="grid gap-4">{vagas.map((vaga: any) => {
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
                {renderDiasHorarios(vaga, dt, hora)}
              </div>
              <div><div className={styles.typography.caption}>Função</div><div className="font-black">{vaga.funcao || '—'}</div></div>
              <div><div className={styles.typography.caption}>Vagas</div><div className="font-black">{Number(vaga.quantidade_vagas ?? 1)} vaga(s) • {Number(vaga.preenchidas ?? 0)} preenchida(s) • {Number(vaga.restantes ?? vaga.quantidade_vagas ?? 1)} restante(s)</div></div>
              {vaga.data_limite_candidatura && <div><div className={styles.typography.caption}>Candidaturas até</div><div className="font-black">{new Date(vaga.data_limite_candidatura).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div></div>}
              {distanciaTexto && <div><div className={styles.typography.caption}>Distância</div><div className="font-black">📍 {distanciaTexto} de você</div></div>}
            </div>
          );
        })()}
        <div className="mt-4 flex flex-wrap gap-2">
          {podeCandidatar && !ehMinha && !ja && candidatandoForm !== vaga.id && (<button onClick={() => setCandidatandoForm(vaga.id)} className={styles.buttonPrimary(false)}>Candidatar-se</button>)}
          {podeCandidatar && !ehMinha && !ja && candidatandoForm === vaga.id && (
            <div className={styles.cardSmall + ' w-full'}>
              <label className={styles.label}>Mensagem para o contratante (opcional)</label>
              <textarea value={mensagemPorVaga[vaga.id] || ''} onChange={(e) => setMensagemPorVaga((prev) => ({ ...prev, [vaga.id]: e.target.value }))} maxLength={500} rows={2} className={styles.input} placeholder="Ex.: Já trabalhei em casamentos, chego 1h antes." />
              <div className="flex gap-2 mt-2">
                <button disabled={candidatando === vaga.id} onClick={() => candidatar(vaga.id, mensagemPorVaga[vaga.id])} className={styles.buttonPrimary(candidatando === vaga.id)}>{candidatando === vaga.id ? 'Enviando...' : 'Enviar candidatura'}</button>
                <button onClick={() => setCandidatandoForm(null)} className={styles.buttonSecondary}>Voltar</button>
              </div>
            </div>
          )}
          {ehMinha && vaga.permite_editar !== false && (<button onClick={() => editarVaga(vaga)} className={styles.buttonWarning}>Editar</button>)}
          {ehMinha && vaga.permite_cancelar !== false && (<button disabled={cancelando === vaga.id} onClick={() => cancelarVaga(vaga.id)} className={styles.buttonDanger}>{cancelando === vaga.id ? 'Cancelando...' : 'Cancelar vaga'}</button>)}
        </div>
        {ehMinha && <span className={styles.badge('default') + ' mt-4 inline-block'}>Sua vaga</span>}
        {!podeCandidatar && usuario && <span className={styles.typography.caption + ' mt-4 block'}>Só Freela/DUAL pode se candidatar.</span>}
        {!usuario && <span className={styles.typography.caption + ' mt-4 block'}>Faça login como Freela para se candidatar.</span>}
      </div>);
    })}{vagas.length === 0 && (<div className={styles.cardSmall}><p className={styles.typography.body}>Nenhuma vaga no mural - publique uma vaga!</p></div>)}</div>
  </div>);
}
export default PainelMural;
