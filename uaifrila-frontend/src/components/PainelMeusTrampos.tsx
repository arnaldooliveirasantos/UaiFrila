import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

export default function PainelMeusTrampos() {
  const styles = useUaiFrilaStyles();
  const [vagas, setVagas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = async () => {
    setCarregando(true);
    setErro('');
    try {
      // Tenta /vagas/minhas, mas se der 400/403, trata como vazio (FREELA)
      let data: any = null;
      try {
        data = await apiFetch('/api/vagas/minhas');
      } catch (e: any) {
        const msg = e.message || '';
        console.warn('[MeusTrampos] falhou:', msg);
        // Se for ID da vaga inválido ou 403, é porque é FREELA ou sem vagas - retorna vazio
        if (msg.includes('ID da vaga inválido') || msg.includes('FREELA') || msg.includes('Acesso negado') || msg.includes('400') || msg.includes('403')) {
          console.log('[MeusTrampos] Usuario sem vagas publicadas (FREELA ou sem vagas)');
          setVagas([]);
          setCarregando(false);
          return;
        }
        throw e;
      }
      
      const lista = data.vagas || data.data || data || [];
      setVagas(Array.isArray(lista) ? lista : []);
    } catch (e: any) {
      console.error('[MeusTrampos] erro final', e.message);
      // Nunca mostra erro como ID da vaga inválido, mostra vazio
      if (e.message.includes('ID da vaga inválido')) {
        setVagas([]);
      } else {
        setErro(e.message);
      }
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const getUsuario = () => {
    try {
      const raw = localStorage.getItem('uaifrila_usuario');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const usuario = getUsuario();
  const tipoChave = (usuario?.tipo_chave || usuario?.tipo?.chave || 'FREELA').toUpperCase();
  const isContratante = tipoChave !== 'FREELA';

  if (carregando) {
    return <div className={styles.pageContainer}><div className={styles.card}>Carregando meus trampos...</div></div>;
  }

  if (!isContratante) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.card}>
          <h2 className={styles.typography.h1}>Meus Trampos (Vagas Publicadas)</h2>
          <div className={`${styles.cardSmall} mt-4 text-center`}>
            <p className={styles.typography.body}>Você está como FREELA ({tipoChave})</p>
            <p className={styles.typography.caption}>FREELA não publica vagas, apenas se candidata. Para publicar, vá em Perfil e mude seu tipo para CONTRATANTE, DUAL, etc.</p>
            <p className={`${styles.typography.bodySmall} mt-2`}>Todo usuário exceto FREELA é CONTRATANTE e pode publicar.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={styles.typography.h1}>Meus Trampos ({vagas.length}) - Publicadas</h2>
          <button onClick={carregar} className={styles.buttonSecondary}>Recarregar</button>
        </div>
        
        {erro && <div className={styles.errorBox}>{erro}</div>}
        
        {vagas.length === 0 ? (
          <div className={`${styles.cardSmall} text-center`}>
            <p className={styles.typography.body}>Você ainda não publicou nenhuma vaga</p>
            <p className={styles.typography.caption}>Vá em Publicar Vaga - seu endereço ativo {tipoChave} já vem marcado automaticamente</p>
          </div>
        ) : (
          <div className="space-y-3 mt-4">
            {vagas.map((v: any) => (
              <div key={v.id} className={styles.cardSmall}>
                <div className="flex justify-between">
                  <h3 className={styles.typography.h3}>{v.titulo || v.funcao} #{v.id}</h3>
                  <span className={styles.badge(v.status === 'ABERTA' ? 'success' : 'default')}>{v.status}</span>
                </div>
                <p className={styles.typography.bodySmall}>{v.descricao?.slice(0,100)}</p>
                <p className={styles.typography.caption}>{v.cidade_nome || ''} • {v.endereco || ''} • R$ {v.valor_servico || v.valor || ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
