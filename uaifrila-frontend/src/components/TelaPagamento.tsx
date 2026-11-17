import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
// Tela de pagamento do contratante. NUNCA exibe comissão/taxa (sigilo comercial — o backend
// já filtra para não-admin). Mostra só: total, método, QR Pix / checkout cartão, prazo, status.
export default function TelaPagamento({ usuario, candidaturaId }: { usuario: any; candidaturaId: number }) {
  const styles = useUaiFrilaStyles();
  const [pagamento, setPagamento] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [metodo, setMetodo] = useState<'pix' | 'cartao'>('pix');
  const [pagando, setPagando] = useState(false);
  const [tokenCartao, setTokenCartao] = useState('');
  const carregar = async () => {
    setCarregando(true); setErro('');
    try {
      const d = await apiFetch(`/api/pagamentos/candidatura/${candidaturaId}`);
      setPagamento(d?.pagamento || d?.data || null);
    } catch (e: any) { setErro(e.message || 'Não foi possível carregar o pagamento'); }
    finally { setCarregando(false); }
  };
  useEffect(() => { if (candidaturaId) carregar(); }, [candidaturaId]);
  const pagar = async () => {
    setPagando(true); setErro('');
    try {
      const d = await apiFetch('/api/pagamentos', { method: 'POST', body: JSON.stringify({ candidatura_id: candidaturaId, metodo, token_cartao: metodo === 'cartao' ? tokenCartao : undefined, parcelas: 1 }) });
      setPagamento(d?.pagamento || d?.data || null);
    } catch (e: any) { setErro(e.message); }
    finally { setPagando(false); }
  };
  const reembolsar = async () => {
    if (!confirm('Pedir reembolso? Turnos já confirmados não voltam.')) return;
    try { await apiFetch(`/api/pagamentos/${pagamento.id}/reembolsar`, { method: 'POST', body: JSON.stringify({ motivo: 'Cancelado pelo contratante' }) }); await carregar(); }
    catch (e: any) { setErro(e.message); }
  };
  if (!candidaturaId) return <div className={styles.pageContainer}><div className={styles.card}><p className={styles.typography.body}>Escolha uma candidatura aceita em Meus Trampos para pagar.</p></div></div>;
  if (carregando) return <div className={styles.pageContainer}><div className={styles.card}><p className="animate-pulse">Carregando pagamento...</p></div></div>;
  const status = String(pagamento?.status || 'SEM_PAGAMENTO').toUpperCase();
  const total = Number(pagamento?.total ?? pagamento?.total_pix ?? pagamento?.total_cartao ?? 0);
  return (<div className={styles.pageContainer}><h1 className={styles.typography.h1}>Pagamento</h1>
    {erro && <div className={styles.errorBox + ' mt-4'}>{erro}</div>}
    <div className={styles.card + ' mt-4'}>
      <p className={styles.typography.body}>Candidatura #{candidaturaId} • Status: <strong>{status}</strong></p>
      {!!total && <p className={styles.typography.h2 + ' mt-2'}>Total: R$ {total.toFixed(2)}</p>}
      {pagamento?.expira_em && <p className={styles.typography.bodySmall}>Prazo: {new Date(pagamento.expira_em).toLocaleString('pt-BR')}</p>}
      {status === 'AGUARDANDO_PAGAMENTO' && <>
        <div className="flex gap-2 mt-4"><button onClick={() => setMetodo('pix')} className={metodo === 'pix' ? styles.buttonPrimary(false) : styles.buttonSecondary}>Pix</button><button onClick={() => setMetodo('cartao')} className={metodo === 'cartao' ? styles.buttonPrimary(false) : styles.buttonSecondary}>Cartão</button></div>
        {metodo === 'cartao' && <div className="mt-4"><label className={styles.label}>Token do cartão (gerado no front pelo SDK do provedor — nunca digite o número aqui)</label><input value={tokenCartao} onChange={e => setTokenCartao(e.target.value)} className={styles.input} placeholder="token_..." /></div>}
        <button onClick={pagar} disabled={pagando} className={styles.buttonPrimary(pagando) + ' mt-4'}>{pagando ? 'Gerando...' : 'Gerar cobrança'}</button>
      </>}
      {!!pagamento?.qr_code && <div className="mt-4"><p className={styles.typography.bodySmall}>Escaneie o QR Pix:</p><img src={pagamento.qr_code.startsWith('data:') ? pagamento.qr_code : `data:image/png;base64,${pagamento.qr_code}`} alt="QR Pix" style={{ maxWidth: 240 }} /></div>}
      {!!pagamento?.qr_code_url && <p className={styles.typography.bodySmall + ' mt-2'}><a href={pagamento.qr_code_url} target="_blank" rel="noreferrer">Abrir QR Pix</a></p>}
      {!!pagamento?.checkout_url && <p className={styles.typography.bodySmall + ' mt-2'}><a href={pagamento.checkout_url} target="_blank" rel="noreferrer">Abrir checkout</a></p>}
      {status === 'EM_ESCROW' && <div className="mt-4"><p className={styles.typography.bodySmall}>Pagamento confirmado e em escrow. O freela recebe por turno, 15 min após você confirmar cada turno.</p><button onClick={reembolsar} className={styles.buttonDanger + ' mt-2'}>Pedir reembolso</button></div>}
      {status === 'REEMBOLSADO' && <p className={styles.typography.bodySmall + ' mt-4'}>Reembolso concluído.</p>}
    </div></div>);
}
