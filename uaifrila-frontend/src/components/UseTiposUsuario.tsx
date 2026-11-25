import { useState, useEffect } from 'react';
import { apiGetPublic } from '../utils/Api';

export interface TipoUsuario {
  id: number;
  chave: string;
  nome_exibicao: string;
  descricao?: string;
  nivel_permissao: number;
}

let cacheTipos: TipoUsuario[] | null = null;
let cachePromise: Promise<TipoUsuario[]> | null = null;

export function useTiposUsuario() {
  const [tipos, setTipos] = useState<TipoUsuario[]>(cacheTipos || []);
  const [carregando, setCarregando] = useState(!cacheTipos);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (cacheTipos) {
      setTipos(cacheTipos);
      setCarregando(false);
      return;
    }
    if (cachePromise) {
      cachePromise.then(data => {
        setTipos(data);
        setCarregando(false);
      }).catch(e => {
        setErro(e.message);
        setCarregando(false);
      });
      return;
    }
    cachePromise = apiGetPublic('/api/tipos-usuario')
      .then(data => {
        const lista = data.tipos || data.data || data || [];
        cacheTipos = Array.isArray(lista) ? lista : [];
        console.log('[useTiposUsuario] Carregados', cacheTipos.length, 'tipos');
        return cacheTipos;
      })
      .catch((e: any) => {
        cacheTipos = null; cachePromise = null;
        throw new Error(e?.message || 'Falha ao carregar tipos de usuário em /api/tipos-usuario');
      });
      
    cachePromise
      .then(data => {
        setTipos(data);
        setCarregando(false);
      })
      .catch(e => {
        setErro(e.message);
        setCarregando(false);
      });
  }, []);

  const getById = (id: number): TipoUsuario | undefined => tipos.find(t => t.id === id);
  const getByChave = (chave: string): TipoUsuario | undefined => {
    if (!chave) return undefined;
    return tipos.find(t => t.chave.toUpperCase() === chave.toUpperCase());
  };

  const getTipoUsuario = (usuario: any): TipoUsuario | null => {
    if (!usuario) return null;
    if (usuario.tipo_chave) {
      const porChave = getByChave(usuario.tipo_chave);
      if (porChave) return porChave;
      return {
        id: usuario.tipo_usuario_id || 0,
        chave: usuario.tipo_chave.toUpperCase(),
        nome_exibicao: usuario.tipo_nome || usuario.tipo_chave,
        descricao: '',
        nivel_permissao: usuario.nivel_permissao ?? 0
      };
    }
    if (usuario.tipo_usuario_id) {
      const porId = getById(usuario.tipo_usuario_id);
      if (porId) return porId;
    }
    return null;
  };

  const getBadgeVariant = (usuario: any): 'default' | 'success' | 'warning' | 'danger' => {
    const tipo = getTipoUsuario(usuario);
    const chave = tipo?.chave?.toUpperCase() || (usuario?.tipo_chave || '').toUpperCase();
    if (['SUPER_ADMIN','ADMIN'].includes(chave)) return 'danger';
    if (chave === 'CONTRATANTE') return 'warning';
    if (chave === 'DUAL') return 'warning';
    return 'success';
  };

  return { tipos, carregando, erro, getById, getByChave, getTipoUsuario, getBadgeVariant };
}

export default useTiposUsuario;
