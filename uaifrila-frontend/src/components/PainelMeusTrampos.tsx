import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

// Meus Trampos — duas secoes, conforme o tipo:
// - Vagas que publiquei (CONTRATANTE e DUAL): com Editar vaga e Cancelar vaga.
// - Minhas candidaturas (FREELA e DUAL): a vaga sai do mural e vem para ca.
//   PENDENTE = "Pendente de aprovação de candidatura", com botao CANCELAR a candidatura.
//   Cancelar faz a vaga voltar a aparecer no mural.
function getUsuario() {
  try { const raw = localStorage.getItem('uaifrila_usuario'); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function fmtReais(v: any): string {
  const n = Number(v);
  return `R$ ${isNaN(n) ? '0,00' : n.toFixed(2).replace('.', ',')}`;
}
function rotuloCandidatura(s: string): string {
  const x = String(s || '').toUpperCase();
  if (x === 'PENDENTE') return 'Pendente de aprovação de candidatura';
  if (x === 'ACEITA') return 'Aprovada — aguardando início';
  if (x === 'EM_ANALISE') return 'Em análise';
  if (x === 'REJEITADA' || x === 'RECUSADA') return 'Não aprovada';
  if (x === 'CANCELADA') return 'Cancelada';
  return s || '—';
}
export default function PainelMeusTrampos({ usuario: usuarioProp, setTelaAtiva }: { usuario?: any; setTelaAtiva?: (t: string) => void }) {
  const styles = useUaiFrilaStyles();
  const [vagas, setVagas] = useState<any[]>([]);
  const [candidaturas, setCandidaturas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [cancelandoCand, setCancelandoCand] = useState<any | null>(null);
  const [cancelandoCandId, setCancelandoCandId] = useState<number | null>(null);
  const [cancelandoVaga, setCancelandoVaga] = useState<any | null>(null);
  const [cancelandoVagaId, setCancelandoVagaId] = useState<number | null>(null);

  const usuario = usuarioProp || getUsuario();
  const tipoChave = String(usuario?.tipo_chave || usuario?.tipo?.chave || 'FREELA').toUpperCase();
  const mostraPublicadas = tipoChave !== 'FREELA';
  const mostraCandidaturas = tipoChave !== 'CONTRATANTE';

  const carregar = async () => {
    setCarregando(true); setErro('');
    try {
      const [rv, rc] = await Promise.allSettled([apiFetch('/api/vagas/minhas'), apiFetch('/api/candidaturas/minhas')]);
      if (rv.status === 'fulfilled') { const d: any = rv.value; const lista = d.vagas || d.data || d || []; setVagas(Array.isArray(lista) ? lista : []); }
      if (rc.status === 'fulfilled') { const d: any = rc.value; const lista = d.candidaturas || d.data || d || []; setCandidaturas(Array.isArray(lista) ? lista : []); }
      if (rv.status === 'rejected' && rc.status === 'rejected') setErro('Não foi possível carregar Meus Trampos.');
    } catch (e: any) { setErro(e.message); } finally { setCarregando(false); }
  };
  useEffect(() => { carregar(); }, []);

  const editarVaga = (vaga: any) => {
    localStorage.setItem('uaifrila_vaga_editar', JSON.stringify(vaga));
    if (setTelaAtiva) setTelaAtiva('publicar');
  };
  const confirmarCancelarVaga = async (vaga: any) => {
    setCancelandoVagaId(vaga.id); setMsg('');
    try {
      await apiFetch(`/api/vagas/${vaga.id}/cancelar`, { method: 'PUT', body: JSON.stringify({ motivo: cancelandoVaga?.motivo || 'Cancelada pelo contratante' }) });
      setVagas(prev => prev.filter(v => v.id !== vaga.id));
      setMsg('Vaga cancelada.');
      setCancelandoVaga(null);
    } catch (e: any) { setMsg(e.message || 'Não foi possível cancelar a vaga'); } finally { setCancelandoVagaId(null); }
  };
  const confirmarCancelarCandidatura = async (cand: any) => {
    if (!cand.id) { setMsg('Não foi possível identificar sua candidatura.'); return; }
    const precisaMotivo = String(cand.status || '').toUpperCase() === 'ACEITA';
    if (precisaMotivo && !String(cancelandoCand?.motivo || '').trim()) { setMsg('Informe o motivo do cancelamento.'); return; }
    setCancelandoCandId(cand.id); setMsg('');
    try {
      await apiFetch(`/api/candidaturas/${cand.id}/cancelar`, { method: 'POST', body: JSON.stringify({ motivo: cancelandoCand?.motivo || 'Cancelado pelo freela' }) });
      setCandidaturas(prev => prev.filter(c => c.id !== cand.id));
      setMsg('Candidatura cancelada. A vaga volta a aparecer no mural.');
      setCancelandoCand(null);
    } catch (e: any) { setMsg(e.message || 'Não foi possível cancelar'); } finally { setCancelandoCandId(null); }
  };

  if (carregando) return <div className={styles.pageContainer}><div className={styles.card}>Carregando meus trampos...</div></div>;
  return (
    <div className={styles.pageContainer}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={styles.typography.h1}>Meus Trampos</h2>
        <button onClick={carregar} className={styles.buttonSecondary}>Recarregar</button>
      </div>
      {erro && <div className={styles.errorBox}>{erro}</div>}
      {msg && <div className={styles.cardSmall + ' mb-4'}><p className={styles.typography.body}>{msg}</p></div>}

      {mostraPublicadas && (
        <div className={styles.card + ' mb-4'}>
          <h2 className={styles.typography.h1}>Vagas que publiquei ({vagas.length})</h2>
          {vagas.length === 0 ? (
            <div className={`${styles.cardSmall} text-center mt-4`}><p className={styles.typography.body}>Você ainda não publicou nenhuma vaga</p><p className={styles.typography.caption}>Vá em Publicar Vaga - seu endereço ativo já vem marcado automaticamente</p></div>
          ) : (
            <div className="space-y-3 mt-4">{vagas.map((v: any) => {
              const totalPagar = v.valor_total_pagar ?? v.calculo?.contratante_paga ?? (Number(v.valor_servico || 0) + Number(v.valor_transporte || 0));
              return (
                <div key={v.id} className={styles.cardSmall}>
                  <div className="flex justify-between"><h3 className={styles.typography.h3}>{v.titulo || v.funcao} #{v.id}</h3><span className={styles.badge(v.status === 'ABERTA' ? 'success' : 'default')}>{v.status}</span></div>
                  <p className={styles.typography.bodySmall}>{v.descricao?.slice(0, 100)}</p>
                  <p className={styles.typography.caption}>{v.cidade_nome || ''} • {v.endereco || ''} • Total {fmtReais(totalPagar)}</p>
                  {cancelandoVaga?.id === v.id ? (
                    <div className="space-y-2 mt-3">
                      <p className={styles.typography.body}>Cancelar esta vaga?</p>
                      <input value={cancelandoVaga.motivo || ''} onChange={(e) => setCancelandoVaga({ ...cancelandoVaga, motivo: e.target.value })} className={styles.input} placeholder="Motivo (opcional)" />
                      <div className="flex gap-2">
                        <button onClick={() => confirmarCancelarVaga(v)} disabled={cancelandoVagaId === v.id} className={styles.buttonPrimary(cancelandoVagaId === v.id)}>{cancelandoVagaId === v.id ? 'Cancelando...' : 'Confirmar cancelamento'}</button>
                        <button onClick={() => setCancelandoVaga(null)} className={styles.buttonSecondary}>Voltar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => editarVaga(v)} className={styles.buttonSecondary}>Editar vaga</button>
                      <button onClick={() => setCancelandoVaga({ id: v.id, motivo: '' })} className={styles.buttonSecondary}>Cancelar vaga</button>
                    </div>
                  )}
                </div>
              );
            })}</div>
          )}
        </div>
      )}

      {mostraCandidaturas && (
        <div className={styles.card}>
          <h2 className={styles.typography.h1}>Minhas candidaturas ({candidaturas.length})</h2>
          {candidaturas.length === 0 ? (
            <div className={`${styles.cardSmall} text-center mt-4`}><p className={styles.typography.body}>Você ainda não se candidatou a nenhuma vaga</p><p className={styles.typography.caption}>Veja o mural e candidate-se a uma vaga disponível.</p></div>
          ) : (
            <div className="space-y-3 mt-4">{candidaturas.map((c: any) => {
              const titulo = c.vaga_titulo || c.titulo || `Vaga #${c.vaga_id}`;
              const aReceber = c.valor_a_receber ?? c.calculo?.valor_a_receber ?? c.vaga_valor_servico;
              const aceita = String(c.status || '').toUpperCase() === 'ACEITA';
              return (
                <div key={c.id} className={styles.cardSmall}>
                  <div className="flex justify-between"><h3 className={styles.typography.h3}>{titulo}</h3><span className={styles.badge('warning')}>{rotuloCandidatura(c.status)}</span></div>
                  <p className={styles.typography.bodySmall}>{(c.vaga_descricao || '').slice(0, 100)}</p>
                  <p className={styles.typography.caption}>{c.vaga_data_inicio ? new Date(c.vaga_data_inicio).toLocaleDateString() : ''} • Você recebe {fmtReais(aReceber)}</p>
                  {String(c.status || '').toUpperCase() === 'PENDENTE' || aceita || String(c.status || '').toUpperCase() === 'EM_ANALISE' ? (
                    cancelandoCand?.id === c.id ? (
                      <div className="space-y-2 mt-3">
                        <p className={styles.typography.body}>Cancelar sua candidatura{titulo ? ` para "${titulo}"` : ''}?</p>
                        {aceita && (<input value={cancelandoCand.motivo || ''} onChange={(e) => setCancelandoCand({ ...cancelandoCand, motivo: e.target.value })} className={styles.input} placeholder="Motivo do cancelamento (obrigatório quando já aceito)" />)}
                        <div className="flex gap-2">
                          <button onClick={() => confirmarCancelarCandidatura(c)} disabled={cancelandoCandId === c.id} className={styles.buttonPrimary(cancelandoCandId === c.id)}>{cancelandoCandId === c.id ? 'Cancelando...' : 'Confirmar cancelamento'}</button>
                          <button onClick={() => setCancelandoCand(null)} className={styles.buttonSecondary}>Voltar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3"><button onClick={() => setCancelandoCand({ id: c.id, motivo: '' })} className={styles.buttonSecondary}>Cancelar candidatura</button></div>
                    )
                  ) : null}
                </div>
              );
            })}</div>
          )}
        </div>
      )}
    </div>
  );
}
