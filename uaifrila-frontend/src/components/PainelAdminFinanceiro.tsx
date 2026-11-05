import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/Api';

export function PainelAdminFinanceiro() {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const carregar = async () => {
      try {
        setLoading(true);
        setErro(null);
        let lista: any[] = [];
        
        // Tenta /minhas primeiro (qualquer usuário), depois /transacoes (admin)
        try {
          const data = await apiFetch('/api/transacoes/minhas');
          lista = data?.data || data?.transacoes || data || [];
          if (!Array.isArray(lista)) lista = [];
        } catch (e: any) {
          if (e.message.includes('403') || e.message.includes('Acesso negado')) {
            console.warn('[Financeiro] /minhas falhou, tentando /transacoes como admin');
            try {
              const data2 = await apiFetch('/api/transacoes');
              lista = data2?.data || data2?.transacoes || data2 || [];
              if (!Array.isArray(lista)) lista = [];
            } catch (e2: any) {
              throw e2;
            }
          } else {
            throw e;
          }
        }
        
        if (mounted) setTransacoes(lista);
      } catch (e: any) {
        if (mounted) setErro(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    carregar();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="p-4">Carregando financeiro...</div>;
  if (erro) {
    // Se 403, mostra mensagem amigável
    if (erro.includes('403') || erro.includes('Acesso negado') || erro.includes('Requer')) {
      return (
        <div className="p-4 border-2 border-yellow-600 bg-yellow-50">
          <h3 className="font-black text-[14px]">Acesso Financeiro Restrito</h3>
          <p className="text-[12px] mt-2">Você precisa ser ADMIN, SUPER_ADMIN ou FINANCEIRO para ver todas as transações.</p>
          <p className="text-[11px] mt-1">Seu tipo: Uai Frila deve ser SUPER_ADMIN. Verifique token: {localStorage.getItem('uaifrila_token') ? 'token existe' : 'sem token'}</p>
          <p className="text-[10px] mt-2">Erro técnico: {erro}</p>
          <p className="text-[11px] mt-2">Mostrando suas transações em vez de todas:</p>
          <div className="mt-2">
            {transacoes.map((t: any) => (
              <div key={t.id} className="border p-2 mb-1 text-[11px]">{t.id} - {t.valor} - {t.status}</div>
            ))}
          </div>
        </div>
      );
    }
    return <div className="border-2 border-red-600 bg-red-50 p-4 text-[12px]">ERRO: {erro}</div>;
  }

  return (
    <div className="p-4 border-2 border-black bg-white">
      <h2 className="font-bold text-[14px] uppercase">Admin Financeiro ({transacoes.length})</h2>
      {transacoes.length === 0 ? (
        <div className="mt-4 text-[12px] text-zinc-600">Nenhuma transação.</div>
      ) : (
        <div className="mt-2 space-y-1">
          {transacoes.map((t: any) => (
            <div key={t.id} className="border-2 border-black p-2 text-[12px]">{t.id} - R$ {t.valor || t.valor_servico} - {t.status}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PainelAdminFinanceiro;
