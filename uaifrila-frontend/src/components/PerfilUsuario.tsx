
import React, { useState, useEffect } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import CadastroUnificado from './CadastroUnificado';
import { useTiposUsuario } from './useTiposUsuario';

interface Props {
  usuario?: any;
  onAtualizado?: (usuario: any) => void;
}

export default function PerfilUsuario({ usuario: usuarioProp, onAtualizado }: Props) {
  const styles = useUaiFrilaStyles();
  const { getTipoUsuario, getBadgeVariant } = useTiposUsuario();
  const [usuario, setUsuario] = useState<any>(usuarioProp);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('uaifrila_token');
    const ls = localStorage.getItem('uaifrila_usuario');
    const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

    // Sempre busca do backend via view vw_usuarios_com_endereco_ativo para ter endereço
    if (token) {
      setCarregando(true);
      fetch(`${API}/usuarios/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.usuario) {
            console.log('[PerfilUsuario] Usuario completo da API com endereco_ativo:', {
              id: data.usuario.id,
              endereco_ativo_completo: data.usuario.endereco_ativo_completo,
              endereco_ativo_bairro: data.usuario.endereco_ativo_bairro,
              endereco_ativo_cep: data.usuario.endereco_ativo_cep,
              endereco_ativo_numero: data.usuario.endereco_ativo_numero,
              endereco_ativo_cidade: data.usuario.endereco_ativo_cidade,
              endereco_ativo_cidade_id: data.usuario.endereco_ativo_cidade_id
            });
            setUsuario(data.usuario);
            // Atualiza localStorage com dados completos
            localStorage.setItem('uaifrila_usuario', JSON.stringify(data.usuario));
          } else if (usuarioProp) {
            console.log('[PerfilUsuario] API não retornou usuario, usando prop', usuarioProp);
            setUsuario(usuarioProp);
          } else if (ls) {
            try { setUsuario(JSON.parse(ls)); } catch {}
          }
        })
        .catch((e) => {
          console.log('[PerfilUsuario] Erro ao buscar /usuarios/me, usando fallback', e);
          if (usuarioProp) setUsuario(usuarioProp);
          else if (ls) { try { setUsuario(JSON.parse(ls)); } catch { setErro('Não foi possível carregar o perfil'); } }
          else setErro('Não foi possível carregar o perfil');
        })
        .finally(() => setCarregando(false));
    } else {
      if (usuarioProp) {
        setUsuario(usuarioProp);
        setCarregando(false);
      } else if (ls) {
        try { 
          const parsed = JSON.parse(ls);
          console.log('[PerfilUsuario] Usando localStorage (sem endereco_ativo):', parsed);
          setUsuario(parsed); 
        } catch { setErro('Não foi possível carregar o perfil'); }
        setCarregando(false);
      } else {
        setCarregando(false);
      }
    }
  }, []); // Sempre busca na montagem para ter endereço atualizado

  // Atualiza se prop mudar
  useEffect(() => {
    if (usuarioProp?.id && usuarioProp?.endereco_ativo_completo) {
      console.log('[PerfilUsuario] Prop atualizada com endereco_ativo, atualizando estado');
      setUsuario(usuarioProp);
    }
  }, [usuarioProp]);

  if (carregando) {
    return (
      <div className={styles.pageContainerSmall}>
        <div className={styles.card}>
          <p className={`${styles.typography.body} animate-pulse`}>Carregando seu perfil com endereço...</p>
        </div>
      </div>
    );
  }

  const tipoDB = getTipoUsuario(usuario);
  const tipoChave = tipoDB?.chave?.toUpperCase() || usuario?.tipo_chave?.toUpperCase() || usuario?.role?.toUpperCase() || 'FREELA';
  const tipoNome = tipoDB?.nome_exibicao || tipoChave;

  return (
    <div className={styles.pageContainer}>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className={styles.typography.h1}>Meu Perfil</h1>
          <span className={styles.badge(getBadgeVariant(usuario))}>
            {tipoChave}
          </span>
        </div>
        {usuario?.nome_completo && (
          <p className={`${styles.typography.body} ${styles.isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
            Atualize suas informações quando precisar - endereço carregado da view
          </p>
        )}
      </div>

      {erro && (
        <div className={`${styles.errorBox} mb-4`}>
          {erro}
        </div>
      )}

      <div className={styles.card}>
        <CadastroUnificado
          usuario={usuario}
          modoEdicao={true}
          onAtualizado={(u) => {
            console.log('[PerfilUsuario] Atualizado:', u);
            setUsuario(u);
            localStorage.setItem('uaifrila_usuario', JSON.stringify(u));
            onAtualizado?.(u);
          }}
        />
      </div>

      {usuario && (
        <div className="mt-6 flex gap-2 flex-wrap">
          <span className={styles.badge('default')}>{usuario.email || 'sem e-mail'}</span>
          {usuario.endereco_ativo_cidade && <span className={styles.badge('default')}>📍 {usuario.endereco_ativo_cidade} - {usuario.endereco_ativo_bairro}</span>}
          {usuario.cidade_nome && !usuario.endereco_ativo_cidade && <span className={styles.badge('default')}>{usuario.cidade_nome}</span>}
          {usuario.endereco_ativo_bairro && <span className={styles.badge('default')}>{usuario.endereco_ativo_bairro}</span>}
          {usuario.endereco_ativo_cep && <span className={styles.badge('default')}>CEP {usuario.endereco_ativo_cep}</span>}
          <span className="text-[10px] font-mono opacity-50">ID {usuario.id} | Endereço ID {usuario.endereco_ativo_id || 'sem'}</span>
        </div>
      )}
    </div>
  );
}
