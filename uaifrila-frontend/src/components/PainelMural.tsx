import { useEffect, useState } from 'react';
import { apiGetPublic, apiFetch, getToken } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

// Mural
// - COM token: o backend personaliza — tira as vagas em que ja me candidatei
//   (elas passam a viver em Meus Trampos) e CONTRATANTE (so) ve so as proprias.
//   ANTES usava apiGetPublic (sem token): o backend nunca sabia quem era o
//   usuario e nunca devolvia minha_candidatura — o botao nunca mudava.
// - Preco por usuario: quem criou a vaga ve o TOTAL (servico + transporte);
//   os demais veem o VALOR A RECEBER (mesma regra de exibicao do freela).
// - Dono da vaga: Editar vaga + Cancelar vaga (antes so aparecia "Sua vaga").
function getTipo(usuario: any): string {
  if (!usuario) return 'VISITANTE';
  if (usuario.tipo_chave) return String(usuario.tipo_chave).toUpperCase();
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
function fmtReais(v: any): string {
  const n = Number(v);
  return `R$ ${isNaN(n) ? '0,00' : n.toFixed(2).replace('.', ',')}`;
}
export function PainelMural({ usuario, setTelaAtiva }: { usuario?: any; setTelaAtiva?: (t: string) => void }) {
  const styles = useUaiFrilaStyles();
  const [vagas, setVagas] = useState<any[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [candidatando, setCandidatando] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [cancelandoVaga, setCancelandoVaga] = useState<any | null>(null);
  const [cancelandoVagaId, setCancelandoVagaId] = useState<number | null>(null);
  const tipo = getTipo(usuario);
  const podeCandidatar = ['FREELA', 'DUAL'].includes(tipo);
  useEffect(() => {
    let mounted = true;
    const carregar = async () => {
      try {
        setLoading(true); setErro(null);
        let data;
        try { data = await apiFetch('/api/vagas/mural'); }
        catch { try { data = await apiGetPublic('/api/vagas/mural'); } catch { data = await apiGetPublic('/api/vagas/abertas'); } }
        const lista = data?.vagas || data?.data || data?.mural || data || [];
        const arr = Array.isArray(lista) ? lista : [];
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
      await apiFetch('/api/candidaturas', { method: 'POST', body: JSON.stringify({ vaga_id: vagaId }) });
      // Saiu do mural: passa a viver em Meus Trampos.
      setVagas(prev => prev.filter(v => v.id !== vagaId));
      setMsg('Candidatura enviada! A vaga saiu do mural e está em Meus Trampos.');
    } catch (e: any) { setMsg(e.message || 'Não foi possível candidatar'); } finally { setCandidatando(null); }
  };
  const editarVaga = (vaga: any) => {
    localStorage.setItem('uaifrila_vaga_editar', JSON.stringify(vaga));
    if (setTelaAtiva) setTelaAtiva('publicar');
    // Fallback: mesmo sem a prop, a edicao esta salva e o Navbar NAO a apaga
    // mais — basta abrir Publicar Vaga pelo menu que a edicao abre.
    else setMsg('Edição salva — abra Publicar Vaga no menu para editar.');
  };
  const confirmarCancelarVaga = async (vaga: any) => {
    setCancelandoVagaId(vaga.id); setMsg('');
    try {
      await apiFetch(`/api/vagas/${vaga.id}/cancelar`, { method: 'POST', body: JSON.stringify({ motivo: cancelandoVaga?.motivo || 'Cancelada pelo contratante' }) });
      setVagas(prev => prev.filter(v => v.id !== vaga.id));
      setMsg('Vaga cancelada.');
      setCancelandoVaga(null);
    } catch (e: any) { setMsg(e.message || 'Não foi possível cancelar a vaga'); } finally { setCancelandoVagaId(null); }
  };
  if (loading) return <div className={styles.pageContainer}><div className={styles.card}>Carregando mural...</div></div>;
  if (erro) return <div className={styles.pageContainer}><div className={styles.errorBox}>ERRO MURAL: {erro}</div></div>;
  return (<div className={styles.pageContainer}>
    <div className="flex items-center justify-between mb-6"><h1 className={styles.typography.h1}>Mural de Vagas ({vagas.length})</h1><span className={styles.badge('success')}>Público</span></div>
    {msg && <div className={styles.cardSmall + ' mb-4'}><p className={styles.typography.body}>{msg}</p></div>}
    <div className="grid gap-4">{vagas.map((vaga: any) => {
      const ehMinha = usuario && Number(vaga.contratante_id) === Number(usuario.id);
      // Preco conforme quem ve: dono = TOTAL (servico + transporte); demais = VALOR A RECEBER.
      const totalPagar = vaga.valor_total_pagar ?? vaga.calculo?.contratante_paga ?? (Number(vaga.valor_servico || 0) + Number(vaga.valor_transporte || 0));
      const aReceber = vaga.valor_a_receber ?? vaga.calculo?.valor_a_receber ?? vaga.valor_servico;
      return (<div key={vaga.id} className={styles.card}>
        <div className="flex justify-between items-start"><h3 className={styles.typography.h2}>{vaga.titulo || vaga.funcao}</h3><span className={styles.badge('warning')}>{vaga.status || vaga.status_chave || 'ABERTA'}</span></div>
        <p className={`${styles.typography.body} mt-2`}>{vaga.descricao}</p>
        <div className={`${styles.valorBox} mt-3`}><span>{ehMinha ? `Total ${fmtReais(totalPagar)}` : `Você recebe ${fmtReais(aReceber)}`}</span><span>{vaga.cidade_nome || vaga.cidade || ''} / {vaga.estado_sigla || vaga.estado || ''}</span><span>{vaga.data_inicio ? new Date(vaga.data_inicio).toLocaleDateString() : ''}</span><span>{vaga.funcao || ''}</span></div>
        {ehMinha && cancelandoVaga?.id !== vaga.id && (<div className="flex gap-2 mt-4">
          <button onClick={() => editarVaga(vaga)} className={styles.buttonSecondary}>Editar vaga</button>
          <button onClick={() => setCancelandoVaga({ id: vaga.id, motivo: '' })} className={styles.buttonSecondary}>Cancelar vaga</button>
        </div>)}
        {ehMinha && cancelandoVaga?.id === vaga.id && (
          <div className={styles.cardSmall + ' mt-4 space-y-2'}>
            <p className={styles.typography.body}>Cancelar esta vaga{vaga.titulo ? ` "${vaga.titulo}"` : ''}?</p>
            <input value={cancelandoVaga.motivo || ''} onChange={(e) => setCancelandoVaga({ ...cancelandoVaga, motivo: e.target.value })} className={styles.input} placeholder="Motivo (opcional)" />
            <div className="flex gap-2">
              <button onClick={() => confirmarCancelarVaga(vaga)} disabled={cancelandoVagaId === vaga.id} className={styles.buttonPrimary(cancelandoVagaId === vaga.id)}>{cancelandoVagaId === vaga.id ? 'Cancelando...' : 'Confirmar cancelamento'}</button>
              <button onClick={() => setCancelandoVaga(null)} className={styles.buttonSecondary}>Voltar</button>
            </div>
          </div>
        )}
        {ehMinha && <span className={styles.badge('default') + ' mt-4 inline-block'}>Sua vaga</span>}
        {podeCandidatar && !ehMinha && (<button disabled={candidatando === vaga.id} onClick={() => candidatar(vaga.id)} className={styles.buttonPrimary(candidatando === vaga.id) + ' mt-4'}>{candidatando === vaga.id ? 'Enviando...' : 'Candidatar-se'}</button>)}
        {!podeCandidatar && usuario && !ehMinha && <span className={styles.typography.caption + ' mt-4 block'}>Só Freela/DUAL pode se candidatar.</span>}
        {!usuario && <span className={styles.typography.caption + ' mt-4 block'}>Faça login como Freela para se candidatar.</span>}
      </div>);
    })}{vagas.length === 0 && (<div className={styles.cardSmall}><p className={styles.typography.body}>Nenhuma vaga no mural - publique uma vaga!</p></div>)}</div>
  </div>);
}
export default PainelMural;
