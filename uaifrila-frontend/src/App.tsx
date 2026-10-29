
// App.tsx refatorado - usa sistema central de estilos
// Este arquivo já usa ThemeProvider que fornece isDark para uaifrila.styles.ts

import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import ValidacaoCodigo from './components/ValidacaoCodigo';
import PainelMural from './components/PainelMural';
import PainelMeusTrampos from './components/PainelMeusTrampos';
import TelaCadastroVaga from './components/TelaCadastroVaga';
import CadastroUnificado from './components/CadastroUnificado';
import PerfilUsuario from './components/PerfilUsuario';
import { useUaiFrilaStyles } from './styles/uaifrila.styles';

function AppContent() {
  const styles = useUaiFrilaStyles();
  const [telaAtiva, setTelaAtiva] = useState('home');
  const [usuario, setUsuario] = useState<any>(null);

  const navegar = (tela: string) => setTelaAtiva(tela);

  const handleLogin = (data: any) => {
    if (data.token) localStorage.setItem('uaifrila_token', data.token);
    if (data.usuario) {
      localStorage.setItem('uaifrila_usuario', JSON.stringify(data.usuario));
      setUsuario(data.usuario);
    }
    setTelaAtiva('mural');
  };

  return (
    <div className="min-h-screen">
      <Navbar usuario={usuario} setTelaAtiva={navegar} onLogout={() => { localStorage.clear(); setUsuario(null); setTelaAtiva('home'); }} />
      {telaAtiva === 'home' && <LandingPage setTelaAtiva={navegar} />}
      {telaAtiva === 'codigo' && <div>CodigoFreela</div>}
      {telaAtiva === 'cadastro' && <CadastroUnificado onCadastro={() => setTelaAtiva('login')} />}
      {telaAtiva === 'login' && <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />}
      {telaAtiva === 'mural' && (usuario ? <PainelMural usuario={usuario} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'perfil' && (usuario ? <PerfilUsuario usuario={usuario} onAtualizado={(u)=>setUsuario(u)} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'publicar' && (usuario ? <TelaCadastroVaga usuario={usuario} setTelaAtiva={navegar} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'trampos' && (usuario ? <PainelMeusTrampos usuario={usuario} setTelaAtiva={navegar} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
    </div>
  );
}

function TelaLogin({ onLogin, setTelaAtiva }: { onLogin: (d:any)=>void, setTelaAtiva: (t:string)=>void }) {
  const styles = useUaiFrilaStyles();
  const [email, setEmail] = useState('');
  const [etapa, setEtapa] = useState<'email'|'codigo'>('email');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const API = import.meta.env.VITE_API_URL;

  const enviarEmail = async () => {
    setCarregando(true); setErro('');
    try {
      const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      if (data.sucesso) onLogin(data);
      else setEtapa('codigo');
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
