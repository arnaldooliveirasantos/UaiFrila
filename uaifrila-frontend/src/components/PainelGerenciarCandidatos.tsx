import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

// ANTES (mock): array fixo João Silva / Maria Souza + alert('Aceitar cria trampo...') sem chamar API.
// AGORA (API real):
//   GET /api/vagas/minhas -> lista vagas do contratante
//   GET /api/candidaturas/vaga/:vagaId -> candidatos reais da vaga selecionada
//   PUT /api/candidaturas/:id/status { status: 'ACEITA' | 'RECUSADA' } -> aceitar / recusar de verdade
// SEM alert(), SEM dados fixos. Se a API falhar, mostra o erro da API.

export default function PainelGerenciarCandidatos() {
  const styles = useUaiFrilaStyles();
  const [vagas, setVagas] = useState<any[]>([]);
  const [vagaId, setVagaId] = useState<number | null>(null);
  const [candidatos, setCandidatos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoCandidatos, setCarregandoCandidatos] = useState(false);
  const [erro, setErro] = useState('');
  const [acaoId, setAcaoId] = useState<number | null>(null);
  // Fases 1: resumo da seleção + checkbox de seleção em lote.
  const [resumo, setResumo] = useState<any>(null);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [selecionando, setSelecionando] = useState(false);

  const carregarVagas = async () => {
    setCarregando(true); setErro('');
    try {
      const data = await apiFetch('/api/vagas/minhas');
      const lista = data.vagas || data.data || (Array.isArray(data) ? data : []);
      setVagas(lista);
      if (lista.length > 0 && vagaId === null) setVagaId(lista[0].id);
    } catch (e: any) { setErro(e.message || 'Erro ao carregar vagas'); } finally { setCarregando(false); }
  };
  const carregarCandidatos = async (id: number) => {
    setCarregandoCandidatos(true); setErro('');
    try {
      const data = await apiFetch(`/api/candidatos/vaga/${id}`).catch(() => apiFetch(`/api/candidaturas/vaga/${id}`));
      const lista = data.candidaturas || data.data || (Array.isArray(data) ? data : []);
      setCandidatos(lista);
      setSelecionados([]);
      try { const dr = await apiFetch(`/api/candidaturas/vaga/${id}/selecao`); setResumo(dr?.data || dr || null); } catch { setResumo(null); }
    } catch (e: any) { setErro(e.message || 'Erro ao carregar candidatos'); setCandidatos([]); } finally { setCarregandoCandidatos(false); }
  };
  useEffect(() => { carregarVagas(); }, []);
  useEffect(() => { if (vagaId) carregarCandidatos(vagaId); }, [vagaId]);

  const selecionarEmLote = async () => {
    if (!vagaId || !selecionados.length) return;
    setSelecionando(true); setErro('');
    try {
      await apiFetch(`/api/candidaturas/vaga/${vagaId}/selecionar`, { method: 'POST', body: JSON.stringify({ candidatura_ids: selecionados }) });
      await carregarCandidatos(vagaId);
    } catch (e: any) { setErro(e.message || 'Erro ao selecionar candidatos'); } finally { setSelecionando(false); }
  };
  const alternarSelecao = (id: number) => setSelecionados((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const mudarStatus = async (id: number, status: 'ACEITA' | 'RECUSADA') => {
    setAcaoId(id); setErro('');
    try {
      await apiFetch(`/api/candidaturas/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      if (vagaId) await carregarCandidatos(vagaId);
    } catch (e: any) { setErro(e.message || 'Erro ao atualizar candidatura'); } finally { setAcaoId(null); }
  };

  if (carregando) return <div className={styles.pageContainer}>Carregando vagas...</div>;
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.typography.h1}>Gerenciar Candidatos</h1>
      <p className={styles.typography.body + ' mt-2'}>Selecione uma vaga para ver os candidatos reais da API.</p>
      {erro && <div className={`${styles.errorBox} mt-4`}>{erro}</div>}
      <div className="mt-4">
        <label className={styles.label}>Vaga</label>
        <select value={vagaId ?? ''} onChange={(e) => setVagaId(Number(e.target.value))} className={styles.select}>
          {vagas.length === 0 && <option value="">Nenhuma vaga publicada</option>}
          {vagas.map((v: any) => <option key={v.id} value={v.id}>{v.titulo || `Vaga #${v.id}`} - {v.cidade_nome || ''}</option>)}
        </select>
      </div>
      {carregandoCandidatos && <p className="mt-4 text-xs animate-pulse">Carregando candidatos...</p>}
      {!carregandoCandidatos && candidatos.length === 0 && vagas.length > 0 && <p className="mt-4 text-xs">Nenhum candidato nesta vaga ainda.</p>}
      {resumo && (
        <div className={`${styles.cardSmall} mt-4`}>
          <p className={styles.typography.body + ' font-black'}>{resumo.quantidade_vagas} vaga(s) • {resumo.preenchidas} preenchida(s) • {resumo.restantes} restante(s) • fila: {resumo.lista_espera}</p>
          <p className={styles.typography.caption}>Prazo do freela confirmar a seleção: {resumo.prazo_confirmacao_horas}h. Quem não confirmar, perde a vaga para o próximo da fila.</p>
          {selecionados.length > 0 && (
            <button onClick={selecionarEmLote} disabled={selecionando || selecionados.length > resumo.restantes} className={styles.buttonPrimary(selecionando) + ' mt-3'}>
              {selecionando ? 'Selecionando...' : `Selecionar ${selecionados.length} candidato${selecionados.length > 1 ? 's' : ''}`}
            </button>
          )}
          {selecionados.length > resumo.restantes && <p className={styles.typography.caption + ' mt-1'}>Só restam {resumo.restantes} vaga(s). Desmarque {selecionados.length - resumo.restantes}.</p>}
        </div>
      )}
      <div className="mt-6 grid gap-4">
        {[...candidatos].sort((a: any, b: any) => (b.match_vaga ?? 0) - (a.match_vaga ?? 0)).map((c: any) => {
          const u = c.freela || c.usuario || c || {};
          const exp = c.experiencia_funcao || {};
          const inicial = (u.nome_completo || u.nome || 'F').trim().charAt(0).toUpperCase();
          return (
            <div key={c.id} className={`p-5 ${styles.cardSmall}`}>
              <div className="flex gap-4">
                <div className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-xl font-black shrink-0 ${styles.isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                  {(u.foto || c.foto) ? <img src={u.foto || c.foto} alt={u.nome_completo || u.nome} className="w-full h-full object-cover" /> : inicial}
                </div>
                <div className="flex-1">
                  <p className="font-black">{u.nome_completo || u.nome || `Freela #${c.freela_id || c.usuario_id}`} {c.match_vaga != null && <span className={'ml-1 ' + styles.badge('warning')}>Match {c.match_vaga}%</span>}</p>
                  <p className="text-xs">⭐ Avaliação geral: {u.media_avaliacao || c.media_avaliacao || '—'} {c.total_avaliacoes ? `(${c.total_avaliacoes} avaliações)` : ''}</p>
                  <p className="text-xs">📍 {u.endereco_ativo_bairro || u.bairro || ''} {u.endereco_ativo_cidade ? `- ${u.endereco_ativo_cidade}` : ''}</p>
                  <p className="text-xs mt-2"><b>Na função desta vaga{c.funcao_vaga ? ` (${c.funcao_vaga})` : ''}:</b> {exp.trampos_comprovados > 0 ? `${exp.trampos_comprovados} trampos comprovados no app` : 'sem trampos comprovados'} {exp.meses_declarados ? `• ${exp.meses_declarados >= 60 ? 'mais de 5 anos' : exp.meses_declarados >= 36 ? '3 a 5 anos' : exp.meses_declarados >= 12 ? '1 a 2 anos' : 'menos de 1 ano'} declarados` : ''} {exp.media_funcao ? `• nota ${exp.media_funcao} nessa função` : ''}</p>
                  {c.funcoes_declaradas?.length > 0 && <p className="text-xs mt-1"><b>Outras funções:</b> {c.funcoes_declaradas.filter((x: any) => x.funcao_nome !== c.funcao_vaga).slice(0, 3).map((x: any) => `${x.funcao_nome} (${x.trampos_comprovados > 0 ? 'comprovada' : 'declarada'})`).join(' • ')}</p>}
                  {c.historico_app && <p className="text-xs mt-1"><b>No app:</b> {c.historico_app.trampos_concluidos} trampos concluídos • {c.historico_app.candidaturas_canceladas} cancelamentos</p>}
                  {c.avaliacoes_recentes?.length > 0 && <div className="mt-2 text-xs opacity-80">{c.avaliacoes_recentes.map((a: any, i: number) => <p key={i}>“{a.comentario || `Nota ${a.nota}`}” — {a.nota}⭐</p>)}</div>}
                  <p className="text-xs opacity-70 mt-1">Status: {c.status}</p>
                  {c.mensagem && <p className="text-xs mt-1 italic">💬 “{c.mensagem}”</p>}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {(() => { const st = String(c.status || '').toUpperCase(); const elegivel = st === 'PENDENTE' || st === 'LISTA_ESPERA'; const prazo = c.prazo_resposta_ate ? new Date(c.prazo_resposta_ate) : null; return (<>
                    {st === 'SELECIONADO' && <span className={styles.badge('warning')}>Selecionado — confirmar até {prazo ? prazo.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</span>}
                    {st === 'LISTA_ESPERA' && <span className={styles.badge('default')}>Lista de espera — posição {c.posicao_lista_espera ?? '—'}</span>}
                    {st === 'ACEITA' && <span className={styles.badge('success')}>Aceita — trampo gerado</span>}
                    {st === 'RECUSADA' && <span className={styles.badge('danger')}>Recusada{c.motivo_recusa ? ` • ${c.motivo_recusa}` : ''}</span>}
                    {elegivel && (<label className="flex items-center gap-2 text-xs font-black uppercase cursor-pointer"><input type="checkbox" checked={selecionados.includes(c.id)} onChange={() => alternarSelecao(c.id)} /> Selecionar</label>)}
                    {elegivel && <button disabled={acaoId === c.id} onClick={() => mudarStatus(c.id, 'ACEITA')} className={`px-4 py-2 text-xs font-black uppercase ${styles.buttonPrimary(acaoId === c.id)}`}>{acaoId === c.id ? 'Salvando...' : 'Aceitar direto'}</button>}
                    {elegivel && <button disabled={acaoId === c.id} onClick={() => mudarStatus(c.id, 'RECUSADA')} className={`px-4 py-2 text-xs font-black uppercase ${styles.buttonDanger}`}>Recusar</button>}
                  </>); })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
