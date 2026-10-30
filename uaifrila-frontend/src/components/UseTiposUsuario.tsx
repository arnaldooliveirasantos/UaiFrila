
import { useState, useEffect } from 'react';

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
    const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';
    cachePromise = fetch(`${API}/tipos-usuario`)
      .then(res => {
        if (!res.ok) throw new Error('Falha ao buscar tipos_usuario');
        return res.json();
      })
      .then(data => {
        const lista = data.tipos || data.data || data || [];
        cacheTipos = Array.isArray(lista) ? lista : [];
        console.log('[useTiposUsuario] Carregados', cacheTipos.length, 'tipos da tabela tipos_usuario');
        return cacheTipos;
      });
    cachePromise
      .then(data => {
        setTipos(data);
        setCarregando(false);
      })
      .catch(e => {
        console.error('[useTiposUsuario] Erro:', e.message);
        setErro(e.message);
        setCarregando(false);
      });
  }, []);

  const getById = (id: number): TipoUsuario | undefined => {
    return tipos.find(t => t.id === id);
  };

  const getByChave = (chave: string): TipoUsuario | undefined => {
    if (!chave) return undefined;
    return tipos.find(t => t.chave.toUpperCase() === chave.toUpperCase());
  };

  const getTipoUsuario = (usuario: any): TipoUsuario | null => {
    if (!usuario) return null;
    const roleUpper = (usuario.role || '').toUpperCase();
    if (roleUpper === 'SUPER_ADMIN' || roleUpper === 'ADMIN') {
      const porRole = getByChave(roleUpper);
      if (porRole) return porRole;
      return {
        id: usuario.tipo_usuario_id || (roleUpper === 'SUPER_ADMIN' ? 999 : 998),
        chave: roleUpper,
        nome_exibicao: roleUpper === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin',
        descricao: roleUpper === 'SUPER_ADMIN' ? 'Acesso total' : 'Administrador',
        nivel_permissao: roleUpper === 'SUPER_ADMIN' ? 100 : 90
      };
    }
    if (usuario.tipo_chave) {
      const porChave = getByChave(usuario.tipo_chave);
      if (porChave) return porChave;
      return {
        id: usuario.tipo_usuario_id || 0,
        chave: usuario.tipo_chave.toUpperCase(),
        nome_exibicao: usuario.tipo_nome || usuario.tipo_chave,
        descricao: usuario.tipo_descricao || '',
        nivel_permissao: usuario.nivel_permissao || 0
      };
    }
    if (usuario.tipo_usuario_id) {
      const porId = getById(usuario.tipo_usuario_id);
      if (porId) return porId;
      if (tipos.length === 0) return null;
    }
    return null;
  };

  const getBadgeVariant = (usuario: any): 'default' | 'success' | 'warning' | 'danger' => {
    const tipo = getTipoUsuario(usuario);
    if (!tipo) {
      const role = (usuario?.role || '').toUpperCase();
      if (role === 'SUPER_ADMIN') return 'default';
      if (role === 'ADMIN') return 'warning';
      return 'default';
    }
    const chave = tipo.chave.toUpperCase();
    if (chave === 'SUPER_ADMIN') return 'default';
    if (chave === 'ADMIN') return 'warning';
    if (chave === 'FINANCEIRO') return 'success';
    if (chave === 'DUAL') return 'warning';
    if (chave === 'CONTRATANTE') return 'danger';
    if (chave === 'FREELA') return 'success';
    return 'warning';
  };

  return { tipos, carregando, erro, getById, getByChave, getTipoUsuario, getBadgeVariant };
}
