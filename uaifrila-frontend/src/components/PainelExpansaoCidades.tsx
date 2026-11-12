import React, { useEffect, useState } from 'react';
import { ExpansaoService } from '../services/ExpansaoService';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
// RESTAURADO: o App.tsx importa este arquivo na tela 'expansao-cidades'.
// NAO apagar de novo — ele NAO e duplicado do PainelExpansao.tsx:
//   PainelExpansao.tsx        = painel completo (cidades + solicitacoes de expansao)
//   PainelExpansaoCidades.tsx = lista simples de cidades em expansao (esta tela)
// CORRIGIDO: usa ExpansaoService (via Api) em vez de fetch direto; mostra erro/loading.
export default function PainelExpansaoCidades() {
  const styles = useUaiFrilaStyles();
  const [cidades, setCidades] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  useEffect(() => {
    let cancelado = false;
    const service = new ExpansaoService();
    service.listar()
      .then((lista) => { if (!cancelado) setCidades(Array.isArray(lista) ? lista : []); })
      .catch(() => { if (!cancelado) setErro('Nao foi possivel carregar as cidades em expansao.'); })
      .finally(() => { if (!cancelado) setCarregando(false); });
    return () => { cancelado = true; };
  }, []);
  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <h2 className={styles.typography.h1}>Expansao</h2>
        {carregando && <p className="mt-6 text-sm">Carregando...</p>}
        {!carregando && erro && <p className="mt-6 text-sm text-red-600">{erro}</p>}
        {!carregando && !erro && cidades.length === 0 && (
          <p className="mt-6 text-sm">Nenhuma cidade em expansao no momento.</p>
        )}
        {!carregando && !erro && cidades.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            {cidades.map((c: any) => (
              <div key={c.id} className={styles.cardSmall}>
                <p className="font-black">{c.cidade_nome}</p>
                <p className="text-xs">Usuarios: {c.usuarios ?? 0} Vagas: {c.vagas ?? 0}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
