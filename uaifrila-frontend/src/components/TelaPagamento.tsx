import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
// Tela de pagamento do contratante — Checkout Bricks (Mercado Pago).
// NUNCA exibe comissão/taxa (sigilo comercial). Mostra só: totais por método,
// economia do Pix, QR Pix / Brick do cartão, prazo, status.
// - Provedor ativo = MERCADO_PAGO + public key cadastrada -> Payment Brick
//   (cartão por formulário oficial do MP; Pix continua com QR gerado no backend).
// - Provedor ativo = EFI (ou MP sem public key) -> botão Pix + campo de token
//   (fluxo Efí, sem Bricks — Bricks é só do Mercado Pago).
// - O cálculo final SEMPRE usa o método escolhido na hora do pagamento:
//   o backend recalcula total_pix / total_cartao a partir do método enviado.
declare global { interface Window { MercadoPago?: any } }
const SDK_URL = 'https://sdk.mercadopago.com/js/v2';
function carregarSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.MercadoPago) return resolve();
    const exist = document.querySelector(`script[src="${SDK_URL}"]`);
    if (exist) { exist.addEventListener('load', () => resolve()); exist.addEventListener('error', () => reject(new Error('Falha ao carregar SDK do Mercado Pago'))); return; }
    const s = document.createElement('script'); s.src = SDK_URL; s.async = true;
    s.onload = () => resolve(); s.onerror = () => reject(new Error('Falha ao carregar SDK do Mercado Pago'));
    document.head.appendChild(s);
  });
}
const fmt = (n: any) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`;
export default function TelaPagamento({ usuario, candidaturaId }: { usuario: any; candidaturaId: number }) {
  const styles = useUaiFrilaStyles();
  const [pagamento, setPagamento] = useState<any>(null);
  const [resumo, setResumo] = useState<any>(null);
  const [chave, setChave] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [pagando, setPagando] = useState(false);
  const [brickPronto, setBrickPronto] = useState(false);
  const [tokenCartaoEfi, setTokenCartaoEfi] = useState('');
  const brickCtrl = useRef<any>(null);
  const brickCriadoPara = useRef<string>('');
  const carregar = async () => {
    setCarregando(true); setErro('');
    try {
      const d = await apiFetch(`/api/pagamentos/candidatura/${candidaturaId}`).catch(() => null);
      setPagamento(d?.pagamento || d?.data || null);
    } catch { setPagamento(null); }
    try {
      const r = await apiFetch(`/api/pagamentos/candidatura/${candidaturaId}/resumo`);
      setResumo(r?.resumo || r?.data || null);
    } catch { setResumo(null); }
    try {
      const c = await apiFetch('/api/pagamentos/chave-publica');
      setChave(c?.data || null);
    } catch { setChave(null); }
    setCarregando(false);
  };
  useEffect(() => { if (candidaturaId) carregar(); }, [candidaturaId]);
  // Criar cobrança no backend a partir do que o Brick devolveu.
  const pagarComDados = async (fd: any) => {
    setPagando(true); setErro('');
    try {
      const pm = String(fd?.payment_method_id || fd?.paymentMethodId || '').toLowerCase();
      const metodo = pm === 'pix' ? 'pix' : 'cartao';
      const payer = fd?.payer || {};
      const ident = payer.identification || {};
      const d = await apiFetch('/api/pagamentos', { method: 'POST', body: JSON.stringify({
        candidatura_id: candidaturaId, metodo,
        token_cartao: fd?.token || undefined,
        parcelas: Number(fd?.installments || 1),
        payment_method_id: pm || undefined,
        issuer_id: fd?.issuer_id ? String(fd.issuer_id) : undefined,
        identification_tipo: ident.type || undefined,
        identification_numero: ident.number ? String(ident.number) : undefined,
      }) });
      const p = d?.pagamento || d?.data || null;
      setPagamento(p);
      if (metodo === 'pix' && !p?.qr_code) await carregar();
      if (metodo === 'cartao') await carregar();
    } catch (e: any) { setErro(e.message); }
    finally { setPagando(false); }
  };
  // Pix sem Brick (Efí, ou MP sem public key): botão simples gera o QR no backend.
  const pagarPixSimples = async () => { await pagarComDados({ payment_method_id: 'pix' }); };
  const pagarCartaoEfi = async () => {
    if (!tokenCartaoEfi.trim()) { setErro('Informe o token do cartão gerado pelo SDK da Efí'); return; }
    await pagarComDados({ payment_method_id: 'credit_card', token: tokenCartaoEfi.trim(), installments: 1 });
  };
  const reembolsar = async () => {
    if (!confirm('Pedir reembolso? Turnos já confirmados não voltam.')) return;
    try { await apiFetch(`/api/pagamentos/${pagamento.id}/reembolsar`, { method: 'POST', body: JSON.stringify({ motivo: 'Cancelado pelo contratante' }) }); await carregar(); }
    catch (e: any) { setErro(e.message); }
  };
  // Renderizar o Payment Brick (só MP + public key + sem pagamento concluído).
  const status = String(pagamento?.status || 'SEM_PAGAMENTO').toUpperCase();
  const usaBrick = String(chave?.provedor || resumo?.provedor || '').toUpperCase() === 'MERCADO_PAGO' && !!chave?.public_key && status !== 'EM_ESCROW' && status !== 'REEMBOLSADO';
  const amountBrick = Number(resumo?.total_cartao || pagamento?.total_cartao || pagamento?.total || 0);
  useEffect(() => {
    if (!usaBrick || !amountBrick) return;
    const chaveBrick = `${chave.public_key}|${amountBrick}|${candidaturaId}`;
    if (brickCriadoPara.current === chaveBrick) return;
    let cancelado = false;
    (async () => {
      try {
        await carregarSdk();
        if (cancelado) return;
        if (brickCtrl.current) { try { await brickCtrl.current.unmount(); } catch {} brickCtrl.current = null; }
        const mp = new window.MercadoPago(chave.public_key, { locale: 'pt-BR' });
        const bricks = mp.bricks();
        brickCtrl.current = await bricks.create('payment', 'paymentBrick_container', {
          initialization: { amount: amountBrick, payer: { email: usuario?.email || '', firstName: usuario?.nome_completo || usuario?.nome || '' } },
          customization: {
            // Só os métodos do UaiFrila: cartão + Pix. Sem boleto, sem carteira MP, sem débito.
            paymentMethods: { creditCard: 'all', debitCard: 'none', bankTransfer: ['pix'], ticket: 'none', mercadoPago: 'none' },
          },
          callbacks: {
            onReady: () => setBrickPronto(true),
            onSubmit: ({ formData }: any) => pagarComDados(formData),
            onError: (e: any) => setErro(e?.message || 'Erro no formulário de pagamento'),
          },
        });
        brickCriadoPara.current = chaveBrick;
      } catch (e: any) { if (!cancelado) setErro(e.message || 'Não foi possível carregar o checkout'); }
    })();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usaBrick, amountBrick, chave?.public_key, candidaturaId]);
  useEffect(() => () => { if (brickCtrl.current) { try { brickCtrl.current.unmount(); } catch {} } }, []);
  if (!candidaturaId) return <div className={styles.pageContainer}><div className={styles.card}><p className={styles.typography.body}>Escolha uma candidatura aceita em Meus Trampos para pagar.</p></div></div>;
  if (carregando) return <div className={styles.pageContainer}><div className={styles.card}><p className="animate-pulse">Carregando pagamento...</p></div></div>;
  const totalPix = Number(resumo?.total_pix ?? pagamento?.total_pix ?? 0);
  const totalCartao = Number(resumo?.total_cartao ?? pagamento?.total_cartao ?? pagamento?.total ?? 0);
  const economia = Number(resumo?.economia_pix ?? (totalCartao && totalPix ? totalCartao - totalPix : 0));
  return (<div className={styles.pageContainer}><h1 className={styles.typography.h1}>Pagamento</h1>
    {erro && <div className={styles.errorBox + ' mt-4'}>{erro}</div>}
    <div className={styles.card + ' mt-4'}>
      <p className={styles.typography.body}>Candidatura #{candidaturaId} • Status: <strong>{status}</strong></p>
      {!!pagamento?.total_centavos && <p className={styles.typography.h2 + ' mt-2'}>Total a pagar: {fmt(Number(pagamento.total_centavos) / 100)}</p>}
      {pagamento?.expira_em && <p className={styles.typography.bodySmall}>Prazo: {new Date(pagamento.expira_em).toLocaleString('pt-BR')}</p>}
      {status !== 'EM_ESCROW' && status !== 'REEMBOLSADO' && !!totalCartao && (
        <div className={styles.cardSmall + ' mt-4'}>
          <p className={styles.typography.body}><strong>Total no cartão: {fmt(totalCartao)}</strong></p>
          {!!totalPix && <p className={styles.typography.body}>Total no Pix: {fmt(totalPix)}</p>}
          {economia > 0 && <p className={styles.typography.body + ' mt-1'}>💰 Pagando com <strong>Pix</strong> você economiza <strong>{fmt(economia)}</strong> (Pix {fmt(totalPix)} • Cartão {fmt(totalCartao)})</p>}
          <p className={styles.typography.caption + ' mt-1'}>O valor final é calculado na hora, conforme o método que você escolher abaixo.</p>
        </div>
      )}
      {status !== 'EM_ESCROW' && status !== 'REEMBOLSADO' && (<>
        {usaBrick ? (<>
          {!chave?.public_key && <div className={styles.errorBox + ' mt-4'}>Public Key do Mercado Pago não cadastrada no admin — o checkout com cartão está indisponível. Cadastre em Provedores de Pagamento.</div>}
          <div className="mt-4"><div id="paymentBrick_container" /></div>
          {!brickPronto && <p className={styles.typography.bodySmall + ' mt-2 animate-pulse'}>Carregando checkout...</p>}
          {pagando && <p className={styles.typography.bodySmall + ' mt-2'}>Processando pagamento...</p>}
        </>) : (<>
          <p className={styles.typography.bodySmall + ' mt-4'}>Provedor ativo: {chave?.provedor || resumo?.provedor || '—'}. Pix abaixo; cartão pelo token da Efí.</p>
          <button onClick={pagarPixSimples} disabled={pagando} className={styles.buttonPrimary(pagando) + ' mt-4'}>{pagando ? 'Gerando...' : 'Gerar QR Pix'}</button>
          <div className="mt-4"><label className={styles.label}>Token do cartão (Efí — gerado no front pelo SDK do provedor, nunca digite o número aqui)</label><input value={tokenCartaoEfi} onChange={e => setTokenCartaoEfi(e.target.value)} className={styles.input} placeholder="token_..." /></div>
          <button onClick={pagarCartaoEfi} disabled={pagando} className={styles.buttonSecondary + ' mt-2'}>{pagando ? 'Gerando...' : 'Pagar com cartão (Efí)'}</button>
        </>)}
      </>)}
      {!!pagamento?.qr_code && <div className="mt-4"><p className={styles.typography.bodySmall}>Escaneie o QR Pix:</p><img src={pagamento.qr_code.startsWith('data:') ? pagamento.qr_code : `data:image/png;base64,${pagamento.qr_code}`} alt="QR Pix" style={{ maxWidth: 240 }} /></div>}
      {!!pagamento?.qr_code_url && <p className={styles.typography.bodySmall + ' mt-2'}><a href={pagamento.qr_code_url} target="_blank" rel="noreferrer">Abrir QR Pix</a></p>}
      {!!pagamento?.checkout_url && <p className={styles.typography.bodySmall + ' mt-2'}><a href={pagamento.checkout_url} target="_blank" rel="noreferrer">Abrir checkout</a></p>}
      {status === 'EM_ESCROW' && <div className="mt-4"><p className={styles.typography.bodySmall}>Pagamento confirmado e em escrow. O freela recebe por turno, 15 min após você confirmar cada turno.</p><button onClick={reembolsar} className={styles.buttonDanger + ' mt-2'}>Pedir reembolso</button></div>}
      {status === 'REEMBOLSADO' && <p className={styles.typography.bodySmall + ' mt-4'}>Reembolso concluído.</p>}
    </div></div>);
}
