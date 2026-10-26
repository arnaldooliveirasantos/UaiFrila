import React, { useState } from 'react';
import { useTheme, getInputClass, getLabelClass, getCardClass } from '../context/ThemeContext';

interface Props {
  email: string;
  tipo: 'cadastro' | 'login';
  onValidado: (dados: any) => void;
  onVoltar: () => void;
}

export default function ValidacaoCodigo({ email, tipo, onValidado, onVoltar }: Props) {
  const { isDark } = useTheme();
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const API = import.meta.env.VITE_API_URL;
  if (!API) throw new Error('VITE_API_URL não definida no .env - configure no arquivo .env');

  const validar = async () => {
    setCarregando(true); 
    setErro('');
    try {
      const res = await fetch(`${API}/auth/validar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo, tipo })
      });
      
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Backend retornou ${res.status} não-JSON. Verifique se API está rodando em ${API}. Resposta: ${text.slice(0,150)}`);
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Código inválido');
      onValidado(data);
    } catch (e:any) { 
      setErro(e.message); 
    } finally { 
      setCarregando(false); 
    }
  };

  const reenviar = async () => {
    setCarregando(true); 
    setErro('');
    try {
      const res = await fetch(`${API}/auth/reenviar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tipo })
      });
      
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Backend retornou ${res.status} não-JSON em reenviar-codigo`);
      }
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao reenviar');
      alert('Código reenviado para ' + email);
    } catch (e:any) { 
      setErro(e.message); 
    } finally { 
      setCarregando(false); 
    }
  };

  const inputClass = getInputClass(isDark);
  const labelClass = getLabelClass(isDark);
  const cardClass = getCardClass(isDark);

  return (
    <div className={`max-w-md mx-auto mt-8 ${cardClass}`}>
      <h2 className="text-2xl font-black uppercase tracking-tighter">Validar Código</h2>
      <p className={`mt-2 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Código enviado para <span className="font-bold">{email}</span></p>
      
      <div className="mt-6 flex flex-col gap-1">
        <label className={labelClass}>Código de 6 dígitos</label>
        <input 
          value={codigo} 
          onChange={e=>setCodigo(e.target.value.replace(/\D/g,'').slice(0,6))} 
          placeholder="000000" 
          className={`${inputClass} text-center text-2xl tracking-[0.5em] font-black`} 
          maxLength={6}
          inputMode="numeric"
        />
      </div>

      {erro && (
        <div className="mt-3 p-3 bg-[#E53935] text-white border-2 border-black text-xs font-bold break-words">
          ❌ {erro}
        </div>
      )}

      <button onClick={validar} disabled={carregando || codigo.length !== 6} className={`mt-6 w-full py-4 font-black uppercase text-sm border-2 border-black ${isDark ? 'bg-[#0066FF] text-white' : 'bg-black text-white'} ${carregando || codigo.length !== 6 ? 'opacity-50' : ''}`}>
        {carregando ? 'Validando...' : 'Validar'}
      </button>

      <div className="mt-3 flex gap-2">
        <button onClick={reenviar} disabled={carregando} className={`flex-1 py-3 font-black uppercase text-xs border-2 ${isDark ? 'bg-white text-black border-white' : 'bg-white text-black border-black'}`}>
          Reenviar
        </button>
        <button onClick={onVoltar} className={`flex-1 py-3 font-black uppercase text-xs border-2 ${isDark ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-zinc-100 text-black border-black/20'}`}>
          Voltar
        </button>
      </div>
    </div>
  );
}
