import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { useUaiFrilaStyles } from './styles/uaifrila.styles';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ValidacaoCodigo from './components/ValidacaoCodigo';
import PainelMural from './components/PainelMural';
import PainelMeusTrampos from './components/PainelMeusTrampos';
import TelaCadastroVaga from './components/TelaCadastroVaga';
import CadastroUnificado from './components/CadastroUnificado';
import PerfilUsuario from './components/PerfilUsuario';
import PainelTransacoes from './components/PainelTransacoes';
import PainelConfiguracaoCidades from './components/PainelConfiguracaoCidades';
import PainelVariaveisAmbiente from './components/PainelVariaveisAmbiente';
import PainelAdminFinanceiro from './components/PainelAdminFinanceiro';
import PainelPermissoesCategorias from './components/PainelPermissoesCategorias';
import PainelExpansaoCidades from './components/PainelExpansaoCidades';
import CodigoFreela from './components/CodigoFreela';

function AppContent() {
  const [telaAtiva, setTelaAtiva] = useState('home');
  const [usuario, setUsuario] = useState<any>(null);
  const [codigoFromUrl, setCodigoFromUrl] = useState<string | null>(null);
  const [emailFromUrl, setEmailFromUrl] = useState<string | null>(null);

  useEffect(() => {
    const u = localStorage.getItem('uaifrila_usuario');
    const t = localStorage.getItem('uaifrila_token');
    if (u && t) { try { setUsuario(JSON.parse(u)); } catch {} }
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get('codigo');
    const email = params.get('email') ? decodeURIComponent(params.get('email')!) : null;
    const tipo = params.get('tipo');
    if (codigo && email) {
      setCodigoFromUrl(codigo); setEmailFromUrl(email);
      setTelaAtiva(tipo === 'cadastro' ? 'validar-cadastro' : 'validar-login');
    }
  }, []);

  const navegar = (t: string) => { setTelaAtiva(t); window.scrollTo(0, 0); };
  const handleLogin = (data: any) => { 
    if (data.token) localStorage.setItem('uaifrila_token', data.token); 
    if (data.usuario) { localStorage.setItem('uaifrila_usuario', JSON.stringify(data.usuario)); setUsuario(data.usuario); } 
    setTelaAtiva('mural'); 
  };
  const handleLogout = () => { localStorage.clear(); setUsuario(null); setTelaAtiva('home'); };

  return (
    <div className="min-h-screen pt-[72px]">
      <Navbar telaAtiva={telaAtiva} setTelaAtiva={navegar} usuario={usuario} onLogout={handleLogout} />
      {telaAtiva === 'home' && <LandingPage setTelaAtiva={navegar} />}
      {telaAtiva === 'codigoFreela' && <CodigoFreela setTelaAtiva={navegar} />}
      {telaAtiva === 'cadastro' && <CadastroUnificado onCadastro={(email?: string) => { if (email) { setEmailFromUrl(email); setTelaAtiva('validar-cadastro'); } else setTelaAtiva('login'); }} />}
      {telaAtiva === 'login' && <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} emailInicial={emailFromUrl} />}
      {telaAtiva === 'validar-cadastro' && <ValidacaoCodigo email={emailFromUrl || undefined} tipo="cadastro" codigoInicial={codigoFromUrl || undefined} onValidado={() => setTelaAtiva('login')} onVoltar={() => navegar('cadastro')} />}
      {telaAtiva === 'validar-login' && <ValidacaoCodigo email={emailFromUrl || undefined} tipo="login" codigoInicial={codigoFromUrl || undefined} onValidado={handleLogin} onVoltar={() => navegar('login')} />}
      {telaAtiva === 'mural' && (usuario ? <PainelMural usuario={usuario} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'perfil' && (usuario ? <PerfilUsuario usuario={usuario} onAtualizado={setUsuario} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
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
  const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';
  
  useEffect(() => { if (emailInicial) setEmail(emailInicial); }, [emailInicial]);
  
  const enviarEmail = async () => {
    setCarregando(true); setErro('');
    try {
      const res = await fetch(`${API}/auth/solicitar-codigo`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email: email.trim().toLowerCase(), tipo: 'login' }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.erro);
      setEtapa('codigo');
    } catch (e: any) { setErro(e.message); } finally { setCarregando(false); }
  };
  
  if (etapa === 'codigo') return <ValidacaoCodigo email={email} tipo="login" onValidado={onLogin} onVoltar={() => setEtapa('email')} />;
  
  return (
    <div className={styles.pageContainerSmall}>
      <div className={styles.card}>
        <h2 className={styles.typography.h1}>Login</h2>
        <div className="mt-6 space-y-4">
          <div><label className={styles.label}>Email *</label><input value={email} onChange={e => setEmail(e.target.value)} className={styles.input} placeholder="seu@email.com" /></div>
          {erro && <div className={styles.errorBox}>{erro}</div>}
          <button onClick={enviarEmail} disabled={carregando} className={styles.buttonPrimary(carregando)}>Enviar código</button>
          <button onClick={() => setTelaAtiva('cadastro')} className={styles.buttonGhost}>Não tenho cadastro</button>
        </div>
      </div>
    </div>
  );
}

export default function App() { 
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  ); 
}
