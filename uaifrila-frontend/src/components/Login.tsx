import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Login({ onLogin }: { onLogin: (usuario: any, token: string) => void }) {
  const { styles } = useTheme();
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [etapa, setEtapa] = useState<'email' | 'codigo'>('email');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const solicitarCodigo = async () => {
    setLoading(true); setErro('');
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha: email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro');
      setEtapa('codigo');
    } catch (e: any) { setErro(e.message); } finally { setLoading(false); }
  };

  const verificarCodigo = async () => {
    setLoading(true); setErro('');
    try {
      const res = await fetch(`${API}/auth/verificar-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Código inválido ou expirado (5 min)');
      localStorage.setItem('@UaiFrila:token', data.token);
      onLogin(data.usuario, data.token);
    } catch (e: any) { setErro(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className={`p-8 ${styles.bgQuadros}`}>
        <h2 className="text-2xl font-black uppercase">Login - Código por E-mail (5 min)</h2>
        <p className="text-xs mt-2 opacity-70">Digite seu e-mail cadastrado, enviamos código de 6 dígitos com expiração de 5 minutos (variável EMAIL_EXPIRACAO_MINUTOS)</p>
        {erro && <div className="mt-4 p-3 bg-[#E53935] text-white text-xs font-bold">{erro}</div>}
        {etapa === 'email' ? (
          <div className="mt-6 space-y-4">
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className={`w-full px-4 py-3 text-sm ${styles.input}`} />
            <button onClick={solicitarCodigo} disabled={loading} className={`w-full py-3 font-black uppercase text-sm ${styles.btnPrimary}`}>{loading ? 'Enviando...' : 'Enviar Código'}</button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-xs">Código enviado para {email}</p>
            <input value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="000000" maxLength={6} className={`w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-black ${styles.input}`} />
            <button onClick={verificarCodigo} disabled={loading} className={`w-full py-3 font-black uppercase text-sm ${styles.btnPrimary}`}>{loading ? 'Verificando...' : 'Verificar Código'}</button>
            <button onClick={() => setEtapa('email')} className="w-full py-2 text-xs underline">Voltar</button>
          </div>
        )}
      </div>
    </div>
  );
}
