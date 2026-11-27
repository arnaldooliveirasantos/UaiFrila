import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

// Tela de Transações — lista real (antes era um stub que só mostrava "Transacoes: N").
// Fonte: GET /api/transacoes/minhas (tabela transacoes, espelhada pelo PagamentoService).

const STATUS_LABEL: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  EM_ESCROW: 'Pago — em escrow',
  LIBERADO: 'Liberado ao freela',
  CANCELADO: 'Cancelado',
  REEMBOLSADO: 'Reembolsado',
  REEMBOLSO_PARCIAL: 'Reembolso parcial',
};

const fmtBRL = (v: any) => `R$ ${(Number(v) || 0).toFixed(2).replace('.', ',')}`;
const fmtData = (d: any) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export function PainelTransacoes({ usuario }: { usuario?: any }) {
  const styles = useUaiFrilaStyles();
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiFetch('/api/transacoes/minhas')
      .then((data: any) => {
        if (!mounted) return;
        const lista = Array.isArray(data) ? data : (data.transacoes || data.data || []);
        setTransacoes(Array.isArray(lista) ? lista : []);
      })
      .catch((e: any) => { if (mounted) setErro(e.message || 'Erro ao carregar transações'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className={styles.pageContainer}><p className={styles.typography.body}>Carregando transações...</p></div>;
  if (erro) return (
    <div className={styles.pageContainer}>
      <div className={styles.errorBox}>ERRO: {erro}</div>
      <button type="button" onClick={() => window.location.reload()} className={styles.buttonPrimary(false) + ' mt-4'}>Tentar de novo</button>
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.typography.h1}>Minhas transações ({transacoes.length})</h1>
      {transacoes.length === 0 && (
        <div className={styles.card + ' mt-4'}>
          <p className={styles.typography.body}>Nenhuma transação ainda.</p>
          <p className={styles.typography.bodySmall + ' mt-2'}>
            Uma transação aparece aqui assim que o contratante gera o pagamento da candidatura aceita
            (status "Aguardando pagamento") e muda para "Pago — em escrow" quando o pagamento é confirmado.
            O repasse ao freela acontece por turno, até 15 min após a confirmação do turno.
          </p>
        </div>
      )}
      <div className="grid gap-4 mt-4">
        {transacoes.map((t: any) => {
          const souContratante = usuario && Number(t.contratante_id ?? t.contratanteId) === Number(usuario.id);
          const valorPrincipal = souContratante
            ? (t.valor_total_contratante ?? t.valorTotalContratante)
            : (t.valor_liquido_freela ?? t.valorLiquidoFreela);
          return (
            <div key={t.id} className={styles.card}>
              <div className="flex justify-between items-start">
                <h3 className={styles.typography.h3}>{t.codigo || `Transação #${t.id}`}</h3>
                <span className={styles.badge('default')}>{STATUS_LABEL[String(t.status || '').toUpperCase()] || t.status || '—'}</span>
              </div>
              <p className={styles.typography.bodySmall + ' mt-1'}>
                Vaga #{t.vaga_id ?? t.vagaId ?? '—'}
                {' • '}
                {souContratante ? 'Você pagou' : 'Você recebe'}
                {' '}
                <b>{fmtBRL(valorPrincipal)}</b>
              </p>
              <p className={styles.typography.bodySmall}>
                Serviço + transporte: {fmtBRL(t.valor_base ?? t.valorBase)}
                {' • '}
                Método: {t.metodo_pagamento ?? t.metodoPagamento ?? t.metodo ?? '—'}
              </p>
              <p className={styles.typography.bodySmall}>
                Criada em: {fmtData(t.criado_em ?? t.criadoEm)}
                {' • '}
                Pagamento: {fmtData(t.data_pagamento ?? t.dataPagamento)}
                {' • '}
                Liberação: {fmtData(t.data_liberacao ?? t.dataLiberacao)}
              </p>
              {(t.observacoes) && <p className={styles.typography.caption + ' mt-1'}>{t.observacoes}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default PainelTransacoes;
