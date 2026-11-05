
import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

export function PainelTransacoes() {
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiFetch('/api/transacoes/minhas')
      .then(data => { if (mounted) setTransacoes(data.transacoes || []); })
      .catch(e => { if (mounted) setErro(e.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <div>Carregando transacoes...</div>;
  if (erro) return <div>ERRO: {erro}</div>;
  return <div>Transacoes: {transacoes.length}</div>;
}
export default PainelTransacoes;
