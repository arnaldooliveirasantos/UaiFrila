
import React, { useEffect, useState } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

interface Cidade {
  id: number;
  nome: string;
  estado: string;
  ativa: boolean;
  populacao?: number;
  regiao?: string;
  raio_km?: number;
  demanda_score?: number;
  vagas_abertas?: number;
  freelas_ativos?: number;
  status_expansao?: string;
}

interface SolicitacaoExpansao {
  id: number;
  cidade_nome: string;
  estado_sigla: string;
  populacao?: number;
  demanda_solicitacoes: number;
  demanda_vagas: number;
  status: string;
  prioridade: number;
  motivo?: string;
  data_solicitacao: string;
}

export default function PainelExpansao(props: any) {
  const styles = useUaiFrilaStyles();
  const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoExpansao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [novaSolicitacao, setNovaSolicitacao] = useState({ cidade: '', estado: 'MG', motivo: '' });
  const [enviando, setEnviando] = useState(false);

  const carregar = async () => {
    setLoading(true);
    setErro('');
    try {
      const token = localStorage.getItem('uaifrila_token');
      const [resCidades, resExpansao] = await Promise.all([
        fetch(`${API}/cidades`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/expansao`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
      ]);

      const dataCidades = await resCidades.json();
      if (resCidades.ok) setCidades(dataCidades.cidades || dataCidades || []);

      if (resExpansao && resExpansao.ok) {
        const dataExp = await resExpansao.json();
        setSolicitacoes(dataExp.solicitacoes || dataExp.expansao || dataExp || []);
      }
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const solicitarExpansao = async () => {
    if (!novaSolicitacao.cidade.trim()) { setErro('Informe a cidade'); return; }
    setEnviando(true);
    setErro('');
    try {
      const token = localStorage.getItem('uaifrila_token');
      const res = await fetch(`${API}/expansao/solicitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          cidade_nome: novaSolicitacao.cidade,
          estado_sigla: novaSolicitacao.estado,
          motivo: novaSolicitacao.motivo
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao solicitar');
      setNovaSolicitacao({ cidade: '', estado: 'MG', motivo: '' });
      carregar();
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'ATIVA' || s === 'APROVADA') return styles.badge('success');
    if (s === 'SOLICITADA' || s === 'EM_ANALISE') return styles.badge('warning');
    if (s === 'RECUSADA' || s === 'CANCELADA') return styles.badge('danger');
    return styles.badge('default');
  };

  if (loading) return <div className={styles.pageContainer}><p className={styles.typography.body}>Carregando expansão...</p></div>;

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.typography.h1 + ' mb-6'}>Expansão de Cidades</h1>

      {erro && <div className={styles.errorBox + ' mb-4'}>{erro}</div>}

      {/* Solicitar nova cidade */}
      <div className={styles.card + ' mb-6'}>
        <h2 className={styles.typography.h2 + ' mb-4'}>Solicitar Nova Cidade</h2>
        <div className={styles.grid2Cols}>
          <div>
            <label className={styles.label}>Cidade *</label>
            <input
              value={novaSolicitacao.cidade}
              onChange={e => setNovaSolicitacao({ ...novaSolicitacao, cidade: e.target.value })}
              placeholder="Ex: Araxá"
              className={styles.input}
            />
          </div>
          <div>
            <label className={styles.label}>Estado *</label>
            <select
              value={novaSolicitacao.estado}
              onChange={e => setNovaSolicitacao({ ...novaSolicitacao, estado: e.target.value })}
              className={styles.select}
            >
              <option value="MG">MG</option><option value="GO">GO</option><option value="SP">SP</option><option value="RJ">RJ</option><option value="DF">DF</option><option value="BA">BA</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className={styles.label}>Motivo (opcional)</label>
          <textarea
            value={novaSolicitacao.motivo}
            onChange={e => setNovaSolicitacao({ ...novaSolicitacao, motivo: e.target.value })}
            placeholder="Por que expandir para essa cidade? Demanda, eventos..."
            className={styles.textarea}
          />
        </div>
        <button onClick={solicitarExpansao} disabled={enviando} className={styles.buttonPrimary(enviando) + ' mt-4'}>
          {enviando ? 'Enviando...' : 'Solicitar Expansão'}
        </button>
      </div>

      {/* Cidades Ativas */}
      <div className={styles.card + ' mb-6'}>
        <h2 className={styles.typography.h2 + ' mb-4'}>Cidades Ativas ({cidades.filter(c => c.ativa).length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cidades.filter(c => c.ativa).map(c => (
            <div key={c.id} className={styles.cardSmall}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black uppercase text-sm">{c.nome} - {c.estado}</h3>
                  <p className={styles.typography.caption}>
                    {c.populacao ? `Pop: ${c.populacao.toLocaleString('pt-BR')} • ` : ''}Raio: {c.raio_km || 20}km
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className={styles.badge('default')}>Vagas: {c.vagas_abertas || 0}</span>
                    <span className={styles.badge('success')}>Freelas: {c.freelas_ativos || 0}</span>
                  </div>
                </div>
                <span className={getStatusBadge(c.status_expansao || 'ATIVA')}>{c.status_expansao || 'ATIVA'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Solicitações */}
      <div className={styles.card}>
        <h2 className={styles.typography.h2 + ' mb-4'}>Solicitações de Expansão ({solicitacoes.length})</h2>
        {solicitacoes.length === 0 ? (
          <p className={styles.typography.bodySmall}>Nenhuma solicitação ainda.</p>
        ) : (
          <div className="space-y-3">
            {solicitacoes.map(s => (
              <div key={s.id} className={styles.cardSmall}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black uppercase text-sm">{s.cidade_nome} - {s.estado_sigla}</h3>
                    <p className={styles.typography.caption}>
                      Demanda: {s.demanda_solicitacoes} solicitações • {s.demanda_vagas} vagas • Prioridade: {s.prioridade}
                    </p>
                    {s.motivo && <p className="text-xs mt-1">{s.motivo}</p>}
                    <p className={styles.typography.caption + ' mt-1'}>Solicitado em: {new Date(s.data_solicitacao).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className={getStatusBadge(s.status)}>{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
