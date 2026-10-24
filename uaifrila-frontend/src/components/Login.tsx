import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import ValidacaoCodigo from './ValidacaoCodigo';
import LogoIcone from './LogoIcone';

export default function Login({ onLogin }: { onLogin?: (usuario: any) => void }) {
  const { styles, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [etapa, setEtapa] = useState<'email' | 'codigo'>('email');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const solicitarCodigo = async () => {
    if (!email.includes('@')) { setErro('E-mail inválido'); return; }
    setCarregando(true);
    setErro('');
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      
      if (data.sucesso && data.token) {
        // Login direto sem código (modo dev)
        localStorage.setItem('uaifrila_token', data.token);
        localStorage.setItem('uaifrila_usuario', JSON.stringify(data.usuario));
        onLogin?.(data.usuario);
      } else {
        // Precisa validar código
        setEtapa('codigo');
      }
    } catch (e:any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  };

  if (etapa === 'codigo') {
    return (
      <ValidacaoCodigo
        email={email}
        tipo="login"
        onValidado={({ usuario }) => onLogin?.(usuario)}
        onVoltar={() => setEtapa('email')}
      />
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className={`w-full max-w-md p-8 border-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
        <div className="flex flex-col items-center mb-6">
          <LogoIcone size={56} />
          <h2 className="mt-4 text-2xl font-black uppercase">Login - Apenas E-mail</h2>
          <p className={`mt-2 text-xs text-center ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>Sem senha, sem WhatsApp. Código enviado por e-mail.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-black uppercase">E-mail cadastrado</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className={`mt-1 w-full px-4 py-3 text-sm border-2 focus:outline-none ${isDark ? 'bg-black text-white border-white focus:border-[#0066FF]' : 'bg-white text-black border-black focus:border-[#E53935]'}`}
              onKeyDown={e => e.key === 'Enter' && solicitarCodigo()}
            />
          </div>

          {erro && <div className="p-3 bg-[#E53935] text-white border-2 border-black text-xs font-bold">❌ {erro}</div>}

          <button
            onClick={solicitarCodigo}
            disabled={carregando || !email}
            className={`w-full py-4 font-black uppercase text-sm border-2 border-black ${isDark ? 'bg-[#0066FF] text-white hover:bg-blue-600' : 'bg-black text-white hover:bg-zinc-800'} ${carregando ? 'opacity-50' : ''}`}
          >
            {carregando ? 'Enviando código...' : 'Enviar Código por E-mail 📧'}
          </button>

          <p className={`text-[10px] text-center ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Você receberá um código de 6 dígitos por e-mail válido por 5 minutos.
          </p>
        </div>
      </div>
    </div>
  );
}