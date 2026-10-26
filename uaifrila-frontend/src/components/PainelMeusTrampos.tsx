import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function PainelMeusTrampos() {
  const { isDark } = useTheme();
  const [vagas, setVagas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    let isMounted = true;
    
    const carregarMural = async () => {
      const token = localStorage.getItem('uaifrila_token');
      const usuarioStr = localStorage.getItem('uaifrila_usuario');
      
      if (!token) {
        if (isMounted) {
          setErro('Você não está logado - faça login novamente');
          setCarregando(false);
        }
        return;
      }

      // Verifica status_usuario_id
      if (usuarioStr) {
        try {
          const usuario = JSON.parse(usuarioStr);
          console.log('Usuario logado:', usuario, 'status_usuario_id:', usuario.status_usuario_id);
          if (usuario.status_usuario_id === 1 || usuario.status_chave === 'AGUARDANDO_VALIDACAO') {
            if (isMounted) {
              setErro('AGUARDANDO_VALIDACAO - Valide seu e-mail com o código de 6 dígitos para acessar o mural');
              setCarregando(false);
            }
            return;
          }
        } catch {}
      }

      try {
        // Usa GET e envia token
        const res = await fetch(`${API}/vagas/mural`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!isMounted) return;

        if (res.status === 401) {
          const text = await res.text();
          console.error('401 no mural:', text);
          setErro('Sessão expirada - faça login novamente. Token não autorizado.');
          // Limpa token inválido
          // localStorage.removeItem('uaifrila_token');
          setCarregando(false);
          return;
        }

        if (!res.ok) throw new Error(`Erro ${res.status}`);

        const data = await res.json();
        console.log('Mural carregado:', data);
        if (isMounted) {
          setVagas(data.vagas || data || []);
        }
      } catch (e:any) {
        console.error('Erro mural:', e);
        if (isMounted) setErro(e.message);
      } finally {
        if (isMounted) setCarregando(false);
      }
    };

    carregarMural();

    return () => { isMounted = false; };
  }, []); // Array vazio - só carrega uma vez, não em loop

  if (carregando) {
    return <div className="p-8 text-center">Carregando mural...</div>;
  }

  if (erro) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className={`p-8 border-2 ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
          <h2 className="text-xl font-black uppercase mb-4">⚠️ {erro.includes('AGUARDANDO_VALIDACAO') ? 'Valide seu e-mail' : 'Erro ao carregar mural'}</h2>
          <p className="text-sm mb-4">{erro}</p>
          {erro.includes('AGUARDANDO_VALIDACAO') ? (
            <div className="space-y-3">
              <p className="text-xs">Você está com status_usuario_id = 1 (AGUARDANDO_VALIDACAO). Precisa validar o código de 6 dígitos enviado por e-mail.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="w-full py-3 bg-[#FFC700] text-black border-2 border-black font-black uppercase text-xs"
              >
                Já validei - Recarregar
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem('uaifrila_token');
                  localStorage.removeItem('uaifrila_usuario');
                  window.location.href = '/';
                }} 
                className="w-full py-3 bg-white text-black border-2 border-black font-black uppercase text-xs"
              >
                Fazer login novamente
              </button>
            </div>
          ) : (
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-black text-white border-2 border-black font-black uppercase text-xs"
            >
              Tentar novamente
            </button>
          )}
          <div className="mt-4 p-3 bg-zinc-100 border-2 border-black/10 text-[10px] font-mono">
            Token: {localStorage.getItem('uaifrila_token')?.substring(0,20)}...<br/>
            Usuario: {localStorage.getItem('uaifrila_usuario')?.substring(0,100)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className={`text-2xl font-black uppercase mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Mural de Vagas</h2>
      {vagas.length === 0 ? (
        <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>Nenhuma vaga no momento</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vagas.map((v:any) => (
            <div key={v.id} className={`p-4 border-2 ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
              <h3 className="font-black uppercase text-sm">{v.titulo || v.funcao || 'Vaga'}</h3>
              <p className="text-xs mt-2">{v.descricao || v.bairro || ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}