import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
// Admin: provedores de pagamento. Segredos NUNCA voltam do backend (só tem_client_secret).
// Ao salvar, o segredo digitado é criptografado no backend (AES-256-GCM).
export default function PainelProvedoresPagamento() {
  const styles = useUaiFrilaStyles();
  const [lista, setLista] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(''); const [ok, setOk] = useState('');
  const [editando, setEditando] = useState<Record<string, any>>({});
  const carregar = async () => {
    setCarregando(true); setErro('');
    try { const d = await apiFetch('/api/admin/provedores-pagamento'); setLista(d?.data || []); }
    catch (e: any) { setErro(e.message); } finally { setCarregando(false); }
  };
  useEffect(() => { carregar(); }, []);
  const salvar = async (provedor: string) => {
    setErro(''); setOk('');
    try { await apiFetch(`/api/admin/provedores-pagamento/${provedor}`, { method: 'PUT', body: JSON.stringify(editando[provedor] || {}) }); setOk(`Provedor ${provedor} atualizado.`); await carregar(); }
    catch (e: any) { setErro(e.message); }
  };
  const ativar = async (provedor: string) => {
    setErro(''); setOk('');
    try { await apiFetch(`/api/admin/provedores-pagamento/${provedor}/ativar`, { method: 'POST' }); setOk(`Provedor ${provedor} ativado.`); await carregar(); }
    catch (e: any) { setErro(e.message); }
  };
  if (carregando) return <div className={styles.pageContainer}><div className={styles.card}><p className="animate-pulse">Carregando provedores...</p></div></div>;
  return (<div className={styles.pageContainer}><h1 className={styles.typography.h1}>Provedores de Pagamento</h1>
    <p className={styles.typography.body + ' mt-2'}>Só 1 provedor ativo por vez. As taxas daqui entram no total do contratante. Segredos são criptografados no servidor e nunca exibidos.</p>
    {erro && <div className={styles.errorBox + ' mt-4'}>{erro}</div>}
    {ok && <div className={styles.successBox + ' mt-4'}>{ok}</div>}
    {lista.map((p: any) => { const prov = p.provedor || p.nome; const ed = editando[prov] || {}; const set = (k: string, v: any) => setEditando((s) => ({ ...s, [prov]: { ...ed, [k]: v } })); return (
      <div key={prov} className={styles.card + ' mt-4'}>
        <div className="flex gap-2 items-center flex-wrap"><h2 className={styles.typography.h2}>{prov}</h2>{p.ativo ? <span className={styles.badge('success')}>ATIVO</span> : <span className={styles.badge('warning')}>Inativo</span>}<span className={styles.badge('default')}>Taxa Pix: {Number(p.taxa_pix_percentual ?? p.taxaPixPercentual ?? 0)}% • Cartão: {Number(p.taxa_cartao_percentual ?? p.taxaCartaoPercentual ?? 0)}%</span></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div><label className={styles.label}>Taxa Pix (%)</label><input type="number" step="0.01" defaultValue={p.taxa_pix_percentual ?? p.taxaPixPercentual} onChange={e => set('taxa_pix_percentual', Number(e.target.value))} className={styles.input} /></div>
          <div><label className={styles.label}>Taxa Cartão (%)</label><input type="number" step="0.01" defaultValue={p.taxa_cartao_percentual ?? p.taxaCartaoPercentual} onChange={e => set('taxa_cartao_percentual', Number(e.target.value))} className={styles.input} /></div>
          <div><label className={styles.label}>Ambiente</label><select defaultValue={p.ambiente || 'sandbox'} onChange={e => set('ambiente', e.target.value)} className={styles.select}><option value="sandbox">Sandbox</option><option value="producao">Produção</option></select></div>
          <div><label className={styles.label}>Client ID</label><input defaultValue={p.client_id || p.clientId || ''} onChange={e => set('client_id', e.target.value)} className={styles.input} /></div>
          <div><label className={styles.label}>Access token / Client secret {p.tem_client_secret ? '(já cadastrado — deixe em branco para manter)' : '(obrigatório para ativar)'}</label><input type="password" onChange={e => set('client_secret', e.target.value)} className={styles.input} placeholder="••••••••" /></div>
          <div><label className={styles.label}>Webhook secret {p.tem_webhook_secret ? '(já cadastrado)' : '(obrigatório para validar webhooks)'}</label><input type="password" onChange={e => set('webhook_secret', e.target.value)} className={styles.input} placeholder="••••••••" /></div>
          <div><label className={styles.label}>Chave Pix de recebimento</label><input defaultValue={p.pix_chave_recebimento || p.pixChaveRecebimento || ''} onChange={e => set('pix_chave_recebimento', e.target.value)} className={styles.input} /></div>
          {/* Patch 22: Public Key do Mercado Pago (chave PÚBLICA — pode ficar em texto puro).
              O front usa ela para inicializar o Checkout Bricks. Sem ela, o cartão via Bricks não renderiza. */}
          <div><label className={styles.label}>Public Key (Mercado Pago — para o Checkout Bricks)</label><input defaultValue={p.public_key || p.publicKey || ''} onChange={e => set('public_key', e.target.value)} className={styles.input} placeholder="APP_USR-..." /><p className={styles.typography.caption + ' mt-1'}>Só usada quando o provedor ativo é o Mercado Pago. Pegue em Mercado Pago → Suas integrações → Credenciais.</p></div>
        </div>
        <div className="flex gap-2 mt-4"><button onClick={() => salvar(prov)} className={styles.buttonPrimary(false)}>Salvar</button>{!p.ativo && <button onClick={() => ativar(prov)} className={styles.buttonSecondary}>Ativar este provedor</button>}</div>
      </div>); })}
  </div>);
}
