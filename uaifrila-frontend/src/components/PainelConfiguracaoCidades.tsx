import React, { useEffect, useState } from 'react';
import { CidadeService, Cidade } from '../services/CidadeService';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

export default function PainelConfiguracaoCidades() {
  const styles = useUaiFrilaStyles();
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = async () => {
    setCarregando(true);
    try {
      // Tenta instância e estático, compatível com ambos
      let lista: Cidade[] = [];
      try {
        const service = new CidadeService();
        lista = await service.listarTodas();
      } catch {
        lista = await CidadeService.listarTodas();
      }
      setCidades(lista);
    } catch (e:any) { 
      console.warn('[Cidades] erro', e.message);
      setErro(e.message); 
    } finally { setCarregando(false); }
  };

  useEffect(()=>{ carregar(); }, []);

  const toggleAtiva = async (cidade: Cidade) => {
    try {
      const novaAtiva = !(cidade.ativa ?? (cidade as any).ativo);
      try {
        const service = new CidadeService();
        await service.atualizarStatus(cidade.id, novaAtiva);
      } catch {
        await CidadeService.atualizarStatus(cidade.id, novaAtiva);
      }
      await carregar();
    } catch (e:any) { setErro(e.message); }
  };

  if (carregando) return <div className={styles.pageContainer}><div className={styles.card}>Carregando cidades...</div></div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={styles.typography.h1}>Cidades - Tabela cidades ({cidades.length})</h2>
          <button onClick={carregar} className={styles.buttonSecondary}>Recarregar</button>
        </div>
        {erro && <div className={styles.errorBox}>{erro}</div>}
        <p className={`${styles.typography.caption} mt-2`}>Endereço ativo usa cidade_id - todas as cidades devem estar listadas</p>
        <div className="mt-6 space-y-3">
          {cidades.map(c => {
            const ativa = (c as any).ativa ?? (c as any).ativo ?? true;
            const sigla = (c as any).estado_sigla || (c as any).estado || (c as any).sigla || 'MG';
            return (
              <div key={c.id} className={`${styles.cardSmall} flex justify-between items-center`}>
                <span className="font-black text-sm">{c.nome} - {sigla} {ativa ? '🟢 Ativa' : '🔴 Inativa'}</span>
                <button onClick={()=>toggleAtiva(c)} className={`${ativa ? styles.buttonDanger : styles.buttonPrimary()} text-xs`}>
                  {ativa ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            );
          })}
          {cidades.length === 0 && (
            <div className={styles.cardSmall + ' text-center'}>
              <p className={styles.typography.body}>Nenhuma cidade encontrada</p>
              <p className={styles.typography.caption}>Verifique se backend está rodando: GET /api/cidades/todas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
