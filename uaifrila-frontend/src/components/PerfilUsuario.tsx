import React, { useState, useEffect } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import CadastroUnificado from './CadastroUnificado';
import { apiFetch } from '../utils/Api';

interface Props {
  usuario?: any;
  onAtualizado?: (usuario: any) => void;
}

export default function PerfilUsuario({ usuario: usuarioProp, onAtualizado }: Props) {
  const styles = useUaiFrilaStyles();
  const [usuario, setUsuario] = useState<any>(usuarioProp);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('uaifrila_token') || localStorage.getItem('token');
    if (!token) {
      setUsuario(usuarioProp || null);
      setCarregando(false);
      return;
    }

    const carregar = async () => {
      try {
        setCarregando(true);
        // Tenta /auth/me primeiro (existe no App.ts), depois /usuarios/me
        let data: any = null;
        try {
          data = await apiFetch('/api/auth/me');
        } catch {
          data = await apiFetch('/api/usuarios/me');
        }
        const u = data.usuario || data.data || data;
        if (u?.id) {
          setUsuario(u);
          localStorage.setItem('uaifrila_usuario', JSON.stringify(u));
        } else if (usuarioProp) {
          setUsuario(usuarioProp);
        }
      } catch (e: any) {
        console.warn('[PerfilUsuario] API falhou, usando prop:', e.message);
        if (usuarioProp) setUsuario(usuarioProp);
        else {
          const ls = localStorage.getItem('uaifrila_usuario');
          if (ls) { try { setUsuario(JSON.parse(ls)); } catch {} }
        }
      } finally {
        setCarregando(false);
      }
    };

    carregar();
  }, []);

  useEffect(() => {
    if (usuarioProp?.id) setUsuario(usuarioProp);
  }, [usuarioProp]);

  if (carregando) {
    return (
      <div className={styles.pageContainerSmall}>
        <div className={styles.card}>
          <p className={`${styles.typography.body} animate-pulse`}>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className={styles.pageContainerSmall}>
        <div className={styles.errorBox}>Não foi possível carregar o perfil - faça login novamente</div>
      </div>
    );
  }

  const tipoChave = usuario?.tipo_chave?.toUpperCase() || usuario?.tipo?.chave?.toUpperCase() || 'FREELA';
  const isContratante = tipoChave !== 'FREELA';

  return (
    <div className={styles.pageContainer}>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className={styles.typography.h1}>Meu Perfil</h1>
          <span className={styles.badge(isContratante ? 'success' : 'default')}>
            {tipoChave} {isContratante ? '(CONTRATANTE)' : '(FREELA)'}
          </span>
        </div>
        <p className={`${styles.typography.body} ${styles.isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
          Todo usuário exceto FREELA é CONTRATANTE e pode publicar vagas
        </p>
      </div>

      {erro && <div className={`${styles.errorBox} mb-4`}>{erro}</div>}

      <div className={styles.card}>
        <CadastroUnificado
          usuario={usuario}
          modoEdicao={true}
          onAtualizado={(u) => {
            setUsuario(u);
            localStorage.setItem('uaifrila_usuario', JSON.stringify(u));
            onAtualizado?.(u);
          }}
        />
      </div>
    </div>
  );
}
