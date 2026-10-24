import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { CadastroUnificado } from './components/CadastroUnificado';
import { MuralVagas } from './components/MuralVagas';
import { PainelPublicarVaga } from './components/PainelPublicarVaga';

function ConteudoApp() {
    const [telaAtiva, setTelaAtiva] = useState('HOME');
    const [usuario, setUsuario] = useState<any>(null);
    const [dadosSSO, setDadosSSO] = useState<any>(null);

    useEffect(() => {
        const u = localStorage.getItem('@UaiFrila:usuario');
        if (u) setUsuario(JSON.parse(u));
    }, [telaAtiva]);

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 max-w-4xl mx-auto flex flex-col gap-4">
            <Navbar telaAtiva={telaAtiva} onNavegar={setTelaAtiva} usuario={usuario} onLogout={() => { localStorage.clear(); setUsuario(null); setTelaAtiva('HOME'); }} />
            {telaAtiva === 'HOME' && <LandingPage onSelecionarAcao={setTelaAtiva} />}
            {telaAtiva === 'LOGIN' && <Login onSucessoSSO={(d) => { setDadosSSO(d); localStorage.setItem('@UaiFrila:usuario', JSON.stringify(d.usuario)); localStorage.setItem('@UaiFrila:token', d.token); setTelaAtiva('MURAL'); }} />}
            {telaAtiva === 'CADASTRO' && <CadastroUnificado dadosSSO={dadosSSO} />}
            {telaAtiva === 'MURAL' && (usuario?.is_contratante ? <PainelPublicarVaga /> : <MuralVagas tipoUsuario="FREELA" />)}
        </div>
    );
}
export default function App() { return <ThemeProvider><ConteudoApp /></ThemeProvider>; }