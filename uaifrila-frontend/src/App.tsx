import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ValidacaoCodigo from './components/ValidacaoCodigo';
import CancelarCadastro from './components/CancelarCadastro';
import PainelMural from './components/PainelMural';
import PainelMeusTrampos from './components/PainelMeusTrampos';
import TelaCadastroVaga from './components/TelaCadastroVaga';
import CadastroUnificado from './components/CadastroUnificado';
import PerfilUsuario from './components/PerfilUsuario';
import MinhasFuncoes from './components/MinhasFuncoes';
import PainelTransacoes from './components/PainelTransacoes';
import PainelConfiguracaoCidades from './components/PainelConfiguracaoCidades';
import PainelVariaveisAmbiente from './components/PainelVariaveisAmbiente';
import PainelAdminFinanceiro from './components/PainelAdminFinanceiro';
import PainelPermissoesCategorias from './components/PainelPermissoesCategorias';
import PainelExpansaoCidades from './components/PainelExpansaoCidades';
import CodigoFreela from './components/CodigoFreela';
import { useUaiFrilaStyles } from './styles/uaifrila.styles';
import { apiFetch, apiGetPublic, setToken, clearAuth, getToken } from './utils/Api';

// ANTES (mock/fallback):
// - App lia localStorage 'uaifrila_usuario' e fingia que estava logado, sem validar o token na API.
// - TelaLogin fazia fetch direto para /auth/login com payload errado, sem usar apiFetch.
// - ?cancelar=true era ignorado (caía em ValidacaoCodigo).
// AGORA (API real):
// - Única fonte de login: GET /api/auth/me com o token. Se 401, limpa e vai para login.
// - Login: POST /api/auth/solicitar-codigo (tipo=login) -> ValidacaoCodigo -> POST /api/auth/validar-codigo.
// - /cancelar?codigo=... OU ?cancelar=true -> tela CancelarCadastro (NUNCA ValidacaoCodigo).
// - ?codigo=... (sem cancelar) -> tela ValidacaoCodigo.

function AppContent() {
  const [telaAtiva, setTelaAtiva] = useState('home');
  const [usuario, setUsuario] = useState<any>(null);
  const [codigoFromUrl, setCodigoFromUrl] = useState<string | null>(null);
  const [emailFromUrl, setEmailFromUrl] = useState<string | null>(null);
  const [cancelarFromUrl, setCancelarFromUrl] = useState(false);
  const [carregandoSessao, setCarregandoSessao] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get('codigo');
    const email = params.get('email') ? decodeURIComponent(params.get('email')!) : null;
    const tipo = params.get('tipo');
    // CANCELAR tem prioridade sobre VALIDAR e não depende só de ?cancelar=true.
    // O link do e-mail é /cancelar?codigo=...&email=... (SEM cancelar=true).
    // ANTES: só ?cancelar=true era reconhecido. /cancelar?codigo=... caía no else abaixo,
    // ia para ValidacaoCodigo tipo=login e auto-validava -> log "[validarCodigo REAL] LOGIN OK usuario=5"
    // em vez de cancelar. O usuário clicava em "cancelar" e acabava LOGADO.
    // AGORA: /cancelar, /cancelar-cadastro, /cancel OU ?cancelar=true => tela CancelarCadastro.
    const pathname = window.location.pathname.toLowerCase();
    const isCancelarPath = pathname.includes('cancelar') || pathname === '/cancel' || pathname.endsWith('/cancel');
    const cancelar = params.get('cancelar') === 'true' || isCancelarPath;
    if (cancelar && codigo && email) { setCancelarFromUrl(true); setCodigoFromUrl(codigo); setEmailFromUrl(email); }
    else if (codigo && email) { setCodigoFromUrl(codigo); setEmailFromUrl(email); setTelaAtiva(tipo === 'cadastro' ? 'validar-cadastro' : 'validar-login'); }
    // Valida sessão de verdade na API, não no localStorage
    (async () => {
      if (!getToken()) { setCarregandoSessao(false); return; }
      try {
        const data = await apiFetch('/api/auth/me');
        // Backend me() devolve { success, data: <usuario> } - data É o usuário, não data.usuario.
        // ANTES: const u = data.usuario || data.data?.usuario || data
        // -> data.usuario = undefined, data.data?.usuario = undefined (usuário não tem .usuario)
        // -> caía no fallback data = { success, data: {...} } -> u.id = undefined
        // -> clearAuth() apagava o token que tinha acabado de ser salvo no login!
        // AGORA: extractor aceita as 4 formas (usuario / data.usuario / data / direto).
        const u = (data?.usuario?.id ? data.usuario : data?.data?.usuario?.id ? data.data.usuario : data?.data?.id ? data.data : data?.id ? data : null);
        console.log('[App] /auth/me -> usuario id=', (u as any)?.id, 'email=', (u as any)?.email);
        if ((u as any)?.id) setUsuario(u); else { console.warn('[App] /auth/me sem id, resposta=', data); clearAuth(); }
      } catch { clearAuth(); setUsuario(null); } finally { setCarregandoSessao(false); }
    })();
  }, []);

  const navegar = (t: string) => { setTelaAtiva(t); window.scrollTo(0, 0); };
  const handleLogin = (data: any) => {
    // Validar devolve { token, usuario, data: { token, usuario } } - aceita os dois níveis
    const token = data?.token || data?.data?.token;
    const usuario = data?.usuario?.id ? data.usuario : data?.data?.usuario?.id ? data.data.usuario : data?.data?.id ? data.data : null;
    if (token) setToken(token);
    if (usuario) setUsuario(usuario);
    setTelaAtiva('mural');
  };
  const handleLogout = () => { clearAuth(); setUsuario(null); setTelaAtiva('home'); };
  if (cancelarFromUrl) return <CancelarCadastro email={emailFromUrl || ''} codigo={codigoFromUrl || ''} onConcluido={() => { window.history.replaceState({}, '', '/'); setCancelarFromUrl(false); setTelaAtiva('home'); }} onVoltar={() => { window.history.replaceState({}, '', '/'); setCancelarFromUrl(false); setTelaAtiva('home'); }} />;
  if (carregandoSessao) return <div className="min-h-screen pt-[72px] flex items-center justify-center text-xs font-black">Carregando sessão da API...</div>;
  return (
    <div className="min-h-screen pt-[72px]">
      <Navbar telaAtiva={telaAtiva} setTelaAtiva={navegar} usuario={usuario} onLogout={handleLogout} />
      {telaAtiva === 'home' && <LandingPage setTelaAtiva={navegar} />}
      {telaAtiva === 'codigoFreela' && <CodigoFreela setTelaAtiva={navegar} />}
      {telaAtiva === 'cadastro' && <CadastroUnificado onCadastro={(email?: string) => { if (email) { setEmailFromUrl(email); setTelaAtiva('validar-cadastro'); } else setTelaAtiva('login'); }} />}
      {telaAtiva === 'login' && <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} emailInicial={emailFromUrl} />}
      {telaAtiva === 'validar-cadastro' && <ValidacaoCodigo email={emailFromUrl || undefined} tipo="cadastro" codigoInicial={codigoFromUrl || undefined} autoValidarDoLink={!!codigoFromUrl} dadosCadastro={(() => { try { const raw = localStorage.getItem('uaifrila_cadastro_pendente'); return raw ? JSON.parse(raw) : undefined; } catch { return undefined; } })()} onValidado={handleLogin} onVoltar={() => navegar('cadastro')} />}
      {telaAtiva === 'validar-login' && <ValidacaoCodigo email={emailFromUrl || undefined} tipo="login" codigoInicial={codigoFromUrl || undefined} autoValidarDoLink={!!codigoFromUrl} onValidado={handleLogin} onVoltar={() => navegar('login')} />}
      {telaAtiva === 'mural' && (usuario ? <PainelMural usuario={usuario} setTelaAtiva={navegar} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'perfil' && (usuario ? <PerfilUsuario usuario={usuario} onAtualizado={setUsuario} onIrParaFuncoes={() => navegar('minhas-funcoes')} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'publicar' && (usuario ? <TelaCadastroVaga usuario={usuario} setTelaAtiva={navegar} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'trampos' && (usuario ? <PainelMeusTrampos usuario={usuario} setTelaAtiva={navegar} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'transacoes' && (usuario ? <PainelTransacoes usuario={usuario} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'cidades' && (usuario ? <PainelConfiguracaoCidades /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'variaveis' && (usuario ? <PainelVariaveisAmbiente /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'financeiro' && (usuario ? <PainelAdminFinanceiro /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'permissoes' && (usuario ? <PainelPermissoesCategorias /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'expansao-cidades' && (usuario ? <PainelExpansaoCidades /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
    </div>
  );
}
function TelaLogin({ onLogin, setTelaAtiva, emailInicial }: any) {
  const styles = useUaiFrilaStyles();
  const [email, setEmail] = useState(emailInicial || '');
  const [etapa, setEtapa] = useState<'email' | 'codigo'>('email');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  useEffect(() => { if (emailInicial) setEmail(emailInicial); }, [emailInicial]);
  const enviarEmail = async () => {
    if (!email.includes('@')) { setErro('Informe um e-mail válido'); return; }
    setCarregando(true); setErro('');
    try {
      // API real: solicitar-codigo tipo=login (não /auth/login com payload errado)
      await apiGetPublic('/auth/solicitar-codigo', { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase(), tipo: 'login' }) });
      setEtapa('codigo');
    } catch (e: any) { setErro(e.message); } finally { setCarregando(false); }
  };
  if (etapa === 'codigo') return <ValidacaoCodigo email={email} tipo="login" onValidado={onLogin} onVoltar={() => setEtapa('email')} />;
  return (
    <div className={styles.pageContainerSmall}><div className={styles.card}><h2 className={styles.typography.h1}>Login</h2>
      <div className="mt-6 space-y-4"><div><label className={styles.label}>Email *</label><input value={email} onChange={e => setEmail(e.target.value)} className={styles.input} /></div>
      {erro && <div className={styles.errorBox}>{erro}</div>}
      <button onClick={enviarEmail} disabled={carregando} className={styles.buttonPrimary(carregando)}>{carregando ? 'Enviando...' : 'Enviar código'}</button>
      <button onClick={() => setTelaAtiva('cadastro')} className={styles.buttonGhost}>Não tenho cadastro</button></div>
    </div></div>
  );
}
export default function App() { return <ThemeProvider><AppContent /></ThemeProvider>; }
