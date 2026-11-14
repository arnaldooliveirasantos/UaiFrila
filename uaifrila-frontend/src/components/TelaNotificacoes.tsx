import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
// Tela de Notificacoes - lista as notificacoes do usuario logado.
// Backend ja existia (GET /api/notificacoes/minhas, PUT /api/notificacoes/:id/lida),
// mas nao havia tela: notificacao so era criada, nunca exibida.
// NO PADRAO DO SISTEMA: tudo via useUaiFrilaStyles() - nenhuma cor hardcoded.
const TIPO_ROTULO: Record<string, string> = {
  CANDIDATURA_ACEITA: 'Candidatura aceita',
  CANDIDATURA_RECUSADA: 'Candidatura não selecionada',
  CANDIDATURA_CANCELADA: 'Candidatura cancelada',
  CANCELAMENTO_CANDIDATURA: 'Cancelamento de candidatura',
  VAGA_CANCELADA: 'Vaga cancelada',
  VAGA_FINALIZADA: 'Vaga finalizada',
  VAGA_CRIADA: 'Nova vaga',
  AVALIACAO_RECEBIDA: 'Avaliação recebida',
  PAGAMENTO_RECEBIDO: 'Pagamento recebido',
};
const rotuloTipo = (tipo: string) => TIPO_ROTULO[tipo] || String(tipo || '').replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());
const iconeTipo = (tipo: string) => {
  if (tipo.includes('ACEITA')) return '✅';
  if (tipo.includes('CANCEL') || tipo.includes('RECUS')) return '🚫';
  if (tipo.includes('VAGA')) return '💼';
  if (tipo.includes('AVALIACAO')) return '⭐';
  if (tipo.includes('PAGAMENTO')) return '💰';
  return '🔔';
};
export default function TelaNotificacoes() {
  const styles = useUaiFrilaStyles();
  const [notificacoes, setNotificacoes] = useState<any[]>([]);
  const [filtro, setFiltro] = useState<'TODAS' | 'NAO_LIDAS' | 'LIDAS'>('TODAS');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [marcandoId, setMarcandoId] = useState<number | null>(null);
  const carregar = async () => {
    setCarregando(true); setErro('');
    try {
      const d = await apiFetch('/api/notificacoes/minhas');
      const lista = d?.data || d?.notificacoes || d || [];
      setNotificacoes(Array.isArray(lista) ? lista : []);
    } catch (e: any) { setErro(e.message || 'Não foi possível carregar as notificações'); setNotificacoes([]); } finally { setCarregando(false); }
  };
  useEffect(() => { carregar(); }, []);
  const naoLidas = useMemo(() => notificacoes.filter((n: any) => !(n.lida ?? n.lido)), [notificacoes]);
  const filtradas = useMemo(() => notificacoes.filter((n: any) => {
    const lida = !!(n.lida ?? n.lido);
    if (filtro === 'NAO_LIDAS') return !lida;
    if (filtro === 'LIDAS') return lida;
    return true;
  }), [notificacoes, filtro]);
  const marcarComoLida = async (id: number) => {
    setMarcandoId(id);
    try {
      await apiFetch(`/api/notificacoes/${id}/lida`, { method: 'PUT' });
      setNotificacoes((prev) => prev.map((n: any) => Number(n.id) === id ? { ...n, lida: true } : n));
    } catch (e: any) { setErro(e.message || 'Não foi possível marcar como lida'); } finally { setMarcandoId(null); }
  };
  const marcarTodasComoLidas = async () => {
    const ids = naoLidas.map((n: any) => Number(n.id));
    for (const id of ids) { try { await apiFetch(`/api/notificacoes/${id}/lida`, { method: 'PUT' }); } catch {} }
    setNotificacoes((prev) => prev.map((n: any) => ({ ...n, lida: true })));
  };
  if (carregando) return <div className={styles.pageContainer}><div className={styles.card}><p className="animate-pulse">Carregando notificações...</p></div></div>;
  return (
    <div className={styles.pageContainer}>
      <div className="flex items-center justify-between gap-2">
        <h1 className={styles.typography.h1}>Notificações</h1>
        {naoLidas.length > 0 ? <span className={styles.badge('danger')}>{naoLidas.length} não lida{naoLidas.length > 1 ? 's' : ''}</span> : <span className={styles.badge('success')}>Tudo lido</span>}
      </div>
      <p className={styles.typography.body + ' mt-2'}>Avisos sobre suas candidaturas, vagas e pagamentos.</p>
      {erro && <div className={styles.errorBox + ' mt-4'}>{erro} <button onClick={carregar} className={styles.buttonGhost}>Tentar de novo</button></div>}
      <div className="flex flex-wrap gap-2 mt-4">
        <button onClick={() => setFiltro('TODAS')} className={filtro === 'TODAS' ? styles.badge('warning') : styles.badge('default')}>Todas ({notificacoes.length})</button>
        <button onClick={() => setFiltro('NAO_LIDAS')} className={filtro === 'NAO_LIDAS' ? styles.badge('warning') : styles.badge('default')}>Não lidas ({naoLidas.length})</button>
        <button onClick={() => setFiltro('LIDAS')} className={filtro === 'LIDAS' ? styles.badge('warning') : styles.badge('default')}>Lidas ({notificacoes.length - naoLidas.length})</button>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={carregar} className={styles.buttonSecondary}>Atualizar</button>
        {naoLidas.length > 0 && <button onClick={marcarTodasComoLidas} className={styles.buttonSecondary}>Marcar todas como lidas</button>}
      </div>
      {filtradas.length === 0 && <div className={styles.cardSmall + ' mt-6'}><p className={styles.typography.body}>{filtro === 'NAO_LIDAS' ? 'Nenhuma notificação não lida.' : filtro === 'LIDAS' ? 'Nenhuma notificação lida ainda.' : 'Nenhuma notificação por aqui ainda. Quando algo acontecer com suas vagas ou candidaturas, aparece aqui.'}</p><button onClick={carregar} className={styles.buttonGhost}>Recarregar</button></div>}
      <div className="mt-6 grid gap-4">{filtradas.map((n: any) => {
        const lida = !!(n.lida ?? n.lido);
        const tipo = n.tipo || '';
        const data = n.criado_em || n.criadoEm || n.createdAt || n.created_at;
        return (
          <div key={n.id} className={styles.cardSmall}>
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className={styles.typography.body + ' font-black'}>{iconeTipo(tipo)} {n.titulo || rotuloTipo(tipo)}</p>
                <p className={styles.typography.caption}>{rotuloTipo(tipo)}{data ? ` • ${new Date(data).toLocaleDateString()} às ${new Date(data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</p>
              </div>
              {lida ? <span className={styles.badge('default')}>Lida</span> : <span className={styles.badge('warning')}>Nova</span>}
            </div>
            {n.mensagem && <p className={styles.typography.bodySmall + ' mt-2'}>{n.mensagem}</p>}
            {!lida && <button onClick={() => marcarComoLida(Number(n.id))} disabled={marcandoId === Number(n.id)} className={styles.buttonSecondary + ' mt-3'}>{marcandoId === Number(n.id) ? 'Marcando...' : 'Marcar como lida'}</button>}
          </div>);
      })}</div>
    </div>);
}
