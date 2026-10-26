import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  usuario?: any;
}

export default function PainelMural({ usuario: usuarioProp }: Props) {
  const { isDark } = useTheme();
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
        // SEM FALLBACK - apenas POST único para /vagas/mural
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
          // Token expirado - limpa e mostra erro
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
          throw new Error(data.erro || `Erro ${res.status}: ${text.slice(0,100)}`);
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
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className={`p-8 border-2 ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
          <h2 className="text-2xl font-black uppercase">Faça login para ver mural</h2>
          <p className="mt-2 text-xs">Você precisa estar logado para acessar o mural de vagas</p>
        </div>
      </div>
    );
  }

  if (carregando) {
    return <div className="max-w-4xl mx-auto px-4 py-8"><p className={`text-sm ${isDark ? 'text-white' : 'text-black'}`}>Carregando mural...</p></div>;
  }

  if (erro === 'TOKEN_EXPIRADO') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className={`p-8 border-2 ${isDark ? 'bg-red-900/20 border-red-600 text-red-100' : 'bg-red-100 border-black text-black'}`}>
          <h2 className="text-xl font-black uppercase">Sessão expirada</h2>
          <p className="mt-2 text-xs">Seu token expirou. Faça login novamente.</p>
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="mt-4 px-4 py-2 bg-black text-white border-2 border-black text-xs font-black uppercase">Ir para login</button>
        </div>
      </div>
    );
  }

  if (erro === 'AGUARDANDO_VALIDACAO') {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className={`p-8 border-2 ${isDark ? 'bg-yellow-900/20 border-yellow-600 text-yellow-100' : 'bg-yellow-100 border-black text-black'}`}>
          <h2 className="text-xl font-black uppercase">Valide seu e-mail</h2>
          <p className="mt-2 text-xs">Insira o código de 6 dígitos enviado por e-mail para liberar o mural.</p>
        </div>
      </div>
    );
  }

  if (erro && erro !== 'SEM_TOKEN') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className={`p-4 border-2 bg-red-100 border-black text-black text-xs font-bold`}>
          ❌ Erro no mural: {erro}
          <div className="mt-2 text-[10px]">API: {API}/vagas/mural - Verifique se backend está rodando e token é válido</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-black uppercase ${isDark ? 'text-white' : 'text-black'}`}>Mural de Vagas</h2>
        <span className={`text-[10px] px-2 py-1 border font-black uppercase ${isDark ? 'bg-zinc-800 text-white border-white/20' : 'bg-white text-black border-black/20'}`}>
          {usuario?.tipo_chave || 'FREELA'} • {vagas.length} vagas
        </span>
      </div>
      
      {vagas.length === 0 ? (
        <div className={`p-8 border-2 text-center ${isDark ? 'border-white/20 text-zinc-400' : 'border-black/20 text-zinc-600'}`}>
          <p className="text-sm">Nenhuma vaga no mural no momento</p>
          <p className="text-[10px] mt-2">Super admin vê todas as vagas, freela vê vagas de outros contratantes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vagas.map((v:any, i:number) => (
            <div key={v.id || i} className={`p-4 border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
              <h3 className="font-black uppercase text-sm">{v.titulo || v.funcao || v.nome || 'Vaga'}</h3>
              <p className="text-xs mt-2 line-clamp-3">{v.descricao || v.detalhes || v.bairro || ''}</p>
              <div className="mt-3 text-[10px]">R$ {v.valor || v.valor_hora || '20'}/h - {v.cidade_nome || v.bairro || 'Centro'}</div>
              <div className="mt-1 text-[9px] opacity-60">ID: {v.id} • Contratante: {v.contratante_id}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
