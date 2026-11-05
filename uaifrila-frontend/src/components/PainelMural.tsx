import { useEffect, useState } from 'react';
import { apiGetPublic } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

export function PainelMural({ usuario }: { usuario?: any }) {
  const styles = useUaiFrilaStyles();
  const [vagas, setVagas] = useState<any[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const carregar = async () => {
      try {
        setLoading(true);
        setErro(null);
        let data;
        try {
          data = await apiGetPublic('/api/vagas/mural');
        } catch {
          data = await apiGetPublic('/api/vagas/abertas');
        }
        const lista = data?.vagas || data?.data || data?.mural || data || [];
        if (mounted) setVagas(Array.isArray(lista) ? lista : []);
      } catch (e: any) {
        if (mounted) setErro(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    carregar();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className={styles.pageContainer}><div className={styles.card}>Carregando mural...</div></div>;
  if (erro) return <div className={styles.pageContainer}><div className={styles.errorBox}>ERRO MURAL: {erro}</div></div>;

  return (
    <div className={styles.pageContainer}>
      <div className="flex items-center justify-between mb-6">
        <h1 className={styles.typography.h1}>Mural de Vagas ({vagas.length})</h1>
        <span className={styles.badge('success')}>Público</span>
      </div>
      
      <div className="grid gap-4">
        {vagas.map((vaga: any) => (
          <div key={vaga.id} className={styles.card}>
            <div className="flex justify-between items-start">
              <h3 className={styles.typography.h2}>{vaga.titulo || vaga.funcao}</h3>
              <span className={styles.badge('warning')}>{vaga.status || 'ABERTA'}</span>
            </div>
            <p className={`${styles.typography.body} mt-2`}>{vaga.descricao}</p>
            <div className={`${styles.valorBox} mt-3`}>
              <span>R$ {vaga.valor_total || vaga.valor_servico || vaga.valor || 0}</span>
              <span>{vaga.cidade_nome || vaga.cidade || ''} / {vaga.estado_sigla || vaga.estado || ''}</span>
              <span>{vaga.data_inicio ? new Date(vaga.data_inicio).toLocaleDateString() : ''}</span>
              <span>{vaga.funcao || ''}</span>
            </div>
          </div>
        ))}
        {vagas.length === 0 && (
          <div className={styles.cardSmall}>
            <p className={styles.typography.body}>Nenhuma vaga no mural - publique uma vaga!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PainelMural;
