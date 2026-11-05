
import React, { useEffect, useState } from 'react';
import { ExpansaoService } from '../services/ExpansaoService';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

export default function PainelExpansaoCidades() {
  const styles = useUaiFrilaStyles();
  const [cidades, setCidades] = useState<any[]>([]);
  const service = new ExpansaoService();

  useEffect(()=>{ service.listar().then(setCidades).catch(()=>{}); }, []);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <h2 className={styles.typography.h1}>Expansão</h2>
        <div className="mt-6 grid grid-cols-3 gap-4">
          {cidades.map((c:any)=><div key={c.id} className={styles.cardSmall}><p className="font-black">{c.cidade_nome}</p><p className="text-xs">Usuários: {c.usuarios} Vagas: {c.vagas}</p></div>)}
        </div>
      </div>
    </div>
  );
}
