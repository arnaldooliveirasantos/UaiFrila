import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import CadastroUnificado from './components/CadastroUnificado';
import MuralVagas from './components/MuralVagas';
import PainelPublicarVaga from './components/PainelPublicarVaga';
import PainelGerenciarCandidatos from './components/PainelGerenciarCandidatos';
import PainelMeusTrampos from './components/PainelMeusTrampos';
import PainelConfiguracaoCidades from './components/PainelConfiguracaoCidades';
import PainelExpansaoCidades from './components/PainelExpansaoCidades';
import PainelAdminFinanceiro from './components/PainelAdminFinanceiro';
import PainelVariaveisAmbiente from './components/PainelVariaveisAmbiente';
import CodigoFreela from './components/CodigoFreela';

function AppContent() {
  const [telaAtiva, setTelaAtiva] = useState('home');
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('@UaiFrila:token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUsuario({ id: payload.id, nome: payload.email || 'Usuário', is_admin: payload.is_admin, is_contratante: payload.is_contratante || true, is_freela: payload.is_freela || true });
      } catch {}
    }
  }, []);

  const handleLogin = (usr: any, token: string) => {
    setUsuario(usr);
    setTelaAtiva('mural');
  };

  const handleLogout = () => {
    localStorage.removeItem('@UaiFrila:token');
    setUsuario(null);
    setTelaAtiva('home');
  };

  return (
    <div className="min-h-screen">
      <Navbar telaAtiva={telaAtiva} setTelaAtiva={setTelaAtiva} usuario={usuario} onLogout={handleLogout} />
      <main className="pt-[72px] lg:pt-[72px]">
        {telaAtiva === 'home' && <LandingPage onEntrar={setTelaAtiva} />}
        {telaAtiva === 'login' && <Login onLogin={handleLogin} />}
        {telaAtiva === 'cadastro' && <CadastroUnificado onCadastro={() => setTelaAtiva('login')} />}
        {telaAtiva === 'mural' && <MuralVagas tipoUsuario={usuario?.is_contratante ? 'CONTRATANTE' : 'FREELA'} />}
        {telaAtiva === 'publicar' && <PainelPublicarVaga />}
        {telaAtiva === 'candidatos' && <PainelGerenciarCandidatos />}
        {telaAtiva === 'trampos' && <PainelMeusTrampos />}
        {telaAtiva === 'cidades' && <PainelConfiguracaoCidades />}
        {telaAtiva === 'expansao' && <PainelExpansaoCidades />}
        {telaAtiva === 'transacoes' && <PainelAdminFinanceiro />}
        {telaAtiva === 'variaveis' && <PainelVariaveisAmbiente />}
        {telaAtiva === 'codigo' && <CodigoFreela />}
      </main>
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
