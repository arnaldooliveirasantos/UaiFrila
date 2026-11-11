import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import CadastroUnificado from './CadastroUnificado';
import { useTiposUsuario } from './useTiposUsuario';

// ANTES (mock/fallback): se GET /usuarios/me falhasse, usava prop ou localStorage 'uaifrila_usuario' como se fosse dado real.
// AGORA (API real): a ÚNICA fonte é GET /api/auth/me. Se falhar, mostra erro da API e NÃO mostra perfil velho.
// localStorage só guarda token, nunca é fonte de verdade do usuário.

export default function PerfilUsuario({ usuario: usuarioProp, onAtualizado }: { usuario?: any; onAtualizado?: (u: any) => void }) {
  const styles = useUaiFrilaStyles();
  const { getTipoUsuario, getBadgeVariant } = useTiposUsuario();
  const [usuario, setUsuario] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    (async () => {
      setCarregando(true); setErro('');
      try {
        const data = await apiFetch('/api/auth/me');
        const u = data.usuario || data.data?.usuario || data;
        if (!u?.id) throw new Error('API /auth/me não retornou usuário');
        setUsuario(u);
      } catch (e: any) { setErro(e.message || 'Não foi possível carregar o perfil'); setUsuario(null); } finally { setCarregando(false); }
    })();
  }, []);

  if (carregando) return <div className={styles.pageContainerSmall}><div className={styles.card}><p className={`${styles.typography.body} animate-pulse`}>Carregando seu perfil...</p></div></div>;
  if (erro || !usuario) return <div className={styles.pageContainerSmall}><div className={styles.card}><div className={styles.errorBox}>{erro || 'Perfil não encontrado'}</div><p className={`${styles.typography.bodySmall} mt-3`}>Faça login novamente para carregar seu perfil da API.</p></div></div>;

  const tipoDB = getTipoUsuario(usuario);
  const tipoChave = tipoDB?.chave?.toUpperCase() || usuario?.tipo_chave?.toUpperCase() || 'FREELA';
  return (
    <div className={styles.pageContainer}>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between"><h1 className={styles.typography.h1}>Meu Perfil</h1><span className={styles.badge(getBadgeVariant(usuario))}>{tipoChave}</span></div>
      </div>
      <div className={styles.card}><CadastroUnificado usuario={usuario} modoEdicao={true} onAtualizado={(u: any) => { setUsuario(u); onAtualizado?.(u); }} /></div>
      {usuario && <div className="mt-6 flex gap-2 flex-wrap"><span className={styles.badge('default')}>{usuario.email || 'sem e-mail'}</span>{usuario.endereco_ativo_cidade && <span className={styles.badge('default')}>📍 {usuario.endereco_ativo_cidade} - {usuario.endereco_ativo_bairro}</span>}<span className="text-[10px] font-mono opacity-50">ID {usuario.id} | Endereço ID {usuario.endereco_ativo_id || 'sem'}</span></div>}
    </div>
  );
}
