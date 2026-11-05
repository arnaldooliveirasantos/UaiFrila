
import React, { useEffect, useState } from 'react';
import { CidadeService, Cidade } from '../services/CidadeService';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

export default function PainelConfiguracaoCidades() {
  const styles = useUaiFrilaStyles();
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const cidadeService = new CidadeService();

  const carregar = async () => {
    setCarregando(true);
    try {
      const lista = await cidadeService.listarTodas();
      setCidades(lista);
    } catch (e:any) { setErro(e.message); }
    finally { setCarregando(false); }
  };

  useEffect(()=>{ carregar(); }, []);

  const toggleAtiva = async (cidade: Cidade) => {
    try {
      await cidadeService.atualizarStatus(cidade.id, !cidade.ativa);
      await carregar();
    } catch (e:any) { setErro(e.message); }
  };

  if (carregando) return <div className={styles.pageContainer}>Carregando cidades...</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <h2 className={styles.typography.h1}>Cidades - Tabela cidades</h2>
        {erro && <div className={styles.errorBox}>{erro}</div>}
        <div className="mt-6 space-y-3">
          {cidades.map(c => (
            <div key={c.id} className="flex justify-between items-center p-4 border-2 border-black">
              <span className="font-black text-sm">{c.nome} - {c.estado_sigla} {c.ativa ? '🟢' : '🔴'}</span>
              <button onClick={()=>toggleAtiva(c)} className={`${c.ativa ? styles.buttonDanger : styles.buttonPrimary()} text-xs`}>
                {c.ativa ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
