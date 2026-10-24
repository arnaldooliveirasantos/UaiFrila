import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface LoginProps {
  onSucessoSSO?: (dados: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onSucessoSSO }) => {
    const { styles } = useTheme();
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [codigo, setCodigo] = useState('');
    const [passo, setPasso] = useState<'CREDENCIAIS' | 'TOKEN'>('CREDENCIAIS');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const handleLoginNativo = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');
        setCarregando(true);
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });
            const dados = await res.json();
            if (!res.ok) throw new Error(dados.erro || 'Erro no login');
            if (dados.status === 'AGUARDANDO_VALIDACAO_EMAIL') {
                setPasso('TOKEN');
            } else {
                // Login direto
                if (onSucessoSSO) onSucessoSSO(dados);
            }
        } catch (err: any) {
            setErro(err.message);
        } finally {
            setCarregando(false);
        }
    };

    const handleVerificarToken = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');
        setCarregando(true);
        try {
            const res = await fetch(`${API_BASE}/auth/verificar-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, codigo })
            });
            const dados = await res.json();
            if (!res.ok) throw new Error(dados.erro || 'Código inválido');
            localStorage.setItem('@UaiFrila:token', dados.token);
            localStorage.setItem('@UaiFrila:usuario', JSON.stringify(dados.usuario));
            if (onSucessoSSO) {
                onSucessoSSO(dados);
            } else {
                window.dispatchEvent(new Event('auth-success'));
            }
        } catch (err: any) {
            setErro(err.message);
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className={`w-full max-w-md mx-auto p-6 border-2 rounded-3xl ${styles.bgQuadros}`} style={styles.grid}>
            <div className="text-center mb-5">
                <span className="text-[9px] font-mono bg-blue-600 text-white px-2 py-0.5 rounded font-black uppercase">📧 CONFIRMAÇÃO VIA E-MAIL</span>
                <h3 className="text-xl font-black uppercase tracking-tight mt-1">Acessar Plataforma</h3>
            </div>
            {erro && <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-2.5 rounded-lg text-xs mb-3 font-bold">{erro}</div>}
            {passo === 'CREDENCIAIS' ? (
                <form onSubmit={handleLoginNativo} className="flex flex-col gap-3.5">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu e-mail cadastrado" className={`w-full rounded-lg p-2.5 text-xs outline-none ${styles.input}`} required />
                    <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Sua senha secreta" className={`w-full rounded-lg p-2.5 text-xs outline-none ${styles.input}`} required />
                    <button type="submit" disabled={carregando} className={`w-full py-3 rounded-xl font-black uppercase text-xs tracking-wider transition ${styles.btnPrimary}`}>
                        {carregando ? 'Buscando...' : 'Solicitar Token por E-mail'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerificarToken} className="flex flex-col gap-3.5">
                    <p className="text-xs text-center text-gray-400 font-bold mb-2">Digite o código de 6 dígitos enviado para {email}</p>
                    <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="000000" maxLength={6} className="w-full text-center tracking-widest text-lg font-black rounded-lg p-2.5 bg-black border border-gray-800 text-white outline-none" required />
                    <button type="submit" disabled={carregando} className="w-full py-3 rounded-xl font-black uppercase text-xs tracking-wider bg-green-600 text-white hover:bg-green-700 transition">
                        {carregando ? 'Autenticando...' : 'Confirmar e Entrar'}
                    </button>
                    <button type="button" onClick={() => setPasso('CREDENCIAIS')} className="text-xs text-gray-400 underline">Voltar</button>
                </form>
            )}
        </div>
    );
};
