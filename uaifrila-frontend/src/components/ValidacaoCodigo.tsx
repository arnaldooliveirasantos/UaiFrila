import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import LogoIcone from './LogoIcone';

interface Props {
  email: string;
  tipo: 'cadastro' | 'login';
  onValidado: (dados: { token: string; usuario: any }) => void;
  onVoltar: () => void;
}

export default function ValidacaoCodigo({ email, tipo, onValidado, onVoltar }: Props) {
  const { isDark } = useTheme();
  const [codigo, setCodigo] = useState(['','','','','','']);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [tempo, setTempo] = useState(300);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    const timer = setInterval(() => setTempo(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { inputsRef.current[0]?.focus(); }, []);

  const formatarTempo = (seg: number) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m}:${s.toString().padStart(2,'0')}`;
  };

  const handleChange = (index: number, valor: string) => {
    if (!/^[0-9]?$/.test(valor)) return;
    const novo = [...codigo];
    novo[index] = valor;
    setCodigo(novo);
    setErro('');
    if (valor && index < 5) inputsRef.current[index + 1]?.focus();
    if (novo.every(d => d !== '') && novo.join('').length === 6) validar(novo.join(''));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codigo[index] && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === 'Enter') validar(codigo.join(''));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0,6).split('');
    if (pasted.length === 6) { setCodigo(pasted); validar(pasted.join('')); }
  };

  const validar = async (codigoCompleto?: string) => {
    const cod = codigoCompleto || codigo.join('');
    if (cod.length !== 6) { setErro('Digite 6 dígitos'); return; }
    setCarregando(true); setErro('');
    try {
      const res = await fetch(`${API}/auth/verificar-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo: cod })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Código inválido');
      
      console.log('✅ Validado - resposta:', data);
      console.log('Token:', data.token?.substring(0,20));
      console.log('Usuario:', data.usuario, 'status_usuario_id:', data.usuario?.status_usuario_id);
      
      // Salva token e usuario com status ATIVO
      localStorage.setItem('uaifrila_token', data.token);
      localStorage.setItem('uaifrila_usuario', JSON.stringify(data.usuario));
      
      // Mostra que mudou de 1 para 2
      if (data.usuario?.status_usuario_id === 2 || data.usuario?.status_chave === 'ATIVO') {
        console.log('✅ Usuario agora ATIVO - status_usuario_id = 2');
      }
      
      onValidado({ token: data.token, usuario: data.usuario });
    } catch (e:any) {
      setErro(e.message);
      setCodigo(['','','','','','']);
      inputsRef.current[0]?.focus();
    } finally { setCarregando(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className={`w-full max-w-md p-8 border-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
        <div className="flex flex-col items-center mb-6">
          <LogoIcone size={56} />
          <h2 className="mt-4 text-2xl font-black uppercase">{tipo === 'cadastro' ? 'Validar Cadastro' : 'Validar Login'}</h2>
          <p className={`mt-2 text-xs text-center ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
            Código enviado para<br/><span className="font-black">{email}</span>
          </p>
          <div className={`mt-2 p-2 text-[10px] font-mono border ${isDark ? 'border-yellow-600 bg-yellow-900/20 text-yellow-200' : 'border-black bg-yellow-100 text-black'}`}>
            Status atual: status_usuario_id = 1 (AGUARDANDO_VALIDACAO)<br/>
            Após validar → status_usuario_id = 2 (ATIVO)
          </div>
        </div>

        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
          {codigo.map((dig, i) => (
            <input
              key={i}
              ref={el => inputsRef.current[i] = el}
              value={dig}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              maxLength={1}
              inputMode="numeric"
              className={`w-12 h-14 text-center text-xl font-black border-2 focus:outline-none ${isDark ? 'bg-black text-white border-white' : 'bg-white text-black border-black'} ${erro ? 'border-[#E53935] bg-red-50' : ''}`}
            />
          ))}
        </div>

        {erro && <div className="mb-4 p-3 bg-[#E53935] text-white border-2 border-black text-xs font-bold text-center">❌ {erro}</div>}

        <button
          onClick={() => validar()}
          disabled={carregando || codigo.join('').length !== 6}
          className={`w-full py-4 font-black uppercase text-sm border-2 border-black ${codigo.join('').length === 6 ? (isDark ? 'bg-[#0066FF] text-white' : 'bg-black text-white') : 'bg-zinc-300 text-zinc-500'} ${carregando ? 'opacity-50' : ''}`}
        >
          {carregando ? 'Validando...' : 'Validar → ATIVO (status 2) ✅'}
        </button>

        <div className="flex justify-between items-center mt-4">
          <button onClick={onVoltar} className="text-xs font-bold underline">← Voltar</button>
          <span className="text-xs font-mono">Expira em {formatarTempo(tempo)}</span>
        </div>
      </div>
    </div>
  );
}