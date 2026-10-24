import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CadastroUnificado from './components/CadastroUnificado';
import ValidacaoCodigo from './components/ValidacaoCodigo';
import PainelMural from './components/PainelMural';
import PainelMeusTrampos from './components/PainelMeusTrampos';
import PerfilUsuario from './components/PerfilUsuario';
import LandingPage from './components/LandingPage';
import CodigoFreela from './components/CodigoFreela';
import { ThemeProvider } from './context/ThemeContext';

function AppContent() {
  const [telaAtiva, setTelaAtiva] = useState('home');
  const [tipoCadastro, setTipoCadastro] = useState<string>('');
  const [usuario, setUsuario] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  // Carrega usuario do localStorage ao iniciar
  useEffect(() => {
    const t = localStorage.getItem('uaifrila_token');
    const u = localStorage.getItem('uaifrila_usuario');
    console.log('🔍 App inicial - token:', t?.substring(0,20), 'usuario:', u?.substring(0,100));
    if (t && u) {
      try {
        const usuarioParsed = JSON.parse(u);
        setUsuario(usuarioParsed);
        setToken(t);
        console.log('✅ Usuario carregado do localStorage:', usuarioParsed.email, 'status_usuario_id:', usuarioParsed.status_usuario_id);
        // Se já está logado e com status ATIVO, vai direto pro mural
        if (usuarioParsed.status_usuario_id === 2 || usuarioParsed.status_chave === 'ATIVO' || !usuarioParsed.status_usuario_id) {
          setTelaAtiva('mural');
        }
      } catch (e) {
        console.error('Erro parse usuario:', e);
        localStorage.removeItem('uaifrila_token');
        localStorage.removeItem('uaifrila_usuario');
      }
    }
  }, []);

  const handleLogin = (dados: { token: string; usuario: any }) => {
    console.log('✅ Login realizado:', dados.usuario.email, 'status:', dados.usuario.status_usuario_id);
    localStorage.setItem('uaifrila_token', dados.token);
    localStorage.setItem('uaifrila_usuario', JSON.stringify(dados.usuario));
    setUsuario(dados.usuario);
    setToken(dados.token);
    setTelaAtiva('mural'); // Vai pro mural após login
  };

  const handleLogout = () => {
    localStorage.removeItem('uaifrila_token');
    localStorage.removeItem('uaifrila_usuario');
    setUsuario(null);
    setToken(null);
    setTelaAtiva('home');
  };

  const handleCadastro = () => {
    setTelaAtiva('login');
  };

  const navegar = (tela: string, params?: any) => {
    if (params?.tipo) {
      localStorage.setItem('uaifrila_tipo_cadastro', params.tipo);
      setTipoCadastro(params.tipo);
    }
    setTelaAtiva(tela);
  };

  return (
    <div className="min-h-screen pt-[72px]">
      <Navbar telaAtiva={telaAtiva} setTelaAtiva={navegar} usuario={usuario} onLogout={handleLogout} />
      
      {/* Públicas - não precisa login */}
      {telaAtiva === 'home' && <LandingPage setTelaAtiva={navegar} />}
      {telaAtiva === 'codigo' && <CodigoFreela setTelaAtiva={navegar} />}

      {telaAtiva === 'cadastro' && <CadastroUnificado onCadastro={handleCadastro} />}
      
      {telaAtiva === 'login' && (
        <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />
      )}

      {telaAtiva === 'mural' && (
        usuario ? <PainelMural usuario={usuario} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />
      )}

      {telaAtiva === 'perfil' && (
        usuario ? <PerfilUsuario usuario={usuario} onAtualizado={(u)=>setUsuario(u)} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />
      )}

      {telaAtiva === 'trampos' && (
        usuario ? <PainelMeusTrampos usuario={usuario} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />
      )}

      {/* Outras telas */}
      {['publicar','candidatos','cidades','expansao','transacoes','variaveis'].includes(telaAtiva) && (
        <div className="p-8">
          <h2 className="text-2xl font-black uppercase">{telaAtiva}</h2>
          <p className="text-sm mt-2">Tela {telaAtiva} - usuario: {usuario?.email || 'não logado'}</p>
        </div>
      )}
    </div>
  );
}

function TelaLogin({ onLogin, setTelaAtiva }: { onLogin: (d:any)=>void, setTelaAtiva: (t:string)=>void }) {
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [etapa, setEtapa] = useState<'email'|'codigo'>('email');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
      if (data.sucesso) {
        // Login direto sem código
        onLogin(data);
      } else {
        // Precisa validar código
        setEtapa('codigo');
      }
    } catch (e:any) { setErro(e.message); }
    finally { setCarregando(false); }
  };

  if (etapa === 'codigo') {
    return <ValidacaoCodigo email={email} tipo="login" onValidado={onLogin} onVoltar={() => setEtapa('email')} />;
  }

  return (
    <div className="max-w-md mx-auto p-8 mt-8 border-2 border-black bg-white">
      <h2 className="text-2xl font-black uppercase">Login</h2>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-mail" className="mt-4 w-full px-4 py-3 border-2 border-black text-sm" />
      {erro && <div className="mt-3 p-2 bg-red-500 text-white text-xs">{erro}</div>}
      <button onClick={enviarEmail} disabled={carregando} className="mt-4 w-full py-3 bg-black text-white font-black uppercase text-xs">
        {carregando ? 'Enviando...' : 'Entrar'}
      </button>
      <button onClick={() => setTelaAtiva('cadastro')} className="mt-2 w-full py-2 text-xs underline">Não tem conta? Cadastre-se</button>
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