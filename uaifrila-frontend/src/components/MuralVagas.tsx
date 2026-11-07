import React, { useState, useEffect } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import { apiFetch, getToken } from '../utils/Api';

// Mural - PÚBLICO, chama SÓ /vagas/abertas (não /vagas/mural)
// Se der 401, mostra o erro real em vez de tela em branco

export default function MuralVagas({ onSelecionarVaga }: { onSelecionarVaga?: (v: any) => void }) {
  const styles = useUaiFrilaStyles();
  const [vagas, setVagas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    setCarregando(true); setErro('');
    try {
      const token = getToken();
      console.log('[Mural] carregando /vagas/abertas, token:', token ? 'SIM' : 'NÃO (mural é público, pode ir sem token)');
      const data: any = await apiFetch('/vagas/abertas', { method: 'GET' });
      console.log('[Mural] resposta /vagas/abertas:', data);
      const lista = Array.isArray(data) ? data : (data.data || data.vagas || []);
      if (!Array.isArray(lista)) {
        console.error('[Mural] backend não devolveu array:', data);
        setErro('Backend não devolveu lista de vagas - veja Console');
        setVagas([]);
      } else {
        setVagas(lista);
      }
    } catch (e: any) {
      console.error('[Mural] erro:', e, 'status:', e.status);
      if (e.status === 401) {
        setErro('Mural deu 401 - backend está exigindo login no /vagas/abertas. Aplique PATCH_App_vagas_publicas.txt (mural tem que ser público, antes de authMiddleware).');
      } else {
        setErro(e.message || 'Erro ao carregar mural');
      }
      setVagas([]);
    } finally { setCarregando(false); }
  };

  if (carregando) return <div className={styles.pageContainer}><p className={styles.typography.body}>Carregando mural...</p></div>;
  if (erro) return (
    <div className={styles.pageContainer}>
      <div className={`${styles.errorBox} mt-4`}>{erro}</div>
      <button type="button" onClick={carregar} className={`${styles.buttonPrimary(false)} mt-4`}>Tentar de novo</button>
      <div className="mt-4 p-3 bg-zinc-100 text-[11px] border">
        <p><b>Diagnóstico rápido (F12 → Console):</b></p>
        <p>1. localStorage.getItem('uaifrila_token') - tem que ter token depois de validar</p>
        <p>2. Network → vagas/abertas → Headers → Authorization: Bearer ... - tem que estar lá</p>
        <p>3. Se der 401 mesmo com token, o token pode estar expirado ou JWT_SECRET do backend mudou - faça logout e login de novo</p>
      </div>
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.typography.h1}>Mural de Vagas ({vagas.length})</h1>
      {vagas.length === 0 && <p className={`${styles.typography.body} mt-4`}>Nenhuma vaga aberta no momento.</p>}
      <div className="grid gap-4 mt-4">
        {vagas.map((v: any) => (
          <div key={v.id} className={styles.card} onClick={() => onSelecionarVaga?.(v)} style={{ cursor: 'pointer' }}>
            <h3 className={styles.typography.h3}>{v.titulo || v.descricao || `Vaga #${v.id}`}</h3>
            <p className={styles.typography.bodySmall}>{v.bairro || ''} {v.cidade || ''} • {v.valor_total ? `R$ ${v.valor_total}` : ''}</p>
            {v.calculo && <p className={styles.typography.bodySmall}>Recebe: R$ {v.calculo.valor_receber ?? v.calculo.valorReceber ?? '-'} • Transporte: R$ {v.calculo.valor_transporte ?? '-'}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
