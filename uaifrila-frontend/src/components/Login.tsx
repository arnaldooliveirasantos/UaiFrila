import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import ValidacaoCodigo from './ValidacaoCodigo';
import LogoIcone from './LogoIcone';
import { apiFetch, setToken } from '../utils/Api';

export default function Login({ onLogin }: { onLogin?: (usuario: any) => void }) {
  const { styles, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [etapa, setEtapa] = useState<'email' | 'codigo'>('email');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [codigoDebug, setCodigoDebug] = useState('');
  const [codigoDaUrl, setCodigoDaUrl] = useState('');
  const [autoValidarDoLink, setAutoValidarDoLink] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const codigoUrl = (params.get('codigo') || '').replace(/\D/g, '').slice(0, 6);
      const emailUrl = params.get('email') ? decodeURIComponent(params.get('email')!) : '';
      const tipoUrl = params.get('tipo') || 'login';
      console.log('[Login] URL atual:', window.location.href, { codigoUrl, emailUrl, tipoUrl });
      if (codigoUrl.length === 6 && emailUrl.includes('@')) {
        setEmail(emailUrl);
        setCodigoDaUrl(codigoUrl);
        setAutoValidarDoLink(true);
        setEtapa('codigo');
        console.log('[Login] Link detectado - indo para validação com autoValidar=true');
      }
    } catch (e) { console.warn('[Login] erro ao ler URL:', e); }
  }, []);

  const solicitarCodigo = async () => {
    if (!email.includes('@')) { setErro('E-mail inválido'); return; }
    setCarregando(true); setErro(''); setCodigoDebug('');
    setAutoValidarDoLink(false); setCodigoDaUrl('');
    try {
      const data: any = await apiFetch('/auth/solicitar-codigo', { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase(), tipo: 'login' }) });
      console.log('[Login] solicitar-codigo resposta:', data);
      if (data.token) {
        const usuario = data.usuario || data.data?.usuario;
        setToken(data.token);
        if (usuario) localStorage.setItem('uaifrila_usuario', JSON.stringify(usuario));
        onLogin?.(usuario); return;
      }
      if (data.codigo_debug) setCodigoDebug(data.codigo_debug);
      setEtapa('codigo');
    } catch (e: any) { setErro(e.message || 'Erro ao enviar código'); } finally { setCarregando(false); }
  };

  const handleValidado = (data: any) => {
    const token = data?.token || data?.data?.token;
    const usuario = data?.usuario || data?.data?.usuario;
    if (token) setToken(token);
    if (usuario) localStorage.setItem('uaifrila_usuario', JSON.stringify(usuario));
    if (token && usuario) { onLogin?.(usuario); return; }
    setErro('Validação ok mas sem token');
  };

  if (etapa === 'codigo') {
    return (<>
      {codigoDebug && !autoValidarDoLink && (<div className="mx-auto max-w-md mt-4 p-3 bg-yellow-100 border-2 border-black text-xs font-black text-center">🧪 DEV - código: {codigoDebug} (digite abaixo, não valida sozinho)</div>)}
      <ValidacaoCodigo email={email} tipo="login" codigoInicial={autoValidarDoLink ? codigoDaUrl : undefined} autoValidarDoLink={autoValidarDoLink} onValidado={handleValidado} onVoltar={() => { setEtapa('email'); setCodigoDebug(''); setAutoValidarDoLink(false); setCodigoDaUrl(''); try { window.history.replaceState({}, '', window.location.pathname); } catch {} }} />
    </>);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className={`w-full max-w-md p-8 border-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
        <div className="flex flex-col items-center mb-6"><LogoIcone size={56} /><h2 className="mt-4 text-2xl font-black uppercase">Login - Apenas E-mail</h2><p className={`mt-2 text-xs text-center ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>Sem senha. Código de 6 dígitos por e-mail, válido 5 min.</p></div>
        <div className="space-y-4">
          <div><label className="text-xs font-black uppercase">E-mail cadastrado</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className={`mt-1 w-full px-4 py-3 text-sm border-2 focus:outline-none ${isDark ? 'bg-black text-white border-white' : 'bg-white text-black border-black'}`} onKeyDown={(e) => e.key === 'Enter' && solicitarCodigo()} /></div>
          {erro && <div className="p-3 bg-[#E53935] text-white border-2 border-black text-xs font-bold">❌ {erro}</div>}
          <button type="button" onClick={solicitarCodigo} disabled={carregando || !email} className={`w-full py-4 font-black uppercase text-sm border-2 border-black ${isDark ? 'bg-[#0066FF] text-white' : 'bg-black text-white'} ${carregando ? 'opacity-50' : ''}`}>{carregando ? 'Enviando código...' : 'Enviar Código por E-mail 📧'}</button>
        </div>
      </div>
    </div>
  );
}
