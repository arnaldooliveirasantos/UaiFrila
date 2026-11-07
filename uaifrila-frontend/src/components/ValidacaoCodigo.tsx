import React, { useState, useEffect, useRef } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import { apiFetch, setToken } from '../utils/Api';

interface Props {
  email?: string;
  tipo?: 'cadastro' | 'login' | 'recuperacao';
  onValidado: (data: any) => void;
  onVoltar: () => void;
  codigoInicial?: string;
  autoValidarDoLink?: boolean;
}

export default function ValidacaoCodigo({ email: emailProp, tipo: tipoProp, onValidado, onVoltar, codigoInicial, autoValidarDoLink }: Props) {
  const styles = useUaiFrilaStyles();
  const [email, setEmail] = useState(emailProp || '');
  const [tipo] = useState(tipoProp || 'login');
  const [codigo, setCodigo] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [debug, setDebug] = useState('');
  const [tempoRestante, setTempoRestante] = useState(300);
  const [cooldownReenvio, setCooldownReenvio] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const validandoRef = useRef(false);
  const jaAutoValidouRef = useRef(false);

  // Sincroniza email que veio da URL (Login pode setar depois do mount)
  useEffect(() => { if (emailProp) setEmail(emailProp); }, [emailProp]);

  useEffect(() => {
    const t = setInterval(() => setTempoRestante((p) => (p <= 1 ? 0 : p - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (cooldownReenvio <= 0) return;
    const t = setTimeout(() => setCooldownReenvio((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldownReenvio]);

  const formatarTempo = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const validarCodigo = async (codigoParaValidar?: string, emailParaValidar?: string) => {
    const codigoFinal = (codigoParaValidar ?? codigo).trim();
    const emailFinal = (emailParaValidar ?? email ?? emailProp ?? '').trim().toLowerCase();
    console.log('[ValidacaoCodigo] validarCodigo chamado:', { codigo: codigoFinal, email: emailFinal, tipo });
    setDebug(`Tentando validar: codigo=${codigoFinal} email=${emailFinal} tipo=${tipo}`);
    if (codigoFinal.length !== 6) { setErro('Digite o código de 6 dígitos'); return; }
    if (!emailFinal.includes('@')) { setErro('E-mail inválido - volte e informe o e-mail'); return; }
    if (validandoRef.current) { console.log('[ValidacaoCodigo] já validando, ignorando'); return; }
    validandoRef.current = true;
    setCarregando(true); setErro(''); setSucesso('');
    try {
      // ATENÇÃO: Api.ts já tem /api na base (VITE_API_URL=http://...:3000/api)
      // Por isso o caminho é /auth/validar-codigo, NÃO /api/auth/validar-codigo (daria /api/api/...)
      const data: any = await apiFetch('/auth/validar-codigo', {
        method: 'POST',
        body: JSON.stringify({ email: emailFinal, codigo: codigoFinal, tipo }),
      });
      console.log('[ValidacaoCodigo] resposta validar-codigo:', data);
      const token = data.token || data.data?.token;
      const usuario = data.usuario || data.data?.usuario;
      if (!token || !usuario) {
        console.error('[ValidacaoCodigo] backend sem token/usuario:', data);
        throw new Error(`Backend retornou sem token/usuario. Resposta: ${JSON.stringify(data).slice(0, 300)} - verifique se AuthController.validarCodigo() é o REAL, não o mock`);
      }
      setToken(token);
      localStorage.setItem('uaifrila_usuario', JSON.stringify(usuario));
      localStorage.removeItem('uaifrila_validacao_pendente');
      try { window.history.replaceState({}, '', window.location.pathname); } catch {}
      setSucesso('Código validado! Entrando...');
      setTimeout(() => onValidado(data), 300);
    } catch (e: any) {
      console.error('[ValidacaoCodigo] erro validar:', e);
      setErro(e.message || 'Código inválido');
      setDebug(`Erro: ${e.message} | Verifique Network > validar-codigo > Response`);
    } finally {
      setCarregando(false);
      validandoRef.current = false;
    }
  };

  // Auto-valida SÓ do link, e espera o email chegar (emailProp pode chegar depois)
  useEffect(() => {
    if (!autoValidarDoLink) return;
    if (jaAutoValidouRef.current) return;
    if (!codigoInicial || codigoInicial.length !== 6) return;
    const emailAtual = (emailProp || email || '').trim();
    if (!emailAtual.includes('@')) {
      console.log('[ValidacaoCodigo] aguardando email da URL antes de auto-validar...');
      return; // espera o email chegar, não valida com email vazio
    }
    jaAutoValidouRef.current = true;
    setCodigo(codigoInicial);
    setSucesso('Link do e-mail detectado! Validando automaticamente...');
    console.log('[ValidacaoCodigo] auto-validando do link:', { codigo: codigoInicial, email: emailAtual });
    const t = setTimeout(() => validarCodigo(codigoInicial, emailAtual), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoValidarDoLink, codigoInicial, emailProp, email]);

  const reenviarCodigo = async () => {
    if (reenviando || cooldownReenvio > 0) return;
    if (!email) { setErro('Informe o e-mail'); return; }
    setReenviando(true); setErro(''); setSucesso('');
    try {
      await apiFetch('/auth/reenviar-codigo', { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase(), tipo }) });
      setCodigo(''); inputRefs.current[0]?.focus();
      setSucesso('Novo código enviado! Confira seu e-mail e digite o NOVO código.');
      setTempoRestante(300); setCooldownReenvio(60);
      jaAutoValidouRef.current = true; // novo código NÃO auto-valida
    } catch (e: any) { setErro(e.message || 'Erro ao reenviar'); } finally { setReenviando(false); }
  };

  const handleChangeDigito = (v: string, i: number) => {
    const val = v.replace(/\D/g, '').slice(-1);
    const novo = codigo.split(''); novo[i] = val; setCodigo(novo.join('')); setErro('');
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };
  const handleColar = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const texto = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!texto) return; setCodigo(texto); setErro(''); inputRefs.current[Math.min(texto.length, 5)]?.focus();
  };

  return (
    <div className={styles.pageContainerSmall}>
      <div className={styles.card}>
        <h1 className={styles.typography.h1}>Validar Código</h1>
        <p className={`${styles.typography.bodySmall} mt-2`}>Código de 6 dígitos enviado para {email || '(sem e-mail)'} • Expira em {formatarTempo(tempoRestante)}</p>
        {autoValidarDoLink && codigoInicial && <p className="text-[11px] mt-2 text-green-600 font-bold">✓ Link do e-mail detectado! Validando automaticamente... ({codigoInicial} / {email})</p>}
        {erro && <div className={`${styles.errorBox} mt-4`}>{erro}</div>}
        {sucesso && <div className={`${styles.successBox} mt-4`}>{sucesso}</div>}
        {debug && <div className="mt-2 p-2 bg-zinc-100 text-[11px] border">{debug}</div>}
        <div className="mt-6 space-y-4">
          <div><label className={styles.label}>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} className={styles.input} placeholder="seu@email.com" /></div>
          <div>
            <label className={styles.label}>Código de 6 dígitos</label>
            <div className="grid grid-cols-6 gap-2" onPaste={handleColar}>
              {[0, 1, 2, 3, 4, 5].map((i) => (<input key={i} ref={(el) => { inputRefs.current[i] = el; }} value={codigo[i] || ''} onChange={(e) => handleChangeDigito(e.target.value, i)} onKeyDown={(e) => { if (e.key === 'Backspace' && !codigo[i] && i > 0) inputRefs.current[i - 1]?.focus(); if (e.key === 'Enter') validarCodigo(); }} className={`${styles.input} text-center text-xl font-black`} maxLength={1} inputMode="numeric" autoComplete="one-time-code" />))}
            </div>
            <p className={`${styles.typography.caption} mt-2`}>Se o link não validou sozinho, confira o e-mail e clique em Validar.</p>
          </div>
          <button type="button" onClick={() => validarCodigo()} disabled={carregando || codigo.length !== 6} className={styles.buttonPrimary(carregando || codigo.length !== 6)}>{carregando ? 'Validando...' : 'Validar e Entrar'}</button>
          <div className="flex justify-between">
            <button type="button" onClick={reenviarCodigo} disabled={reenviando || cooldownReenvio > 0} className={styles.buttonSecondary}>{reenviando ? 'Reenviando...' : cooldownReenvio > 0 ? `Reenviar em ${cooldownReenvio}s` : 'Reenviar código'}{tempoRestante > 0 ? ` (${formatarTempo(tempoRestante)})` : ''}</button>
            <button type="button" onClick={onVoltar} className={styles.buttonGhost}>Voltar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
