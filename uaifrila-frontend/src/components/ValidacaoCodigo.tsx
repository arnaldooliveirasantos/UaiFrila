
import React, { useState, useEffect, useRef } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

const API = (import.meta as any).env?.VITE_API_URL || 'http://192.168.24.11:3000/api';

const STORAGE_KEY = 'uaifrila_validacao_pendente';

interface Props {
  email?: string;
  tipo?: 'cadastro' | 'login' | 'recuperacao';
  onValidado: (data: any) => void;
  onVoltar: () => void;
  codigoInicial?: string;
}

export default function ValidacaoCodigo({ email: emailProp, tipo: tipoProp, onValidado, onVoltar, codigoInicial }: Props) {
  const styles = useUaiFrilaStyles();
  
  const getStored = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  };

  const stored = getStored();

  const [email, setEmail] = useState(emailProp || stored?.email || '');
  const [tipo, setTipo] = useState<'cadastro' | 'login' | 'recuperacao'>(tipoProp || stored?.tipo || 'login');
  const [codigo, setCodigo] = useState(codigoInicial || '');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [tempoRestante, setTempoRestante] = useState(300);
  const [tentativas, setTentativas] = useState(stored?.tentativas || 0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // FIX 1: Sincroniza props que vêm da URL (email e codigo do link do e-mail)
  useEffect(() => {
    if (emailProp && emailProp !== email) {
      console.log('[Validacao] Email da URL/link:', emailProp);
      setEmail(emailProp);
    }
  }, [emailProp]);

  useEffect(() => {
    if (tipoProp && tipoProp !== tipo) {
      setTipo(tipoProp);
    }
  }, [tipoProp]);

  useEffect(() => {
    if (codigoInicial && codigoInicial !== codigo) {
      console.log('[Validacao] Código da URL/link:', codigoInicial);
      setCodigo(codigoInicial);
    }
  }, [codigoInicial]);

  useEffect(() => {
    if (email) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        email,
        tipo,
        timestamp: Date.now(),
        tentativas
      }));
    }
  }, [email, tipo, tentativas]);

  useEffect(() => {
    const storedTime = stored?.timestamp ? Math.floor((Date.now() - stored.timestamp) / 1000) : 0;
    const restanteInicial = Math.max(0, 300 - storedTime);
    setTempoRestante(restanteInicial);

    const timer = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // FIX 2: Auto-valida quando tem email e codigo da URL - depende de ambos
  useEffect(() => {
    const cod = codigoInicial || codigo;
    const em = emailProp || email;
    if (cod && cod.length === 6 && em) {
      console.log('[Validacao] Auto-validando código da URL:', cod, 'para', em);
      setCodigo(cod);
      if (em) setEmail(em);
      setTimeout(() => validarCodigo(cod, em), 800);
    }
  }, [codigoInicial, emailProp]); // depende de ambos da URL

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (email && !sucesso) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          email, tipo, timestamp: Date.now(), tentativas
        }));
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden && email) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          email, tipo, timestamp: Date.now(), tentativas
        }));
        console.log('[Validacao] Aba oculta - estado salvo');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [email, tipo, tentativas, sucesso]);

  const formatarTempo = (s: number) => {
    const m = Math.floor(s / 60);
    const seg = s % 60;
    return `${m}:${seg.toString().padStart(2, '0')}`;
  };

  const validarCodigo = async (codigoParaValidar?: string, emailParaValidar?: string) => {
    const cod = codigoParaValidar || codigo;
    const em = emailParaValidar || email;
    if (!cod || cod.length !== 6) {
      setErro('Digite o código de 6 dígitos');
      return;
    }
    if (!em) {
      setErro('E-mail não informado - volte e digite seu e-mail');
      return;
    }
    setCarregando(true);
    setErro('');
    try {
      console.log('[Validacao] Enviando para API:', { email: em, codigo: cod, tipo });
      const res = await fetch(`${API}/auth/validar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em, codigo: cod, tipo })
      });
      const data = await res.json();
      console.log('[Validacao] Resposta API:', res.status, data);
      if (!res.ok) throw new Error(data.erro || 'Código inválido');
      
      setSucesso('Código validado com sucesso!');
      localStorage.removeItem(STORAGE_KEY);
      
      setTimeout(() => onValidado(data), 800);
    } catch (e: any) {
      console.error('[Validacao] Erro:', e.message);
      setErro(e.message);
      setTentativas(t => t + 1);
      if (tentativas >= 4) {
        setErro('Muitas tentativas. Solicite um novo código.');
      }
    } finally {
      setCarregando(false);
    }
  };

  const reenviarCodigo = async () => {
    setCarregando(true);
    setErro('');
    try {
      const res = await fetch(`${API}/auth/reenviar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tipo })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao reenviar');
      setSucesso('Novo código enviado! Verifique seu e-mail.');
      setTempoRestante(300);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        email, tipo, timestamp: Date.now(), tentativas: 0
      }));
      setTentativas(0);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  };

  const cancelarCadastro = async () => {
    if (!confirm('Tem certeza que deseja cancelar?')) return;
    try {
      await fetch(`${API}/auth/cancelar-cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('uaifrila_cadastro_pendente');
      alert('Cadastro cancelado.');
      onVoltar();
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      onVoltar();
    }
  };

  const handleCodigoChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCodigo = codigo.split('');
    while (newCodigo.length < 6) newCodigo.push('');
    newCodigo[index] = digit;
    const joined = newCodigo.join('').slice(0, 6);
    setCodigo(joined);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (joined.length === 6) {
      setTimeout(() => validarCodigo(joined), 300);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCodigo(pasted);
      setTimeout(() => validarCodigo(pasted), 300);
    }
  };

  return (
    <div className={styles.pageContainerSmall}>
      <div className={styles.card}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className={styles.typography.h1}>
              {tipo === 'cadastro' ? 'Confirme seu cadastro' : 'Código de acesso'}
            </h2>
            <p className={`${styles.typography.bodySmall} mt-2 opacity-70`}>
              Enviamos um código de 6 dígitos para<br />
              <span className="font-black">{email || 'seu e-mail'}</span>
            </p>
            {codigoInicial && (
              <p className="text-[11px] mt-2 text-green-600 font-bold">✓ Link do e-mail detectado! Validando automaticamente...</p>
            )}
          </div>
          <span className={styles.badge(tempoRestante > 60 ? 'success' : 'warning')}>
            {formatarTempo(tempoRestante)}
          </span>
        </div>

        <div className={`${styles.valorBox} mt-4 !bg-yellow-50 !border-yellow-400`}>
          <div className="col-span-2 md:col-span-4 flex gap-2 text-[11px]">
            <span>📱</span>
            <span><b>Dica:</b> Link do e-mail expira em 5min. Se não funcionar, copie o código e cole aqui.</span>
          </div>
        </div>

        <div className="mt-6">
          <label className={styles.label}>Código de 6 dígitos *</label>
          <div className="grid grid-cols-6 gap-2 mt-2" onPaste={handlePaste}>
            {[0,1,2,3,4,5].map(i => (
              <input
                key={i}
                ref={el => inputRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={codigo[i] || ''}
                onChange={e => handleCodigoChange(e.target.value, i)}
                className={`${styles.input} !text-center !text-xl !font-black !h-[56px]`}
                autoFocus={i === 0}
              />
            ))}
          </div>
          <p className={`${styles.typography.caption} mt-2`}>Cole o código ou digite. Valida automaticamente.</p>
          {codigoInicial && <p className="text-[11px] mt-1 text-blue-600">Código da URL: {codigoInicial}</p>}
        </div>

        {erro && <div className={`${styles.errorBox} mt-4`}>❌ {erro}</div>}
        {sucesso && <div className={`${styles.successBox} mt-4`}>✅ {sucesso}</div>}

        <div className="mt-6 space-y-3">
          <button 
            onClick={() => validarCodigo()} 
            disabled={carregando || codigo.length !== 6} 
            className={styles.buttonPrimary(carregando || codigo.length !== 6)}
          >
            {carregando ? 'Validando...' : tipo === 'cadastro' ? 'Finalizar cadastro' : 'Entrar'}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={reenviarCodigo} disabled={carregando || tempoRestante > 240} className={styles.buttonSecondary}>
              {tempoRestante > 240 ? `Aguarde ${formatarTempo(tempoRestante - 240)}` : 'Reenviar código'}
            </button>
            <button onClick={onVoltar} className={styles.buttonSecondary}>
              Voltar
            </button>
          </div>

          <div className="border-t-2 border-dashed border-black/10 pt-4 mt-4">
            <p className={`${styles.typography.caption} text-center mb-2`}>Não foi você?</p>
            <button onClick={cancelarCadastro} className={styles.buttonGhost + ' !text-red-600 !underline'}>
              🚫 Não sou eu - Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
