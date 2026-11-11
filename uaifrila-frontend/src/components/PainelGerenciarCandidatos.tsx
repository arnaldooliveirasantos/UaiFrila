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
      const data = await apiFetch(`/api/candidaturas/vaga/${id}`);
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
        {candidatos.map((c: any) => {
          const u = c.freela || c.usuario || c || {};
          return (
            <div key={c.id} className={`p-5 ${styles.cardSmall} flex justify-between`}>
              <div>
                <p className="font-black">{u.nome_completo || u.nome || `Freela #${c.freela_id || c.usuario_id}`} - {u.media_avaliacao ? `${u.media_avaliacao}★` : 'sem avaliação'}</p>
                <p className="text-xs">📍 {u.endereco_ativo_bairro || u.bairro || ''} {u.endereco_ativo_cidade ? `- ${u.endereco_ativo_cidade}` : ''}</p>
                <p className="text-xs opacity-70">Status: {c.status} {c.mensagem ? `• ${c.mensagem}` : ''}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button disabled={acaoId === c.id} onClick={() => mudarStatus(c.id, 'ACEITA')} className={`px-4 py-2 text-xs font-black uppercase ${styles.buttonPrimary(acaoId === c.id)}`}>{acaoId === c.id ? 'Salvando...' : 'Aceitar'}</button>
                <button disabled={acaoId === c.id} onClick={() => mudarStatus(c.id, 'RECUSADA')} className={`px-4 py-2 text-xs font-black uppercase ${styles.buttonDanger}`}>Recusar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
