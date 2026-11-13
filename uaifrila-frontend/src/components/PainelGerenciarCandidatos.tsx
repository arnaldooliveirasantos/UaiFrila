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
    } catch (e: any) { setErro(e.message || 'Erro ao carregar candidatos'); setCandidatos([]); } finally { setCarregandoCandidatos(false); }
  };
  useEffect(() => { carregarVagas(); }, []);
  useEffect(() => { if (vagaId) carregarCandidatos(vagaId); }, [vagaId]);

  const mudarStatus = async (id: number, status: 'ACEITA' | 'RECUSADA') => {
    setAcaoId(id); setErro('');
    try {
      await apiFetch(`/api/candidaturas/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      if (vagaId) await carregarCandidatos(vagaId);
    } catch (e: any) { setErro(e.message || 'Erro ao atualizar candidatura'); } finally { setAcaoId(null); }
  };

  if (carregando) return <div className={styles.pageContainer}>Carregando vagas...</div>;
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-black uppercase">Gerenciar Candidatos</h2>
      <p className="text-xs mt-1 opacity-70">Selecione uma vaga para ver os candidatos reais da API.</p>
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
      <div className="mt-6 grid gap-4">
        {[...candidatos].sort((a: any, b: any) => (b.match_vaga ?? 0) - (a.match_vaga ?? 0)).map((c: any) => {
          const u = c.freela || c.usuario || c || {};
          const exp = c.experiencia_funcao || {};
          const inicial = (u.nome_completo || u.nome || 'F').trim().charAt(0).toUpperCase();
          return (
            <div key={c.id} className={`p-5 ${styles.cardSmall}`}>
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-black text-white flex items-center justify-center text-xl font-black shrink-0">
                  {(u.foto || c.foto) ? <img src={u.foto || c.foto} alt={u.nome_completo || u.nome} className="w-full h-full object-cover" /> : inicial}
                </div>
                <div className="flex-1">
                  <p className="font-black">{u.nome_completo || u.nome || `Freela #${c.freela_id || c.usuario_id}`} {c.match_vaga != null && <span className="ml-1 px-2 py-0.5 text-xs bg-yellow-400 rounded-full">Match {c.match_vaga}%</span>}</p>
                  <p className="text-xs">⭐ Avaliação geral: {u.media_avaliacao || c.media_avaliacao || '—'} {c.total_avaliacoes ? `(${c.total_avaliacoes} avaliações)` : ''}</p>
                  <p className="text-xs">📍 {u.endereco_ativo_bairro || u.bairro || ''} {u.endereco_ativo_cidade ? `- ${u.endereco_ativo_cidade}` : ''}</p>
                  <p className="text-xs mt-2"><b>Na função desta vaga{c.funcao_vaga ? ` (${c.funcao_vaga})` : ''}:</b> {exp.trampos_comprovados > 0 ? `${exp.trampos_comprovados} trampos comprovados no app` : 'sem trampos comprovados'} {exp.meses_declarados ? `• ${exp.meses_declarados >= 60 ? 'mais de 5 anos' : exp.meses_declarados >= 36 ? '3 a 5 anos' : exp.meses_declarados >= 12 ? '1 a 2 anos' : 'menos de 1 ano'} declarados` : ''} {exp.media_funcao ? `• nota ${exp.media_funcao} nessa função` : ''}</p>
                  {c.funcoes_declaradas?.length > 0 && <p className="text-xs mt-1"><b>Outras funções:</b> {c.funcoes_declaradas.filter((x: any) => x.funcao_nome !== c.funcao_vaga).slice(0, 3).map((x: any) => `${x.funcao_nome} (${x.trampos_comprovados > 0 ? 'comprovada' : 'declarada'})`).join(' • ')}</p>}
                  {c.historico_app && <p className="text-xs mt-1"><b>No app:</b> {c.historico_app.trampos_concluidos} trampos concluídos • {c.historico_app.candidaturas_canceladas} cancelamentos</p>}
                  {c.avaliacoes_recentes?.length > 0 && <div className="mt-2 text-xs opacity-80">{c.avaliacoes_recentes.map((a: any, i: number) => <p key={i}>“{a.comentario || `Nota ${a.nota}`}” — {a.nota}⭐</p>)}</div>}
                  <p className="text-xs opacity-70 mt-1">Status: {c.status}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button disabled={acaoId === c.id} onClick={() => mudarStatus(c.id, 'ACEITA')} className={`px-4 py-2 text-xs font-black uppercase ${styles.buttonPrimary(acaoId === c.id)}`}>{acaoId === c.id ? 'Salvando...' : 'Aceitar'}</button>
                  <button disabled={acaoId === c.id} onClick={() => mudarStatus(c.id, 'RECUSADA')} className={`px-4 py-2 text-xs font-black uppercase ${styles.buttonDanger}`}>Recusar</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
