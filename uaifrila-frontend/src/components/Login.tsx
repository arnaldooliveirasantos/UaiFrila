import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { apiFetch } from '../services/api';

export const Login: React.FC<{ onSucessoSSO: (dados: any) => void }> = ({ onSucessoSSO }) => {
    const { styles } = useTheme();
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [codigo, setCodigo] = useState('');
    const [passo, setPasso] = useState<'CREDENCIAIS' | 'TOKEN'>('CREDENCIAIS');
    const [erro, setErro] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dados = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, senha }) });
            if (dados.status === 'AGUARDANDO_VALIDACAO_EMAIL') setPasso('TOKEN');
        } catch (err: any) { setErro(err.message); }
    };

    const handleToken = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dados = await apiFetch('/auth/verificar-2fa', { method: 'POST', body: JSON.stringify({ email, codigo }) });
            onSucessoSSO(dados);
        } catch (err: any) { setErro(err.message); }
    };

    return (
        <div className={`w-full max-w-md mx-auto p-6 border-2 rounded-3xl ${styles.bgQuadros}`} style={styles.grid}>
            <h3 className="text-xl font-black uppercase text-center mb-4">Acessar Plataforma</h3>
            {erro && <div className="text-red-500 text-xs mb-2">{erro}</div>}
            {passo === 'CREDENCIAIS' ? (
                <form onSubmit={handleLogin} className="flex flex-col gap-3">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" className={`p-2 rounded text-xs ${styles.input}`} required />
                    <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Senha" className={`p-2 rounded text-xs ${styles.input}`} required />
                    <button type="submit" className={`py-2 rounded text-xs uppercase ${styles.btnPrimary}`}>Entrar</button>
                </form>
            ) : (
                <form onSubmit={handleToken} className="flex flex-col gap-3">
                    <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Código 2FA" className="p-2 text-center text-xs bg-black text-white border border-gray-800 rounded" required />
                    <button type="submit" className="py-2 rounded text-xs bg-green-600 text-white">Confirmar</button>
                </form>
            )}
        </div>
    );
};