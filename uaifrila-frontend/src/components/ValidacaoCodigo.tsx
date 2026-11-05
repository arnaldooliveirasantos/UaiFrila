import React, { useState, useEffect, useRef } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import { apiFetch, setToken } from '../utils/Api';

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

  useEffect(() => {
    if (emailProp && emailProp !== email) {
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

  useEffect(() => {
    const cod = codigoInicial || codigo;
    const em = emailProp || email;
    if (cod && cod.length === 6 && em) {
      setCodigo(cod);
      if (em) setEmail(em);
      setTimeout(() => validarCodigo(cod, em), 800);
    }
  }, [codigoInicial, emailProp]);

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
      setErro('E-mail não informado');
      return;
    }
    setCarregando(true);
    setErro('');
    try {
      const data = await apiFetch('/api/auth/validar-codigo', {
        method: 'POST',
        body: JSON.stringify({ email: em, codigo: cod, tipo })
      });
      
      // Salva token usando setToken que agora existe
      const token = data.token || data.data?.token;
      const usuario = data.usuario || data.data?.usuario || data.data;
      
      if (token) setToken(token);
      if (usuario?.id) localStorage.setItem('uaifrila_usuario', JSON.stringify(usuario));
      
      localStorage.removeItem(STORAGE_KEY);
      setSucesso('Código validado!');
      setTimeout(() => onValidado(data), 500);
    } catch (e: any) {
      setErro(e.message || 'Código inválido');
      setTentativas(t => t + 1);
    } finally {
      setCarregando(false);
    }
  };

  const reenviarCodigo = async () => {
    if (!email) { setErro('Informe email'); return; }
    setCarregando(true);
    setErro('');
    try {
      await apiFetch('/api/auth/reenviar-codigo', {
        method: 'POST',
        body: JSON.stringify({ email, tipo })
      });
      setSucesso(`Código reenviado para ${email}`);
      setTempoRestante(300);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className={styles.pageContainerSmall}>
      <div className={styles.card}>
        <h1 className={styles.typography.h1}>Validar Código</h1>
        <p className={`${styles.typography.bodySmall} mt-2`}>Código de 6 dígitos enviado para {email || 'seu email'} • Expira em {formatarTempo(tempoRestante)}</p>

        {erro && <div className={`${styles.errorBox} mt-4`}>{erro}</div>}
        {sucesso && <div className={`${styles.successBox} mt-4`}>{sucesso}</div>}

        <div className="mt-6 space-y-4">
          <div>
            <label className={styles.label}>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} className={styles.input} placeholder="seu@email.com" />
          </div>
          <div>
            <label className={styles.label}>Código de 6 dígitos</label>
            <div className="grid grid-cols-6 gap-2">
              {[0,1,2,3,4,5].map(i => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  value={codigo[i] || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g,'').slice(-1);
                    const novo = codigo.split('');
                    novo[i] = val;
                    const cod = novo.join('');
                    setCodigo(cod);
                    if (val && i < 5) inputRefs.current[i+1]?.focus();
                    if (cod.length === 6) validarCodigo(cod);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !codigo[i] && i > 0) inputRefs.current[i-1]?.focus();
                  }}
                  className={`${styles.input} text-center text-xl font-black`}
                  maxLength={1}
                />
              ))}
            </div>
          </div>

          <button onClick={() => validarCodigo()} disabled={carregando || codigo.length !== 6} className={styles.buttonPrimary(carregando || codigo.length !== 6)}>
            {carregando ? 'Validando...' : 'Validar e Entrar'}
          </button>

          <div className="flex justify-between">
            <button onClick={reenviarCodigo} disabled={tempoRestante > 240} className={styles.buttonSecondary}>
              Reenviar {tempoRestante > 0 ? `(${formatarTempo(tempoRestante)})` : ''}
            </button>
            <button onClick={onVoltar} className={styles.buttonGhost}>Voltar</button>
          </div>

          <div className={styles.typography.caption}>
            Tentativas: {tentativas} • Tipo: {tipo}
          </div>
        </div>
      </div>
    </div>
  );
}
