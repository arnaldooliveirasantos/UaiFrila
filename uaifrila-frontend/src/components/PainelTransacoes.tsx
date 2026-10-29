
import React, { useEffect, useState } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

interface Transacao {
  id: number;
  codigo: string;
  vaga_id?: number;
  trampo_id?: number;
  freela_id: number;
  contratante_id: number;
  cidade_nome?: string;
  valor_base: number;
  taxa_percentual: number;
  taxa_valor: number;
  ajuda_custo?: number;
  valor_total_contratante: number;
  valor_liquido_freela: number;
  status: string;
  metodo_pagamento: string;
  data_inicio?: string;
  data_pagamento?: string;
  criado_em: string;
}

export default function PainelTransacoes(props: any) {
  const styles = useUaiFrilaStyles();
  const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  const carregar = async () => {
    setLoading(true);
    setErro('');
    try {
      const token = localStorage.getItem('uaifrila_token');
      if (!token) throw new Error('Faça login');
      const res = await fetch(`${API}/transacoes`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao carregar');
      setTransacoes(data.transacoes || data || []);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'PAGO' || s === 'LIBERADO' || s === 'CONCLUIDO') return styles.badge('success');
    if (s === 'AGUARDANDO_PAGAMENTO' || s === 'PENDENTE') return styles.badge('warning');
    if (s === 'CANCELADO' || s === 'ESTORNADO') return styles.badge('danger');
    return styles.badge('default');
  };

  const formatarData = (utc?: string) => {
    if (!utc) return '-';
    try { return new Date(utc).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return utc; }
  };

  const filtradas = filtroStatus === 'TODOS' ? transacoes : transacoes.filter(t => t.status === filtroStatus);

  const totalReceber = filtradas.reduce((acc, t) => acc + Number(t.valor_liquido_freela || 0), 0);
  const totalPago = filtradas.reduce((acc, t) => acc + Number(t.valor_total_contratante || 0), 0);

  if (loading) return <div className={styles.pageContainer}><p className={styles.typography.body}>Carregando transações...</p></div>;

  return (
    <div className={styles.pageContainer}>
      <div className="flex justify-between items-center mb-6">
        <h1 className={styles.typography.h1}>Transações</h1>
        <button onClick={carregar} className={styles.buttonSecondary}>🔄 Recarregar</button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={styles.cardSmall}>
          <p className={styles.label}>Total Transações</p>
          <p className="text-2xl font-black mt-1">{filtradas.length}</p>
        </div>
        <div className={styles.cardSmall}>
          <p className={styles.label}>Total Contratante Pagou</p>
          <p className="text-xl font-black mt-1">R$ {totalPago.toFixed(2).replace('.', ',')}</p>
        </div>
        <div className={styles.cardHighlight}>
          <p className={styles.label}>Total Freela Recebe</p>
          <p className="text-xl font-black mt-1">R$ {totalReceber.toFixed(2).replace('.', ',')}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['TODOS', 'AGUARDANDO_PAGAMENTO', 'PAGO', 'LIBERADO', 'CANCELADO'].map(s => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            className={filtroStatus === s ? styles.buttonPrimary() + ' px-3 py-1 text-xs w-auto' : styles.buttonSecondary + ' text-xs'}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {erro && <div className={styles.errorBox + ' mb-4'}>{erro}</div>}

      {filtradas.length === 0 && !erro && (
        <div className={styles.card}>Nenhuma transação encontrada.</div>
      )}

      <div className="space-y-3">
        {filtradas.map((t) => (
          <div key={t.id} className={styles.cardSmall}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black uppercase text-sm">{t.codigo}</h3>
                  <span className={getStatusBadge(t.status)}>{t.status}</span>
                </div>
                <p className={styles.typography.caption + ' mt-1'}>
                  Vaga #{t.vaga_id || '-'} • Trampo #{t.trampo_id || '-'} • {t.cidade_nome || 'Sem cidade'} • {t.metodo_pagamento}
                </p>
                <div className={styles.valorBox + ' mt-3'}>
                  <div>Base: R$ {Number(t.valor_base || 0).toFixed(2).replace('.', ',')}</div>
                  <div>Taxa {t.taxa_percentual}%: R$ {Number(t.taxa_valor || 0).toFixed(2).replace('.', ',')}</div>
                  <div>Total Contratante: R$ {Number(t.valor_total_contratante || 0).toFixed(2).replace('.', ',')}</div>
                  <div className="font-black">Líquido Freela: R$ {Number(t.valor_liquido_freela || 0).toFixed(2).replace('.', ',')}</div>
                </div>
                <p className={styles.typography.caption + ' mt-2'}>
                  Criado: {formatarData(t.criado_em)} {t.data_pagamento && `• Pago: ${formatarData(t.data_pagamento)}`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
