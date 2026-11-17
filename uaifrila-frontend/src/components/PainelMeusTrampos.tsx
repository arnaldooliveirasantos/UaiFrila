import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

// Meus Trampos — duas secoes, conforme o tipo:
// - Vagas que publiquei (CONTRATANTE e DUAL): Editar/Cancelar só aparecem se
//   status_vaga.permite_editar / permite_cancelar forem true (vêm do /api/vagas/minhas).
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
  if (x === 'SELECIONADO') return 'Selecionado — confirme para garantir a vaga';
  if (x === 'LISTA_ESPERA') return 'Lista de espera';
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
  // Turnos do trampo (candidatura ACEITA): carregados sob demanda por candidatura.
  const [turnosDados, setTurnosDados] = useState<Record<number, any>>({});
  const [carregandoTurnosId, setCarregandoTurnosId] = useState<number | null>(null);
  const [acaoTurnoId, setAcaoTurnoId] = useState<number | null>(null);
  // Fases 1 e 4: avaliações pendentes, confirmar/recusar seleção, presença, conversa.
  const [avaliacoesPendentes, setAvaliacoesPendentes] = useState<any[]>([]);
  const [avaliando, setAvaliando] = useState<Record<number, { nota: number; comentario: string }>>({});
  const [enviandoAvaliacaoId, setEnviandoAvaliacaoId] = useState<number | null>(null);
  const [acaoSelecaoId, setAcaoSelecaoId] = useState<number | null>(null);
  const [presencaId, setPresencaId] = useState<number | null>(null);
  const [conversaAberta, setConversaAberta] = useState<Record<number, { conversaId: number; mensagens: any[] }>>({});
  const [novaMensagem, setNovaMensagem] = useState<Record<number, string>>({});
  const carregarTurnos = async (cand: any) => {
    if (turnosDados[cand.id]) { setTurnosDados((p) => { const n = { ...p }; delete n[cand.id]; return n; }); return; }
    setCarregandoTurnosId(cand.id);
    try {
      const d: any = await apiFetch(`/api/trampos/por-candidatura/${cand.id}`);
      setTurnosDados((p) => ({ ...p, [cand.id]: d.data || d }));
    } catch (e: any) { setMsg(e.message || 'Não foi possível carregar os turnos'); } finally { setCarregandoTurnosId(null); }
  };
  const acaoTurno = async (cand: any, turno: any, acao: 'checkin' | 'checkout' | 'falta' | 'confirmar') => {
    setAcaoTurnoId(turno.id);
    try { await apiFetch(`/api/trampo-turnos/${turno.id}/${acao}`, { method: 'PUT' }); await carregarTurnosFechado(cand); }
    catch (e: any) { setMsg(e.message || 'Não foi possível atualizar o turno'); } finally { setAcaoTurnoId(null); }
  };
  const carregarTurnosFechado = async (cand: any) => {
    try { const d: any = await apiFetch(`/api/trampos/por-candidatura/${cand.id}`); setTurnosDados((p) => ({ ...p, [cand.id]: d.data || d })); } catch {}
  };
  const cancelarRestantes = async (cand: any) => {
    const dados = turnosDados[cand.id];
    if (!dados?.trampo?.id) return;
    if (!window.confirm('Não vou continuar (imprevisto): cancelar os turnos restantes? Os turnos já concluídos continuam pagos.')) return;
    setAcaoTurnoId(-1);
    try { await apiFetch(`/api/trampos/${dados.trampo.id}/turnos/cancelar-restantes`, { method: 'PUT', body: JSON.stringify({ motivo: 'Imprevisto' }) }); await carregarTurnosFechado(cand); setMsg('Turnos restantes cancelados. O acerto considera só os turnos concluídos.'); }
    catch (e: any) { setMsg(e.message || 'Não foi possível cancelar os turnos restantes'); } finally { setAcaoTurnoId(null); }
  };

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
      try { const da: any = await apiFetch('/api/avaliacoes/pendentes'); const la = da?.data || da || []; setAvaliacoesPendentes(Array.isArray(la) ? la : []); } catch {}
    } catch (e: any) { setErro(e.message); } finally { setCarregando(false); }
  };
  useEffect(() => { carregar(); }, []);

  const acaoSelecao = async (cand: any, acao: 'confirmar-selecao' | 'recusar-selecao') => {
    setAcaoSelecaoId(cand.id); setMsg('');
    try {
      await apiFetch(`/api/candidaturas/${cand.id}/${acao}`, { method: 'POST', body: JSON.stringify({ motivo: acao === 'recusar-selecao' ? 'Recusada pelo freela' : undefined }) });
      setMsg(acao === 'confirmar-selecao' ? 'Seleção confirmada! O trampo foi gerado.' : 'Seleção recusada. A vaga chamou o próximo da fila.');
      await carregar();
    } catch (e: any) { setMsg(e.message || 'Não foi possível concluir'); } finally { setAcaoSelecaoId(null); }
  };
  const confirmarPresenca = async (trampoId: number) => {
    setPresencaId(trampoId); setMsg('');
    try { const d: any = await apiFetch(`/api/trampos/${trampoId}/confirmar-presenca`, { method: 'POST' }); setMsg(d?.data?.ja_confirmada ? 'Presença já estava confirmada.' : 'Presença confirmada! O contratante foi avisado.'); await carregar(); }
    catch (e: any) { setMsg(e.message || 'Não foi possível confirmar presença'); } finally { setPresencaId(null); }
  };
  const enviarAvaliacao = async (item: any) => {
    const av = avaliando[item.trampo_id] || { nota: 5, comentario: '' };
    setEnviandoAvaliacaoId(item.trampo_id); setMsg('');
    try {
      await apiFetch('/api/avaliacoes', { method: 'POST', body: JSON.stringify({ avaliadoId: item.avaliado_id, nota: av.nota, comentario: av.comentario, trampoId: item.trampo_id }) });
      setAvaliacoesPendentes((prev) => prev.filter((x) => x.trampo_id !== item.trampo_id));
      setMsg('Avaliação enviada. Obrigado!');
    } catch (e: any) { setMsg(e.message || 'Não foi possível enviar a avaliação'); } finally { setEnviandoAvaliacaoId(null); }
  };
  const abrirConversa = async (cand: any, trampo: any) => {
    if (conversaAberta[cand.id]) { setConversaAberta((p) => { const n = { ...p }; delete n[cand.id]; return n; }); return; }
    try {
      const d: any = await apiFetch('/api/conversas', { method: 'POST', body: JSON.stringify({ trampo_id: trampo.id, contratante_id: trampo.contratante_id, freela_id: trampo.freela_id }) });
      const conv = d?.data || d;
      const dm: any = await apiFetch(`/api/conversas/${conv.id}/mensagens`);
      setConversaAberta((p) => ({ ...p, [cand.id]: { conversaId: conv.id, mensagens: dm?.data || dm || [] } }));
    } catch (e: any) { setMsg(e.message || 'Não foi possível abrir a conversa'); }
  };
  const enviarMensagem = async (cand: any) => {
    const conv = conversaAberta[cand.id];
    const texto = (novaMensagem[cand.id] || '').trim();
    if (!conv || !texto) return;
    try {
      const d: any = await apiFetch(`/api/conversas/${conv.conversaId}/mensagens`, { method: 'POST', body: JSON.stringify({ texto, conteudo: texto, mensagem: texto }) });
      const m = d?.data || d;
      setConversaAberta((p) => ({ ...p, [cand.id]: { ...conv, mensagens: [...conv.mensagens, m] } }));
      setNovaMensagem((p) => ({ ...p, [cand.id]: '' }));
    } catch (e: any) { setMsg(e.message || 'Não foi possível enviar'); }
  };

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
                      {v.permite_editar !== false && (<button onClick={() => editarVaga(v)} className={styles.buttonSecondary}>Editar vaga</button>)}
                      {v.permite_cancelar !== false && (<button onClick={() => setCancelandoVaga({ id: v.id, motivo: '' })} className={styles.buttonSecondary}>Cancelar vaga</button>)}
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
          {avaliacoesPendentes.length > 0 && (
            <div className={`${styles.cardSmall} mt-4`}>
              <h3 className={styles.typography.h3}>⭐ Avaliações pendentes ({avaliacoesPendentes.length})</h3>
              <p className={styles.typography.caption}>Trampos finalizados que você ainda não avaliou.</p>
              {avaliacoesPendentes.map((item: any) => {
                const av = avaliando[item.trampo_id] || { nota: 5, comentario: '' };
                return (
                  <div key={item.trampo_id} className="mt-3">
                    <p className={styles.typography.bodySmall}><b>{item.vaga_titulo || `Trampo #${item.trampo_id}`}</b> — avaliar {item.avaliado_nome || `usuário #${item.avaliado_id}`}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <select value={av.nota} onChange={(e) => setAvaliando((p) => ({ ...p, [item.trampo_id]: { ...av, nota: Number(e.target.value) } }))} className={styles.select}>
                        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ⭐</option>)}
                      </select>
                      <input value={av.comentario} onChange={(e) => setAvaliando((p) => ({ ...p, [item.trampo_id]: { ...av, comentario: e.target.value } }))} className={styles.input} placeholder="Comentário (opcional)" />
                      <button onClick={() => enviarAvaliacao(item)} disabled={enviandoAvaliacaoId === item.trampo_id} className={styles.buttonPrimary(enviandoAvaliacaoId === item.trampo_id)}>{enviandoAvaliacaoId === item.trampo_id ? 'Enviando...' : 'Enviar avaliação'}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                  {String(c.status || '').toUpperCase() === 'SELECIONADO' && (
                    <div className={`${styles.cardSmall} mt-3`}>
                      <p className={styles.typography.bodySmall}><b>Você foi selecionado!</b> Confirme até {c.prazo_resposta_ate ? new Date(c.prazo_resposta_ate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'} — sem confirmar, a vaga chama o próximo da fila.</p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => acaoSelecao(c, 'confirmar-selecao')} disabled={acaoSelecaoId === c.id} className={styles.buttonPrimary(acaoSelecaoId === c.id)}>{acaoSelecaoId === c.id ? 'Confirmando...' : 'Confirmar seleção'}</button>
                        <button onClick={() => acaoSelecao(c, 'recusar-selecao')} disabled={acaoSelecaoId === c.id} className={styles.buttonDanger}>Recusar seleção</button>
                      </div>
                    </div>
                  )}
                  {String(c.status || '').toUpperCase() === 'LISTA_ESPERA' && (
                    <p className={styles.typography.bodySmall + ' mt-2'}>⏳ Você está na <b>lista de espera — posição {c.posicao_lista_espera ?? '—'}</b>. Se alguém desistir, você é chamado automaticamente.</p>
                  )}
                  {aceita && (
                    <div className="mt-3">
                      <button onClick={() => carregarTurnos(c)} disabled={carregandoTurnosId === c.id} className={styles.buttonSecondary}>{carregandoTurnosId === c.id ? 'Carregando turnos...' : turnosDados[c.id] ? 'Ocultar turnos' : 'Ver turnos do trampo'}</button>
                      {turnosDados[c.id] && (
                        <div className={styles.cardSmall + ' mt-2'}>
                          {!turnosDados[c.id].trampo && <p className={styles.typography.bodySmall}>Trampo ainda não gerado. Aguarde o contratante confirmar.</p>}
                          {Array.isArray(turnosDados[c.id].turnos) && turnosDados[c.id].turnos.map((tt: any) => {
                            const [y, m, dd] = String(tt.data).slice(0, 10).split('-').map(Number);
                            const dtT = new Date(y, m - 1, dd);
                            const st = String(tt.status || '').toUpperCase();
                            return (
                              <div key={tt.id} className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="capitalize font-bold">{dtT.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span>
                                <span>{String(tt.hora_inicio).slice(0, 5)}–{String(tt.hora_fim).slice(0, 5)}</span>
                                <span>{fmtReais(tt.valor_servico)}</span>
                                <span className={styles.badge(st === 'CONCLUIDO' ? 'success' : st === 'CANCELADO' || st === 'FALTOU' ? 'danger' : 'warning')}>{tt.status}</span>
                                {st === 'AGENDADO' && <button onClick={() => acaoTurno(c, tt, 'checkin')} disabled={acaoTurnoId === tt.id} className={styles.buttonSecondary}>Check-in</button>}
                                {st === 'EM_ANDAMENTO' && <button onClick={() => acaoTurno(c, tt, 'checkout')} disabled={acaoTurnoId === tt.id} className={styles.buttonSecondary}>Check-out (concluir)</button>}
                                {st === 'AGUARDANDO_CONFIRMACAO' && <button onClick={() => acaoTurno(c, tt, 'confirmar')} disabled={acaoTurnoId === tt.id} className={styles.buttonPrimary(acaoTurnoId === tt.id)}>Confirmar turno (libera repasse)</button>}
                                {(st === 'AGENDADO' || st === 'EM_ANDAMENTO') && <button onClick={() => acaoTurno(c, tt, 'falta')} disabled={acaoTurnoId === tt.id} className={styles.buttonGhost}>Falta</button>}
                              </div>
                            );
                          })}
                          <p className={styles.typography.bodySmall + ' mt-2 font-black'}>Valor a pagar pelos turnos concluídos: {fmtReais(turnosDados[c.id].valor_a_pagar)}</p>
                          {turnosDados[c.id].trampo?.id && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {turnosDados[c.id].trampo.presenca_confirmada_em ? (
                                <span className={styles.badge('success')}>✅ Presença confirmada em {new Date(turnosDados[c.id].trampo.presenca_confirmada_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                              ) : (
                                <button onClick={() => confirmarPresenca(turnosDados[c.id].trampo.id)} disabled={presencaId === turnosDados[c.id].trampo.id} className={styles.buttonPrimary(presencaId === turnosDados[c.id].trampo.id)}>{presencaId === turnosDados[c.id].trampo.id ? 'Confirmando...' : '✅ Confirmar presença'}</button>
                              )}
                              <button onClick={() => abrirConversa(c, turnosDados[c.id].trampo)} className={styles.buttonSecondary}>{conversaAberta[c.id] ? 'Fechar conversa' : '💬 Conversar com contratante'}</button>
                            </div>
                          )}
                          {conversaAberta[c.id] && (
                            <div className={styles.cardSmall + ' mt-3'}>
                              <p className={styles.typography.bodySmall + ' font-black'}>Conversa do trampo</p>
                              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                                {conversaAberta[c.id].mensagens.length === 0 && <p className={styles.typography.caption}>Nenhuma mensagem ainda. Mande a primeira!</p>}
                                {conversaAberta[c.id].mensagens.map((m: any, i: number) => (
                                  <p key={m.id || i} className={styles.typography.bodySmall}><b>{Number(m.remetente_id ?? m.autor_id ?? m.usuario_id) === Number(usuario?.id) ? 'Você' : 'Contratante'}:</b> {m.texto || m.conteudo || m.mensagem || ''}</p>
                                ))}
                              </div>
                              <div className="flex gap-2 mt-2">
                                <input value={novaMensagem[c.id] || ''} onChange={(e) => setNovaMensagem((p) => ({ ...p, [c.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') enviarMensagem(c); }} className={styles.input} placeholder="Escreva sua mensagem..." />
                                <button onClick={() => enviarMensagem(c)} className={styles.buttonPrimary(false)}>Enviar</button>
                              </div>
                            </div>
                          )}
                          <button onClick={() => cancelarRestantes(c)} disabled={acaoTurnoId === -1} className={styles.buttonDanger + ' mt-2'}>Não vou continuar (imprevisto) — cancelar turnos restantes</button>
                        </div>
                      )}
                    </div>
                  )}
                  {['PENDENTE', 'EM_ANALISE', 'SELECIONADO', 'LISTA_ESPERA'].includes(String(c.status || '').toUpperCase()) || aceita ? (
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
