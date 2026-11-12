import { useEffect, useState } from 'react';
import { apiGetPublic, apiFetch, getToken } from '../utils/Api';
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
export function PainelMural({ usuario }: { usuario?: any }) {
  const styles = useUaiFrilaStyles();
  const [vagas, setVagas] = useState<any[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [candidatando, setCandidatando] = useState<number | null>(null);
  const [cancelando, setCancelando] = useState<any | null>(null);
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const tipo = getTipo(usuario);
  const podeCandidatar = ['FREELA', 'DUAL'].includes(tipo);
  useEffect(() => {
    let mounted = true;
    const carregar = async () => {
      try {
        setLoading(true); setErro(null);
        let data;
        try { data = await apiGetPublic('/api/vagas/mural'); } catch { data = await apiGetPublic('/api/vagas/abertas'); }
        const lista = data?.vagas || data?.data || data?.mural || data || [];
        const arr = Array.isArray(lista) ? lista : [];
        // Filtro 2: tira vagas com início < hoje (defesa no front; backend também filtra)
        const futuras = arr.filter(inicioValido);
        if (mounted) setVagas(futuras);
      } catch (e: any) { if (mounted) setErro(e.message); } finally { if (mounted) setLoading(false); }
    };
    carregar();
    return () => { mounted = false; };
  }, []);
  const candidatar = async (vagaId: number) => {
    if (!getToken()) { setMsg('Faça login como Freela para se candidatar.'); return; }
    if (!podeCandidatar) { setMsg('Só Freela/DUAL pode se candidatar.'); return; }
    setCandidatando(vagaId); setMsg('');
    try {
      const res: any = await apiFetch('/api/candidaturas', { method: 'POST', body: JSON.stringify({ vaga_id: vagaId }) });
      // Guarda a candidatura COM o id (vem no res.data) — sem ele o botao de
      // cancelar nao saberia o que cancelar. Antes era so { status: 'PENDENTE' }.
      const cand = res?.data || res?.candidatura || { status: 'PENDENTE' };
      setVagas(prev => prev.map(v => v.id === vagaId ? { ...v, minhaCandidatura: cand, minha_candidatura: cand, ja_candidatou: true, ja_candidatado: true, candidatura_status: cand.status || 'PENDENTE' } : v));
      setMsg('Candidatura enviada! Acompanhe em Meus Trampos.');
    } catch (e: any) { setMsg(e.message || 'Não foi possível candidatar'); } finally { setCandidatando(null); }
  };
  const confirmarCancelar = async (vaga: any) => {
    const candId = cancelando?.candidaturaId || vaga.minhaCandidatura?.id || vaga.minha_candidatura?.id;
    if (!candId) { setMsg('Não foi possível identificar sua candidatura.'); return; }
    if (cancelando?.precisaMotivo && !String(cancelando?.motivo || '').trim()) { setMsg('Informe o motivo do cancelamento.'); return; }
    setCancelandoId(vaga.id); setMsg('');
    try {
      await apiFetch(`/api/candidaturas/${candId}/cancelar`, { method: 'POST', body: JSON.stringify({ motivo: cancelando?.motivo || 'Cancelado pelo freela' }) });
      setVagas(prev => prev.map(v => v.id === vaga.id ? { ...v, minhaCandidatura: null, minha_candidatura: null, ja_candidatou: false, ja_candidatado: false, candidatou: false, candidatura_status: null } : v));
      setMsg('Candidatura cancelada. Você pode se candidatar de novo se quiser.');
      setCancelando(null);
    } catch (e: any) { setMsg(e.message || 'Não foi possível cancelar'); } finally { setCancelandoId(null); }
  };
  if (loading) return <div className={styles.pageContainer}><div className={styles.card}>Carregando mural...</div></div>;
  if (erro) return <div className={styles.pageContainer}><div className={styles.errorBox}>ERRO MURAL: {erro}</div></div>;
  return (<div className={styles.pageContainer}>
    <div className="flex items-center justify-between mb-6"><h1 className={styles.typography.h1}>Mural de Vagas ({vagas.length})</h1><span className={styles.badge('success')}>Público</span></div>
    {msg && <div className={styles.cardSmall + ' mb-4'}><p className={styles.typography.body}>{msg}</p></div>}
    <div className="grid gap-4">{vagas.map((vaga: any) => {
      const ehMinha = usuario && Number(vaga.contratante_id) === Number(usuario.id);
      // O backend devolve snake_case: minha_candidatura / ja_candidatado.
      // Antes o front so checava camelCase (minhaCandidatura / ja_candidatou),
      // que nunca vinha — o botao ficava sempre em "Candidatar-se" e o clique
      // caia no 500 "Você já se candidatou para esta vaga".
      const minhaCand = vaga.minhaCandidatura || vaga.minha_candidatura || null;
      const ja = !!(minhaCand || vaga.ja_candidatou || vaga.ja_candidatado || vaga.candidatou);
      const candStatus = String(vaga.candidatura_status || minhaCand?.status || '').toUpperCase();
      const podeCancelar = vaga.pode_cancelar_candidatura !== false;
      const motivoBloqueio = vaga.motivo_cancelar_bloqueado || '';
      return (<div key={vaga.id} className={styles.card}>
        <div className="flex justify-between items-start"><h3 className={styles.typography.h2}>{vaga.titulo || vaga.funcao}</h3><span className={styles.badge('warning')}>{vaga.status || vaga.status_chave || 'ABERTA'}</span></div>
        <p className={`${styles.typography.body} mt-2`}>{vaga.descricao}</p>
        <div className={`${styles.valorBox} mt-3`}><span>R$ {vaga.valor_total || vaga.valor_servico || vaga.valor || 0}</span><span>{vaga.cidade_nome || vaga.cidade || ''} / {vaga.estado_sigla || vaga.estado || ''}</span><span>{vaga.data_inicio ? new Date(vaga.data_inicio).toLocaleDateString() : ''}</span><span>{vaga.funcao || ''}</span></div>
        {podeCandidatar && !ehMinha && !ja && (<button disabled={candidatando === vaga.id} onClick={() => candidatar(vaga.id)} className={styles.buttonPrimary(candidatando === vaga.id) + ' mt-4'}>{candidatando === vaga.id ? 'Enviando...' : 'Candidatar-se'}</button>)}
        {podeCandidatar && !ehMinha && ja && !podeCancelar && (<span className={styles.typography.caption + ' mt-4 block'}>{motivoBloqueio || 'Não é possível cancelar esta candidatura.'}</span>)}
        {podeCandidatar && !ehMinha && ja && podeCancelar && cancelando?.vagaId === vaga.id && (
          <div className={styles.cardSmall + ' mt-4 space-y-2'}>
            <p className={styles.typography.body}>Cancelar sua candidatura{vaga.titulo ? ` para "${vaga.titulo}"` : ''}?</p>
            {candStatus === 'ACEITA' && (<input value={cancelando.motivo || ''} onChange={(e) => setCancelando({ ...cancelando, motivo: e.target.value })} className={styles.input} placeholder="Motivo do cancelamento (obrigatório quando já aceito)" />)}
            <div className="flex gap-2">
              <button onClick={() => confirmarCancelar(vaga)} disabled={cancelandoId === vaga.id} className={styles.buttonPrimary(cancelandoId === vaga.id)}>{cancelandoId === vaga.id ? 'Cancelando...' : 'Confirmar cancelamento'}</button>
              <button onClick={() => setCancelando(null)} className={styles.buttonSecondary}>Voltar</button>
            </div>
          </div>
        )}
        {podeCandidatar && !ehMinha && ja && podeCancelar && cancelando?.vagaId !== vaga.id && (<button onClick={() => setCancelando({ vagaId: vaga.id, candidaturaId: minhaCand?.id, precisaMotivo: candStatus === 'ACEITA', motivo: '' })} disabled={!minhaCand?.id} className={styles.buttonSecondary + ' mt-4'}>{minhaCand?.id ? 'Cancelar candidatura' : 'Já candidatou ✓'}</button>)}
        {ehMinha && <span className={styles.badge('default') + ' mt-4 inline-block'}>Sua vaga</span>}
        {!podeCandidatar && usuario && <span className={styles.typography.caption + ' mt-4 block'}>Só Freela/DUAL pode se candidatar.</span>}
        {!usuario && <span className={styles.typography.caption + ' mt-4 block'}>Faça login como Freela para se candidatar.</span>}
      </div>);
    })}{vagas.length === 0 && (<div className={styles.cardSmall}><p className={styles.typography.body}>Nenhuma vaga no mural - publique uma vaga!</p></div>)}</div>
  </div>);
}
export default PainelMural;
