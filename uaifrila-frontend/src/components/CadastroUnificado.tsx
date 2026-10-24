import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { formatarCPF, formatarWhatsApp } from '../utils/mascaras';
import { apiFetch } from '../services/api';

export const CadastroUnificado: React.FC<{ dadosSSO: any }> = ({ dadosSSO }) => {
    const { styles } = useTheme();
    const [isBar, setIsBar] = useState(false);
    const [nome, setNome] = useState(dadosSSO?.usuario?.nome || '');
    const [email, setEmail] = useState(dadosSSO?.usuario?.email || '');
    const [senha, setSenha] = useState('');
    const [cpf, setCpf] = useState('');
    const [whatsapp, setWhatsapp] = useState('');

    const handleCadastro = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiFetch('/usuarios/registrar', {
                method: 'POST',
                body: JSON.stringify({ nome, email, senha, cpf: cpf.replace(/\D/g, ''), whatsapp: whatsapp.replace(/\D/g, ''), isContratante: isBar })
            });
            alert('🎉 Cadastro realizado!');
            window.location.reload();
        } catch { alert('❌ Erro no registro.'); }
    };

    return (
        <div className={`w-full max-w-2xl mx-auto p-6 border-2 rounded-3xl ${styles.bgQuadros}`}>
            <h2 className="text-xl font-black uppercase text-center mb-4">Criar Registro v12</h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
                <button onClick={() => setIsBar(false)} className={`p-2 rounded text-xs ${!isBar ? 'bg-blue-600 text-white':'bg-neutral-800 text-gray-400'}`}>🏃 Freelancer</button>
                <button onClick={() => { setIsBar(true); }} className={`p-2 rounded text-xs ${isBar ? 'bg-fuchsia-600 text-white':'bg-neutral-800 text-gray-400'}`}>🏢 Estabelecimento</button>
            </div>
            <form onSubmit={handleCadastro} className="flex flex-col gap-3">
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome" className={`p-2 rounded text-xs ${styles.input}`} required />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" className={`p-2 rounded text-xs ${styles.input}`} required />
                <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Senha" className={`p-2 rounded text-xs ${styles.input}`} required />
                <input type="text" value={cpf} onChange={e => setCpf(formatarCPF(e.target.value))} placeholder="CPF" className={`p-2 rounded text-xs ${styles.input}`} required />
                <input type="text" value={whatsapp} onChange={e => setWhatsapp(formatarWhatsApp(e.target.value))} placeholder="WhatsApp" className={`p-2 rounded text-xs ${styles.input}`} required />
                <button type="submit" className={`py-3 rounded font-black text-xs uppercase ${styles.btnPrimary}`}>Concluir Cadastro Próprio</button>
            </form>
        </div>
    );
};