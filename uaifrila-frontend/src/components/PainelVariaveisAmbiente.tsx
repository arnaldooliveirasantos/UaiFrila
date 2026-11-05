import React, { useEffect, useState } from 'react';
import { VariavelService, VariavelSistema } from '../services/VariavelService';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

export default function PainelVariaveisAmbiente() {
  const styles = useUaiFrilaStyles();
  const [variaveis, setVariaveis] = useState<VariavelSistema[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [editando, setEditando] = useState<Record<string,string>>({});

  const carregar = async () => {
    setCarregando(true);
    try {
      // Tenta instancia primeiro, depois static
      let lista: any[] = [];
      try {
        const service = new VariavelService();
        lista = await service.listar();
      } catch {
        lista = await VariavelService.listar();
      }
      setVariaveis(lista);
    } catch (e: any) { 
      console.warn('[Variaveis] erro', e.message);
      setErro(e.message); 
    } finally { setCarregando(false); }
  };

  useEffect(()=>{ carregar(); }, []);

  const salvar = async (chave: string) => {
    try {
      const valor = editando[chave];
      if (!valor) return;
      const service = new VariavelService();
      await service.atualizar(chave, valor);
      await carregar();
      setEditando(prev => { const n = {...prev}; delete n[chave]; return n; });
    } catch (e: any) { setErro(e.message); }
  };

  if (carregando) return <div className={styles.pageContainer}><div className={styles.card}>Carregando variáveis...</div></div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={styles.typography.h1}>Variáveis - variaveis_sistema</h2>
          <button onClick={carregar} className={styles.buttonSecondary}>Recarregar</button>
        </div>
        {erro && <div className={styles.errorBox}>{erro}</div>}
        <p className={`${styles.typography.caption} mt-2`}>Total: {variaveis.length} variáveis • Edite e salve</p>
        
        <div className="mt-6 space-y-3">
          {variaveis.map(v => (
            <div key={v.chave} className={`${styles.cardSmall} flex justify-between items-center`}>
              <div className="flex-1">
                <p className={styles.typography.h3}>{v.chave}</p>
                <p className={styles.typography.caption}>{v.descricao || ''} • Cat: {v.categoria || 'geral'} • Num: {v.valor_numerico ?? '-'}</p>
                <p className={`${styles.typography.bodySmall} mt-1 font-mono`}>Atual: {v.valor}</p>
              </div>
              <div className="flex gap-2 items-center ml-4">
                <input value={editando[v.chave] ?? v.valor} onChange={e=>setEditando(p=>({...p,[v.chave]:e.target.value}))} className={styles.input + ' w-32'} />
                <button onClick={()=>salvar(v.chave)} className={styles.buttonPrimary()}>Salvar</button>
              </div>
            </div>
          ))}
          {variaveis.length === 0 && (
            <div className={styles.cardSmall + ' text-center'}>
              <p className={styles.typography.body}>Nenhuma variável encontrada. Verifique se o backend está rodando e se a tabela variaveis_sistema existe.</p>
              <p className={styles.typography.caption}>SELECT * FROM variaveis_sistema;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
