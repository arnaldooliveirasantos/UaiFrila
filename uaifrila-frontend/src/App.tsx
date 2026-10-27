import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CadastroUnificado from './components/CadastroUnificado';
import ValidacaoCodigo from './components/ValidacaoCodigo';
import PainelMural from './components/PainelMural';
import PainelMeusTrampos from './components/PainelMeusTrampos';
import PerfilUsuario from './components/PerfilUsuario';
import LandingPage from './components/LandingPage';
import CodigoFreela from './components/CodigoFreela';
import PainelTransacoes from './components/PainelTransacoes';
import PainelExpansao from './components/PainelExpansao';
import { ThemeProvider, useTheme, getInputClass, getLabelClass, getCardClass } from './context/ThemeContext';
import TelaCadastroVaga from './components/TelaCadastroVaga';

function AppContent() {
  const [telaAtiva, setTelaAtiva] = useState('home');
  const [usuario, setUsuario] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('uaifrila_token');
    const u = localStorage.getItem('uaifrila_usuario');
    if (t && u) {
      try {
        const usuarioParsed = JSON.parse(u);
        setUsuario(usuarioParsed);
        setToken(t);
        if (usuarioParsed.email) setTelaAtiva('mural');
      } catch {
        localStorage.removeItem('uaifrila_token');
        localStorage.removeItem('uaifrila_usuario');
      }
    }
  }, []);

  const handleLogin = (dados: { token: string; usuario: any }) => {
    localStorage.setItem('uaifrila_token', dados.token);
    localStorage.setItem('uaifrila_usuario', JSON.stringify(dados.usuario));
    setUsuario(dados.usuario);
    setToken(dados.token);
    setTelaAtiva('mural');
  };

  const handleLogout = () => {
    localStorage.removeItem('uaifrila_token');
    localStorage.removeItem('uaifrila_usuario');
    setUsuario(null);
    setToken(null);
    setTelaAtiva('home');
  };

  const navegar = (tela: string, params?: any) => {
    if (params?.tipo) {
      localStorage.setItem('uaifrila_tipo_cadastro', params.tipo);
    }
    setTelaAtiva(tela);
  };

  return (
    <div className="min-h-screen pt-[72px]">
      <Navbar telaAtiva={telaAtiva} setTelaAtiva={navegar} usuario={usuario} onLogout={handleLogout} />
      {telaAtiva === 'home' && <LandingPage setTelaAtiva={navegar} />}
      {telaAtiva === 'codigo' && <CodigoFreela setTelaAtiva={navegar} />}
      {telaAtiva === 'cadastro' && <CadastroUnificado onCadastro={() => setTelaAtiva('login')} />}
      {telaAtiva === 'login' && <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />}
      {telaAtiva === 'mural' && (usuario ? <PainelMural usuario={usuario} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'perfil' && (usuario ? <PerfilUsuario usuario={usuario} onAtualizado={(u)=>setUsuario(u)} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'publicar' && (usuario ? <TelaCadastroVaga usuario={usuario} onAtualizado={(u)=>setUsuario(u)} setTelaAtiva={navegar} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'trampos' && (usuario ? <PainelMeusTrampos usuario={usuario} setTelaAtiva={navegar} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'transacoes' && (usuario ? <PainelTransacoes usuario={usuario} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'expansao' && (usuario ? <PainelExpansao usuario={usuario} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {['publicar','candidatos','cidades','variaveis'].includes(telaAtiva) && (
        <div className="p-8">
          <h2 className="text-2xl font-black uppercase">{telaAtiva}</h2>
          <p className="text-sm mt-2">Tela {telaAtiva} - Em construção</p>
        </div>
      )}
    </div>
  );
}

function TelaLogin({ onLogin, setTelaAtiva }: { onLogin: (d:any)=>void, setTelaAtiva: (t:string)=>void }) {
  const [email, setEmail] = useState('');
  const [etapa, setEtapa] = useState<'email'|'codigo'>('email');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { isDark } = useTheme();
  const API = import.meta.env.VITE_API_URL ;

  const enviarEmail = async () => {
    setCarregando(true); setErro('');
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
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

  const inputClass = getInputClass(isDark);
  const labelClass = getLabelClass(isDark);
  const cardClass = getCardClass(isDark);

  return (
    <div className={`max-w-md mx-auto ${cardClass} mt-8`}>
      <h2 className="text-2xl font-black uppercase tracking-tighter">Login</h2>
      <div className="mt-6 flex flex-col gap-1">
        <label className={labelClass}>E-mail</label>
        <input value={email} onChange={e=>setEmail(e.target.value.toLowerCase())} placeholder="seu@email.com" className={`${inputClass} lowercase`} />
      </div>
      {erro && <div className="mt-3 p-3 bg-[#E53935] text-white border-2 border-black text-xs font-bold">❌ {erro}</div>}
      <button onClick={enviarEmail} disabled={carregando} className={`mt-6 w-full py-4 font-black uppercase text-sm border-2 border-black ${isDark ? 'bg-[#0066FF] text-white hover:bg-[#0055DD]' : 'bg-black text-white hover:bg-zinc-800'} ${carregando ? 'opacity-50' : ''}`}>
        {carregando ? 'Enviando...' : 'Entrar'}
      </button>
      <button onClick={() => setTelaAtiva('cadastro')} className={`mt-3 w-full py-2 text-xs font-bold underline ${isDark ? 'text-zinc-300' : 'text-black'}`}>Não tem conta? Cadastre-se</button>
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
