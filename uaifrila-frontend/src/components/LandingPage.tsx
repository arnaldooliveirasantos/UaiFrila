import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface LandingPageProps {
    onSelecionarAcao: (acao: 'LOGIN' | 'CADASTRO_UNIFICADO') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelecionarAcao }) => {
    const { styles } = useTheme();

    return (
        <div className="w-full flex flex-col gap-6 p-2">
            {/* HERO PRINCIPAL ADAPTADO DINAMICAMENTE PARA AMBOS OS MODOS */}
            <div className={`rounded-3xl p-6 md:p-8 shadow-2xl relative ${styles.cardHero}`}>
                <div className="bg-[#0066FF]/10 border border-[#0066FF]/40 text-[#0066FF] text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider w-max mb-4">
                    ⚡ CRONÔMETRO • Freela de bar em 2min
                </div>

                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4 leading-none">
                    Contrate<br/>freela de bar<br/>em 2 minutos.
                </h1>
                
                <p className="text-gray-400 text-xs md:text-sm max-w-xl mb-6 leading-relaxed">
                    O Uber dos bares. Garçom, barman, cumim em até 30 segundos de match. Pagamento escrow EFI seguro, GPS real e foto final do serviço prestado.
                </p>

                {/* Tabela de Preços Limpos */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-3">
                        <span className="text-[10px] text-gray-500 font-bold block">GARÇOM</span>
                        <span className="text-lg font-black text-white">R\$ 20,00 / h</span>
                    </div>
                    <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-3">
                        <span className="text-[10px] text-gray-500 font-bold block">BARMAN</span>
                        <span className="text-lg font-black text-white">R\$ 25,00 / h</span>
                    </div>
                    <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl p-3">
                        <span className="text-[10px] text-gray-500 font-bold block">CUMIM / BANDEJA</span>
                        <span className="text-lg font-black text-white">R\$ 15,00 / h</span>
                    </div>
                </div>

                {/* Caixa de Fórmula de Custos do Escrow */}
                <div className={`p-4 rounded-xl text-[11px] flex flex-col gap-1.5 font-sans mb-6 ${styles.boxInfo}`}>
                    <p className="font-black uppercase tracking-wider text-xs mb-1">📊 FINANCEIRO • Cálculo Dinâmico de Custos</p>
                    <p>• Base R\$ 130 + Taxa Cartão (14%) + Taxa Pix (10%) = Contratante <strong>R\$ 168,20 (Cartão) | Pix R\$ 147,00</strong></p>
                </div>

                {/* Bloco de Avisos de Cancelamento e Prazos */}
                <div className={`p-4 rounded-xl text-[11px] flex flex-col gap-1.5 ${styles.boxWarn}`}>
                    <p className="font-black uppercase tracking-wider text-xs">⚠️ REGRA DE PAGAMENTO & CANCELAMENTO</p>
                    <p>Contratante deve efetuar a quitação via Pix até <strong>60 minutos (1h) antes do início</strong> do turno combinado.</p>
                </div>

                {/* Botões de Chamada para Ação */}
                <div className="flex flex-wrap gap-3 items-center mt-6">
                    <button 
                        onClick={() => onSelecionarAcao('CADASTRO_UNIFICADO')} 
                        className={`font-black uppercase text-xs px-6 py-3 rounded-xl transition cursor-pointer ${styles.btnPrimary}`}
                    >
                        Criar Conta Duplex v12
                    </button>
                    <button 
                        onClick={() => onSelecionarAcao('LOGIN')} 
                        className="text-xs text-gray-400 font-bold hover:text-white underline cursor-pointer"
                    >
                        Fazer login na plataforma
                    </button>
                </div>
            </div>
        </div>
    );
};
