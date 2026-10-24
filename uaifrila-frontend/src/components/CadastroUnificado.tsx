import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { formatarCPF, formatarWhatsApp, formatarCNPJ } from '../utils/mascaras';

export const CadastroUnificado: React.FC = () => {
    const { theme, styles } = useTheme();
    const [marcadorFreela, setMarcadorFreela] = useState(false);
    const [marcadorBar, setMarcadorBar] = useState(false);

    const [termoCLT, setTermoCLT] = useState(false);
    const [termoLGPD, setTermoLgpd] = useState(false);
    const [cienteLimite, setCienteLimite] = useState(false);
    const [temMEI, setTemMei] = useState('Não');

    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [cpf, setCpf] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [fantasia, setNomeFantasia] = useState('');

    const digitosCpf = cpf.replace(/\D/g, '');
    const digitosWhats = whatsapp.replace(/\D/g, '');
    const digitosCnpj = cnpj.replace(/\D/g, '');

    const validarCamposComuns = () => {
        return nome.trim().length > 3 && email.includes('@') && senha.length >= 6 && digitosCpf.length === 11 && digitosWhats.length === 11;
    };

    const verificarBlindagem = () => {
        if (!marcadorFreela && !marcadorBar) return false;
        if (marcadorFreela) {
            return termoCLT && termoLGPD && (temMEI === 'Sim' || cienteLimite) && validarCamposComuns();
        }
        if (marcadorBar) {
            return digitosCnpj.length === 14 && fantasia.trim().length > 2 && validarCamposComuns();
        }
        return true;
    };

    const handleSubmeter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verificarBlindagem()) return;

        // Uso exclusivo do arquivo de ambiente .env do ecossistema v12
        const API_BASE = import.meta.env.VITE_API_URL;
        
        try {
            const res = await fetch(`${API_BASE}/usuarios/registrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha, cpf: digitosCpf, whatsapp: digitosWhats, cnpj: digitosCnpj, nomeFantasia: fantasia, isContratante: marcadorBar })
            });

            if (!res.ok) throw new Error('Falha de inserção no banco de dados.');
            alert('🎉 Cadastro realizado com sucesso! Efetue seu login para começar.');
            window.location.reload();
        } catch (err) {
            alert('❌ Erro ao processar gravação do cadastro próprio.');
        }
    };

    return (
        <div className={`w-full max-w-2xl mx-auto p-6 transition-all duration-300 ${styles.bgQuadros}`} style={styles.grid}>
            <h2 className="text-2xl font-black uppercase text-center tracking-tight mb-4">➕ Criar Cadastro Próprio</h2>

            <div className="grid grid-cols-2 gap-3 mb-6">
                <div onClick={() => { setMarcadorFreela(!marcadorFreela); setMarcadorBar(false); }} className={`p-3 rounded-xl border-2 cursor-pointer text-center font-black text-xs uppercase transition ${marcadorFreela ? 'bg-[#0066FF] text-white border-[#0066FF]' : 'border-gray-800 text-gray-400'}`}>🏃 Freela</div>
                <div onClick={() => { setMarcadorBar(!marcadorBar); setMarcadorFreela(false); }} className={`p-3 rounded-xl border-2 cursor-pointer text-center font-black text-xs uppercase transition ${marcadorBar ? 'bg-[#FF00FF] text-white border-[#FF00FF]' : 'border-gray-800 text-gray-400'}`}>🏢 Bar</div>
            </div>

            <form onSubmit={handleSubmeter} className="flex flex-col gap-4">
                {(marcadorFreela || marcadorBar) && (
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase font-black tracking-wider">Nome Completo</label>
                        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" className={`rounded-lg p-2.5 text-xs outline-none ${styles.input}`} required />
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] uppercase font-black tracking-wider">E-mail Interno</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@provedor.com" className={`w-full rounded-lg p-2.5 text-xs outline-none ${styles.input}`} required />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black tracking-wider">Senha (Mínimo 6 dígitos)</label>
                                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Sua senha secreta" className={`w-full rounded-lg p-2.5 text-xs outline-none ${styles.input}`} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                            <div>
                                <label className="text-[10px] uppercase font-black tracking-wider">CPF</label>
                                <input type="text" value={cpf} onChange={(e) => setCpf(formatarCPF(e.target.value))} placeholder="000.000.000-00" className={`w-full rounded-lg p-2.5 text-xs outline-none ${styles.input}`} required />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-black tracking-wider">WhatsApp</label>
                                <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(formatarWhatsApp(e.target.value))} placeholder="(34) 99999-0000" className={`w-full rounded-lg p-2.5 text-xs outline-none ${styles.input}`} required />
                            </div>
                        </div>
                    </div>
                )}

                {marcadorBar && (
                    <div className={`p-4 rounded-xl flex flex-col gap-2 ${styles.boxInfo}`}>
                        <h4 className="text-xs font-black uppercase mb-1 tracking-wide">🏢 Informações do Estabelecimento</h4>
                        <input type="text" value={fantasia} onChange={(e) => setNomeFantasia(e.target.value)} placeholder="Nome Fantasia" className={`rounded-lg p-2 text-xs outline-none ${styles.input}`} required />
                        <input type="text" value={cnpj} onChange={(e) => setCnpj(formatarCNPJ(e.target.value))} placeholder="00.000.000/0000-00" className={`rounded-lg p-2 text-xs outline-none ${styles.input}`} required />
                    </div>
                )}

                {marcadorFreela && (
                    <div className={`p-4 rounded-xl flex flex-col gap-3 text-xs ${styles.boxInfo}`}>
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-[#0066FF] border-b border-gray-800 pb-1">🔒 Cláusulas de Blindagem Jurídica</h4>
                        <label className="flex items-start gap-2 cursor-pointer font-bold"><input type="checkbox" checked={termoCLT} onChange={(e) => setTermoCLT(e.target.checked)} /><span>Autônomo sem vínculo CLT (Art 442-B)</span></label>
                        <label className="flex items-start gap-2 cursor-pointer font-bold"><input type="checkbox" checked={termoLGPD} onChange={(e) => setTermoLgpd(e.target.checked)} /><span>Autorizo tratamento de dados LGPD</span></label>
                        {temMEI === 'Não' && (
                            <label className={`flex items-start gap-2 p-2.5 rounded cursor-pointer font-black ${styles.boxWarn}`}><input type="checkbox" checked={cienteLimite} onChange={(e) => setCienteLimite(e.target.checked)} /><span>Ciente do limite de R\$ 1.500,00/mês sem MEI.</span></label>
                        )}
                    </div>
                )}

                <button type="submit" disabled={!verificarBlindagem()} className={`w-full py-3.5 rounded-xl font-black uppercase text-xs tracking-wider border-2 transition ${verificarBlindagem() ? 'bg-[#0066FF] text-white border-[#0066FF]' : 'bg-neutral-800 text-gray-500 border-transparent cursor-not-allowed opacity-40'}`}>
                    🚀 Concluir Cadastro Próprio Blindado
                </button>
            </form>
        </div>
    );
};
