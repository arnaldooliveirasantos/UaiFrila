
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

function AppContent() {
  const [telaAtiva, setTelaAtiva] = useState('home');
  const [usuario, setUsuario] = useState<any>(null);

  // Restaura usuário do localStorage
  useEffect(() => {
    const u = localStorage.getItem('uaifrila_usuario');
    const t = localStorage.getItem('uaifrila_token');
    if (u && t) {
      try { setUsuario(JSON.parse(u)); } catch {}
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
      
      {/* Rotas Públicas */}
      {telaAtiva === 'home' && <LandingPage setTelaAtiva={navegar} />}
      {telaAtiva === 'codigoFreela' && <CodigoFreela setTelaAtiva={navegar} />}
      {telaAtiva === 'cadastro' && <CadastroUnificado onCadastro={() => setTelaAtiva('login')} />}
      {telaAtiva === 'login' && <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />}

      {/* Rotas Protegidas - seguem DB real */}
      {telaAtiva === 'mural' && (usuario ? <PainelMural usuario={usuario} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'perfil' && (usuario ? <PerfilUsuario usuario={usuario} onAtualizado={(u)=>setUsuario(u)} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      
      {/* Vagas - tabelas vagas + enderecos_Vaga */}
      {telaAtiva === 'publicar' && (usuario ? <TelaCadastroVaga usuario={usuario} setTelaAtiva={navegar} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'trampos' && (usuario ? <PainelMeusTrampos usuario={usuario} setTelaAtiva={navegar} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'candidatos' && (usuario ? <div className="max-w-[1280px] mx-auto p-8"><h1 className="text-2xl font-black uppercase">Candidatos - Em construção</h1><p className="mt-2 text-sm">Lista de candidaturas por vaga. Tabela candidaturas(vaga_id, usuario_id, status)</p></div> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      
      {/* Financeiro - tabela transacoes */}
      {telaAtiva === 'transacoes' && (usuario ? <PainelTransacoes usuario={usuario} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      
      {/* Cidades e Expansão - tabelas cidades + expansao_cidades */}
      {telaAtiva === 'cidades' && (usuario ? <div className="max-w-[1280px] mx-auto p-8"><h1 className="text-2xl font-black uppercase">Cidades - Admin</h1><p className="mt-2 text-sm">Tabela cidades(id, nome, estado, ativa, populacao, raio_km). Use PainelExpansao para gerenciar.</p></div> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      {telaAtiva === 'expansao' && (usuario ? <PainelExpansao usuario={usuario} /> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
      
      {/* Variáveis - tabela variaveis_sistema */}
      {telaAtiva === 'variaveis' && (usuario ? <div className="max-w-[1280px] mx-auto p-8"><h1 className="text-2xl font-black uppercase">Variáveis do Sistema</h1><p className="mt-2 text-sm">Tabela variaveis_sistema(chave, valor, valor_numerico, categoria). Ex: VALOR_MINIMO_VAGA, TAXA_PIX_PERCENTUAL, COMISSAO_APLICATIVO</p></div> : <TelaLogin onLogin={handleLogin} setTelaAtiva={setTelaAtiva} />)}
    </div>
  );
}

function TelaLogin({ onLogin, setTelaAtiva }: { onLogin: (d:any)=>void, setTelaAtiva: (t:string)=>void }) {
  const styles = useUaiFrilaStyles();
  const [email, setEmail] = useState('');
  const [etapa, setEtapa] = useState<'email'|'codigoFreela'>('email');
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
      else setEtapa('codigoFreela');
    } catch (e:any) { setErro(e.message); }
    finally { setCarregando(false); }
  };

  if (etapa === 'codigoFreela') {
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
