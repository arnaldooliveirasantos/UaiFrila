import React, { useState, useEffect } from 'react';
import CadastroUnificado from './CadastroUnificado';

interface Props {
  usuario?: any;
  onAtualizado?: (usuario: any) => void;
}

export default function PerfilUsuario({ usuario: usuarioProp, onAtualizado }: Props) {
  const [usuario, setUsuario] = useState<any>(usuarioProp);
  const [carregando, setCarregando] = useState(!usuarioProp);

  useEffect(() => {
    if (usuarioProp) {
      setUsuario(usuarioProp);
      setCarregando(false);
    } else {
      const ls = localStorage.getItem('uaifrila_usuario');
      const token = localStorage.getItem('uaifrila_token');
      if (ls && token) {
        setCarregando(true);
        // Busca dados completos da API
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/usuarios/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()).then(data => {
          setUsuario(data.usuario || JSON.parse(ls));
        }).catch(() => {
          try { setUsuario(JSON.parse(ls)); } catch {}
        }).finally(() => setCarregando(false));
      }
    }
  }, [usuarioProp]);

  if (carregando) {
    return <div className="p-8 text-center text-sm">Carregando cadastro...</div>;
  }

  // REUTILIZA a mesma página de cadastro em modo edição
  return (
    <CadastroUnificado 
      usuario={usuario} 
      modoEdicao={true} 
      onAtualizado={(u) => {
        setUsuario(u);
        onAtualizado?.(u);
      }} 
    />
  );
}