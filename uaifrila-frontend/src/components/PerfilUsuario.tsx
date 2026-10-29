import React, { useState, useEffect } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import CadastroUnificado from './CadastroUnificado';

interface Props {
  usuario?: any;
  onAtualizado?: (usuario: any) => void;
}

export default function PerfilUsuario({ usuario: usuarioProp, onAtualizado }: Props) {
  const styles = useUaiFrilaStyles();
  const [usuario, setUsuario] = useState<any>(usuarioProp);
  const [carregando, setCarregando] = useState(!usuarioProp);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (usuarioProp) {
      setUsuario(usuarioProp);
      setCarregando(false);
    } else {
      const ls = localStorage.getItem('uaifrila_usuario');
      const token = localStorage.getItem('uaifrila_token');
      if (ls && token) {
        setCarregando(true);
        const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';
        fetch(`${API}/usuarios/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            setUsuario(data.usuario || JSON.parse(ls));
          })
          .catch(() => {
            try { setUsuario(JSON.parse(ls)); } catch { setErro('Não foi possível carregar o perfil'); }
          })
          .finally(() => setCarregando(false));
      } else {
        setCarregando(false);
      }
    }
  }, [usuarioProp]);

  if (carregando) {
    return (
      <div className={styles.pageContainerSmall}>
        <div className={styles.card}>
          <p className={`${styles.typography.body} animate-pulse`}>Carregando seu perfil...</p>
        </div>
      </div>
    );
  }

  const tipoChave = usuario?.tipo_chave || usuario?.tipoChave || 'FREELA';

  return (
    <div className={styles.pageContainer}>
      {/* Header do Perfil */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className={styles.typography.h1}>Meu Perfil</h1>
          <span className={styles.badge(
            tipoChave === 'CONTRATANTE' ? 'danger' :
            tipoChave === 'DUAL' ? 'warning' : 'success'
          )}>
            {tipoChave}
          </span>
        </div>
        {usuario?.nome_completo && (
          <p className={`${styles.typography.body} ${styles.isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
            Atualize suas informações quando precisar
          </p>
        )}
      </div>

      {erro && (
        <div className={`${styles.errorBox} mb-4`}>
          {erro}
        </div>
      )}

      {/* Reutiliza CadastroUnificado em modo edição - mantém toda lógica de validação, máscaras e submit */}
      <div className={styles.card}>
        <CadastroUnificado
          usuario={usuario}
          modoEdicao={true}
          onAtualizado={(u) => {
            setUsuario(u);
            onAtualizado?.(u);
          }}
        />
      </div>

      {/* Info adicional minimalista */}
      {usuario && (
        <div className="mt-6 flex gap-2">
          <span className={styles.badge('default')}>{usuario.email || 'sem e-mail'}</span>
          {usuario.cidade_nome && <span className={styles.badge('default')}>{usuario.cidade_nome}</span>}
        </div>
      )}
    </div>
  );
}
