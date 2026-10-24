import React, { useEffect, useState, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { CadastroUnificado } from './components/CadastroUnificado';
import { MuralVagas } from './components/MuralVagas';
import { PainelPublicarVaga } from './components/PainelPublicarVaga';
import { PainelMeusTrampos } from './components/PainelMeusTrampos';
import { PainelTermos } from './components/PainelTermos';
import { PainelAdminFinanceiro } from './components/PainelAdminFinanceiro';
import { PainelEdicaoTermos } from './components/PainelEdicaoTermos';
import { PainelConfiguracaoCidades } from './components/PainelConfiguracaoCidades';

type TelaAtiva = 'HOME' | 'LOGIN' | 'CADASTRO_UNIFICADO' | 'MURAL' | 'PUBLICAR' | 'TRAMPOS' | 'TERMOS_COMPLETOS' | 'ADMIN' | 'CADASTRO' | 'TRAMPOS' | 'TERMOS';

function ConteudoApp() {
    const [telaAtiva, setTelaAtiva] = useState<string>('HOME');
    const [usuario, setUsuario] = useState<any>(null);

    const carregarUsuario = useCallback(() => {
        try {
            const u = localStorage.getItem('@UaiFrila:usuario');
            if (u) setUsuario(JSON.parse(u));
            else setUsuario(null);
        } catch { setUsuario(null); }
    }, []);

    useEffect(() => {
        carregarUsuario();
        const onAuth = () => carregarUsuario();
        const onStorage = (e: StorageEvent) => { if (e.key?.includes('@UaiFrila')) carregarUsuario(); };
        window.addEventListener('auth-success', onAuth);
        window.addEventListener('storage', onStorage);
        return () => {
            window.removeEventListener('auth-success', onAuth);
            window.removeEventListener('storage', onStorage);
        };
    }, [carregarUsuario]);

    const handleSucessoSSO = useCallback((dados: any) => {
        localStorage.setItem('@UaiFrila:usuario', JSON.stringify(dados.usuario));
        localStorage.setItem('@UaiFrila:token', dados.token);
        setUsuario(dados.usuario);
        setTelaAtiva('MURAL');
    }, []);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('@UaiFrila:usuario');
        localStorage.removeItem('@UaiFrila:token');
        setUsuario(null);
        setTelaAtiva('HOME');
    }, []);

    const handleNavegar = useCallback((tela: string) => {
        const mapa: Record<string, string> = {
            'CADASTRO': 'CADASTRO_UNIFICADO',
            'TERMOS': 'TERMOS_COMPLETOS'
        };
        setTelaAtiva(mapa[tela] || tela);
    }, []);

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 max-w-7xl mx-auto flex flex-col gap-6">
            <Navbar telaAtiva={telaAtiva} onNavegar={handleNavegar} usuario={usuario} onLogout={handleLogout} />
            
            {telaAtiva === 'HOME' && <LandingPage onSelecionarAcao={handleNavegar} />}
            {telaAtiva === 'LOGIN' && <Login onSucessoSSO={handleSucessoSSO} />}
            {telaAtiva === 'CADASTRO_UNIFICADO' && <CadastroUnificado />}
            {telaAtiva === 'MURAL' && <MuralVagas tipoUsuario={usuario?.is_contratante ? 'CONTRATANTE' : 'FREELA'} />}
            {telaAtiva === 'PUBLICAR' && <PainelPublicarVaga />}
            {telaAtiva === 'TRAMPOS' && <PainelMeusTrampos />}
            {telaAtiva === 'TERMOS_COMPLETOS' && <PainelTermos />}
            {telaAtiva === 'ADMIN' && usuario?.is_admin && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-black">👑 Painel Admin</h2>
                    <PainelAdminFinanceiro />
                    <PainelConfiguracaoCidades />
                    <PainelEdicaoTermos />
                </div>
            )}
        </div>
    );
}

export default function App() {
    return <ThemeProvider><ConteudoApp /></ThemeProvider>;
}
