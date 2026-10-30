
import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ValidacaoCodigo from './components/ValidacaoCodigo';
import PainelMural from './components/PainelMural';
import PainelMeusTrampos from './components/PainelMeusTrampos';
import TelaCadastroVaga from './components/TelaCadastroVaga';
import CadastroUnificado from './components/CadastroUnificado';
import PerfilUsuario from './components/PerfilUsuario';
import PainelTransacoes from './components/PainelTransacoes';
import PainelExpansao from './components/PainelExpansao';
import CodigoFreela from './components/CodigoFreela';
import { useUaiFrilaStyles } from './styles/uaifrila.styles';

const API = (import.meta as any).env?.VITE_API_URL || 'http://192.168.24.11:3000/api';

function AppContent() {
  const [telaAtiva, setTelaAtiva] = useState('home');
  const [usuario, setUsuario] = useState<any>(null);
  const [codigoFromUrl, setCodigoFromUrl] = useState<string | null>(null);
  const [emailFromUrl, setEmailFromUrl] = useState<string | null>(null);

  // Restaura usuário + verifica URL com código (link do e-mail)
  useEffect(() => {
    const u = localStorage.getItem('uaifrila_usuario');
    const t = localStorage.getItem('uaifrila_token');
    if (u && t) {
      try { setUsuario(JSON.parse(u)); } catch {}
    }

    // Verifica se veio link do e-mail: /?email=...&codigo=... ou /validar?codigo=
    const params = new URLSearchParams(window.location.search);
    const codigo = params.get('codigo');
    const emailRaw = params.get('email');
    const email = emailRaw ? decodeURIComponent(emailRaw) : null;
    const tipo = params.get('tipo');
    const tokenCancelar = params.get('token');
    const acao = params.get('acao'); // cancelar

    console.log('[App] URL params:', { codigo, email, tipo, acao });

    if (codigo && email) {
      console.log('[App] Link do e-mail detectado - código:', codigo, 'email:', email, 'tipo:', tipo);
      setCodigoFromUrl(codigo);
      setEmailFromUrl(email);
      // Salva no localStorage para sobreviver ao refresh
      localStorage.setItem('uaifrila_validacao_pendente', JSON.stringify({
        email, tipo: tipo || 'cadastro', timestamp: Date.now(), tentativas: 0, codigo
      }));
      setTelaAtiva(tipo === 'cadastro' ? 'validar-cadastro' : 'validar-login');
      // NÃO limpa URL imediatamente - deixa ValidacaoCodigo pegar o código
      // Limpa depois de 2 segundos
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
      }, 2000);
    }

    // Restaura validação pendente se deu refresh no celular
    const pendente = localStorage.getItem('uaifrila_validacao_pendente');
    if (pendente && !u) {
      try {
        const data = JSON.parse(pendente);
        const idade = Date.now() - data.timestamp;
        if (idade < 5 * 60 * 1000) { // menos de 5 min
          console.log('[App] Restaura validação pendente:', data.email);
          setEmailFromUrl(data.email);
          setTelaAtiva(data.tipo === 'cadastro' ? 'validar-cadastro' : 'validar-login');
        } else {
          localStorage.removeItem('uaifrila_validacao_pendente');
        }
      } catch {}
    }

    // Cancelar cadastro via link do e-mail
    if (acao === 'cancelar' && email) {
      fetch(`${API}/auth/cancelar-cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: tokenCancelar })
      }).then(() => {
        alert('Cadastro cancelado e e-mail protegido. Se não foi você, desconsidere.');
        localStorage.removeItem('uaifrila_validacao_pendente');
        setTelaAtiva('home');
        window.history.replaceState({}, '', window.location.pathname);
      });
    }
  }, []);

  const navegar = (tela: string) => {
    console.log('[App] Navegando para:', tela);
    setTelaAtiva(tela);
    window.scrollTo(0, 0);
  };

  const handleLogin = (data: any) => {
    if (data.token) localStorage.setItem('uaifrila_token', data.token);
    if (data.usuario) {
      localStorage.setItem('uaifrila_usuario', JSON.stringify(data.usuario));
      setUsuario(data.usuario);
    }
    localStorage.removeItem('uaifrila_validacao_pendente');
    localStorage.removeItem('uaifrila_cadastro_pendente');
    setTelaAtiva('mural');
  };

  const handleLogout = () => {
    localStorage.clear();
    setUsuario(null);
    setTelaAtiva('home');
  };

  return (
    <div className="min-h-screen pt-[72px]">
      <Navbar telaAtiva={telaAtiva} setTelaAtiva={navegar} usuario={usuario} onLogout={handleLogout} />
      
      {telaAtiva === 'home' && <LandingPage setTelaAtiva={navegar} />}
      {telaAtiva === 'codigoFreela' && <CodigoFreela setTelaAtiva={navegar} />}
      {telaAtiva === 'cadastro' && <CadastroUnificado onCadastro={(email?: string) => {
        if (email) {
          setEmailFromUrl(email);
          setTelaAtiva('validar-cadastro');
        } else {
          setTelaAtiva('login');
        }
      }} />}
      {telaAtiva === 'login' && <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} emailInicial={emailFromUrl} />}

      {/* Validação com persistência anti-refresh mobile */}
      {telaAtiva === 'validar-cadastro' && (
        <ValidacaoCodigo 
          email={emailFromUrl || undefined} 
          tipo="cadastro" 
          codigoInicial={codigoFromUrl || undefined}
          onValidado={(data) => {
            alert('Cadastro confirmado! Faça login agora.');
            setCodigoFromUrl(null);
            setEmailFromUrl(null);
            setTelaAtiva('login');
          }} 
          onVoltar={() => navegar('cadastro')} 
        />
      )}
      {telaAtiva === 'validar-login' && (
        <ValidacaoCodigo 
          email={emailFromUrl || undefined} 
          tipo="login" 
          codigoInicial={codigoFromUrl || undefined}
          onValidado={handleLogin} 
          onVoltar={() => navegar('login')} 
        />
      )}

      {telaAtiva === 'mural' && (usuario ? <PainelMural usuario={usuario} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'perfil' && (usuario ? <PerfilUsuario usuario={usuario} onAtualizado={(u)=>setUsuario(u)} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'publicar' && (usuario ? <TelaCadastroVaga usuario={usuario} setTelaAtiva={navegar} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'trampos' && (usuario ? <PainelMeusTrampos usuario={usuario} setTelaAtiva={navegar} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'transacoes' && (usuario ? <PainelTransacoes usuario={usuario} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'expansao' && (usuario ? <PainelExpansao usuario={usuario} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
    </div>
  );
}

function TelaLogin({ onLogin, setTelaAtiva, emailInicial }: { onLogin: (d:any)=>void, setTelaAtiva: (t:string)=>void, emailInicial?: string | null }) {
  const styles = useUaiFrilaStyles();
  const [email, setEmail] = useState(emailInicial || '');
  const [etapa, setEtapa] = useState<'email'|'codigo'>('email');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const API = (import.meta as any).env?.VITE_API_URL || 'http://192.168.24.11:3000/api';

  useEffect(() => {
    if (emailInicial) {
      setEmail(emailInicial);
      // Se veio email da URL ou localStorage, já salva pendência
      localStorage.setItem('uaifrila_validacao_pendente', JSON.stringify({
        email: emailInicial, tipo: 'login', timestamp: Date.now(), tentativas: 0
      }));
    }
    // Restaura email pendente
    const pendente = localStorage.getItem('uaifrila_validacao_pendente');
    if (pendente && !emailInicial) {
      try {
        const data = JSON.parse(pendente);
        if (data.tipo === 'login' && data.email) {
          setEmail(data.email);
        }
      } catch {}
    }
  }, [emailInicial]);

  const enviarEmail = async () => {
    setCarregando(true); setErro('');
    try {
      const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      if (data.sucesso) {
        onLogin(data);
      } else {
        // Salva pendência antes de ir pra validação - anti refresh mobile
        localStorage.setItem('uaifrila_validacao_pendente', JSON.stringify({
          email, tipo: 'login', timestamp: Date.now(), tentativas: 0
        }));
        setEtapa('codigo');
      }
    } catch (e:any) { setErro(e.message); }
    finally { setCarregando(false); }
  };

  if (etapa === 'codigo') {
    return <ValidacaoCodigo email={email} tipo="login" onValidado={onLogin} onVoltar={() => setEtapa('email')} />;
  }

  return (
    <div className={styles.pageContainerSmall}>
      <div className={styles.card}>
        <h2 className={styles.typography.h1}>Login</h2>
        <p className={styles.typography.bodySmall + ' mt-2 opacity-70'}>Sem senha. Enviamos um código de 6 dígitos que dura 5 minutos. Deixe esta aba aberta ao abrir o e-mail.</p>
        <div className="mt-6 space-y-4">
          <div>
            <label className={styles.label}>Email *</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" className={styles.input} />
          </div>
          {erro && <div className={styles.errorBox}>{erro}</div>}
          <button onClick={enviarEmail} disabled={carregando || !email} className={styles.buttonPrimary(carregando || !email)}>Enviar código</button>
          <button onClick={()=>setTelaAtiva('cadastro')} className={styles.buttonGhost}>Não tenho cadastro</button>
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
