import React, { useState, useEffect } from 'react';

interface Taxa { chave: string; valor: string; descricao: string; }
interface Transacao { id: number; funcao: string; local: string; total: number; tax: number; }

export const PainelAdminFinanceiro: React.FC = () => {
    const [taxas, setTaxas] = useState<Taxa[]>([]);
    const [transacoes, setTransacoes] = useState<Transacao[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('@UaiFrila:token');
        
        // Dispara requisições injetando o cabeçalho Authorization exigido pela API
        const carregarFinanceiro = async () => {
            try {
                const resTaxas = await fetch('http://localhost:3000/api/admin/variaveis', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                if (resTaxas.ok) setTaxas(await resTaxas.json());

                const resTrans = await fetch('http://localhost:3000/api/admin/transacoes?inicio=2026-01-01&fim=2026-12-31', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resTrans.ok) setTransacoes(await resTrans.json());
            } catch (err) {
                console.error("Erro na comunicação financeira:", err);
            }
        };
        carregarFinanceiro();
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-4 text-white font-sans">
            <div className="w-full bg-black border border-gray-800 p-6 rounded-2xl">
                <h2 className="text-sm font-black uppercase text-[#0066FF] mb-4">🛠️ Parâmetros Dinâmicos do Escrow</h2>
                <div className="flex flex-col gap-3">
                    {taxas.length === 0 ? <p className="text-xs text-gray-500">Nenhuma variável carregada da API.</p> : 
                     taxas.map(t => (
                        <div key={t.chave} className="p-3 bg-[#0A0A0A] rounded-xl border border-gray-900 flex justify-between items-center text-xs">
                            <div><span className="text-[#FF00FF] font-mono font-bold block">{t.chave}</span><span className="text-gray-500 text-[10px]">{t.descricao}</span></div>
                            <span className="text-lg font-black text-white">{t.valor}%</span>
                        </div>
                     ))}
                </div>
            </div>

            <div className="w-full bg-black border border-gray-800 p-6 rounded-2xl">
                <h2 className="text-sm font-black uppercase text-[#0066FF] mb-4">💰 Auditoria Financeira de Custódia</h2>
                <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-800 text-gray-500 font-bold uppercase text-[10px]"><th className="pb-2">Serviço</th><th className="pb-2 text-right">Faturamento</th><th className="pb-2 text-right">Escrow Retido</th></tr>
                        </thead>
                        <tbody>
                            {transacoes.length === 0 ? <tr><td colSpan={3} className="pt-4 text-gray-500 text-center">Nenhuma movimentação no período lida da API.</td></tr> :
                             transacoes.map(t => (
                                <tr key={t.id} className="border-b border-gray-900"><td className="py-2"><strong>{t.funcao}</strong><br/><span className="text-[10px] text-gray-500">{t.local}</span></td><td className="py-2 text-right font-bold">R\$ {t.total.toFixed(2)}</td><td className="py-2 text-right font-bold text-blue-400">R\$ {t.tax.toFixed(2)}</td></tr>
                             ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
