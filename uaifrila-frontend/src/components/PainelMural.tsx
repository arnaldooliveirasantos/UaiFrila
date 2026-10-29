import React, { useState, useEffect } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

interface Props {
  usuario?: any;
}

export default function PainelMural({ usuario: usuarioProp }: Props) {
  const styles = useUaiFrilaStyles();
  const [usuario, setUsuario] = useState<any>(usuarioProp);
  const [vagas, setVagas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const API = import.meta.env.VITE_API_URL;
  if (!API) throw new Error('VITE_API_URL não definida no .env - configure no arquivo .env');

  useEffect(() => {
    if (usuarioProp) setUsuario(usuarioProp);
    else {
      const u = localStorage.getItem('uaifrila_usuario');
      if (u) { try { setUsuario(JSON.parse(u)); } catch {} }
    }
  }, [usuarioProp]);

  useEffect(() => {
    const carregar = async () => {
      const token = localStorage.getItem('uaifrila_token');
      if (!token) { setErro('SEM_TOKEN'); setCarregando(false); return; }
      
      let usuarioAtual = usuario;
      if (!usuarioAtual) {
        const ls = localStorage.getItem('uaifrila_usuario');
        if (ls) { try { usuarioAtual = JSON.parse(ls); } catch {} }
      }

      try {
        const res = await fetch(`${API}/vagas/mural`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ 
            tipo: usuarioAtual?.tipo_chave || 'FREELA',
            usuarioId: usuarioAtual?.id 
          })
        });

        if (res.status === 401) {
          const data = await res.json().catch(() => ({}));
          if (data.erro?.includes('Token inválido') || data.erro?.includes('expirado')) {
            localStorage.removeItem('uaifrila_token');
            localStorage.removeItem('uaifrila_usuario');
            setErro('TOKEN_EXPIRADO');
          } else {
            setErro(data.precisa_validar ? 'AGUARDANDO_VALIDACAO' : 'TOKEN_EXPIRADO');
          }
          setCarregando(false);
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          let data: any = {};
          try { data = JSON.parse(text); } catch { data = { erro: text.slice(0,200) }; }
          throw new Error(data.erro || `Erro ${res.status}`);
        }

        const data = await res.json();
        setVagas(data.vagas || data.mural || data.data || []);
      } catch (e:any) { 
        console.error('Erro mural:', e);
        setErro(e.message); 
      } finally { 
        setCarregando(false); 
      }
    };
    carregar();
  }, [usuario]);

  if (!usuario && !localStorage.getItem('uaifrila_token')) {
    return (
      <div className={styles.pageContainerSmall + ' text-center py-16'}>
        <div className={styles.card}>
          <h2 className={styles.typography.h2}>Faça login para ver mural</h2>
          <p className={`${styles.typography.bodySmall} mt-2`}>Você precisa estar logado para acessar o mural de vagas</p>
        </div>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className={styles.pageContainer}>
        <p className={styles.typography.body}>Carregando mural...</p>
      </div>
    );
  }

  if (erro === 'TOKEN_EXPIRADO') {
    return (
      <div className={styles.pageContainerSmall + ' text-center py-16'}>
        <div className={styles.card}>
          <h2 className={styles.typography.h2}>Sessão expirada</h2>
          <p className={`${styles.typography.bodySmall} mt-2`}>Sua sessão expirou. Faça login novamente para continuar.</p>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/'; }} 
            className={styles.buttonPrimary() + ' mt-4'}
          >
            Ir para login
          </button>
        </div>
      </div>
    );
  }

  if (erro === 'AGUARDANDO_VALIDACAO') {
    return (
      <div className={styles.pageContainerSmall}>
        <div className={styles.card}>
          <h2 className={styles.typography.h2}>Valide seu e-mail</h2>
          <p className={`${styles.typography.bodySmall} mt-2`}>Enviamos um código para seu e-mail. Insira-o para liberar o acesso.</p>
        </div>
      </div>
    );
  }

  if (erro && erro !== 'SEM_TOKEN') {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.errorBox}>
          Não foi possível carregar o mural no momento. Tente novamente mais tarde.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={styles.typography.h1}>Mural de Vagas</h2>
        <span className={styles.badge('default')}>
          {usuario?.tipo_chave || 'FREELA'} • {vagas.length} vagas
        </span>
      </div>
      
      {vagas.length === 0 ? (
        <div className={styles.card + ' text-center'}>
          <p className={styles.typography.body}>Nenhuma vaga disponível no momento</p>
          <p className={styles.typography.caption + ' mt-2'}>Novas oportunidades aparecerão aqui assim que forem publicadas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vagas.map((v:any, i:number) => (
            <div key={v.id || i} className={styles.cardSmall}>
              <h3 className="font-black uppercase text-sm line-clamp-2">{v.titulo || v.funcao || v.nome || 'Vaga'}</h3>
              <p className={`text-xs mt-2 line-clamp-3 ${styles.isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                {v.descricao || v.detalhes || v.bairro || ''}
              </p>
              <div className="mt-3">
                <span className={styles.badge('success')}>
                  R$ {v.valor || v.valor_hora || '20'}/h
                </span>
                <span className={`${styles.badge('default')} ml-2`}>
                  {v.cidade_nome || v.bairro || 'Centro'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
