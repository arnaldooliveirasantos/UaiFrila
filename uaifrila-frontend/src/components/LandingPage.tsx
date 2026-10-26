import React from 'react';
import { useTheme } from '../context/ThemeContext';
import LogoIcone from './LogoIcone';

export default function LandingPage({ setTelaAtiva }: { setTelaAtiva: (t: string, params?: any) => void }) {
  const { isDark } = useTheme();

  const irParaCadastro = (tipo: 'freela' | 'contratante') => {
    localStorage.setItem('uaifrila_tipo_cadastro', tipo);
    setTelaAtiva('cadastro', { tipo });
  };

  return (
    <div className="min-h-[calc(100vh-72px)]">
      <div className={`max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center`}>
        <div>
          <h1 className={`mt-6 text-5xl md:text-7xl font-black uppercase leading-[0.9] tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>
            UAI<br/>FRILA
          </h1>
          <p className={`mt-6 text-lg font-bold uppercase ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
            Conectando freelas e contratantes de bares, restaurantes e eventos
          </p>
          <p className="mt-4 text-sm opacity-70">Cadastro em 2 minutos. Vagas diárias. Pagamento garantido. Sem burocracia CLT Art 442-B.</p>
          
          {/* Botões principais - Agora com Quero Contratar */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => irParaCadastro('freela')} className="px-6 py-4 bg-[#E53935] text-white border-2 border-black font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-transform">
              <div className="text-[10px] opacity-80">PARA QUEM QUER TRAMPAR</div>
              <div>Quero Trampar →</div>
            </button>
            <button onClick={() => irParaCadastro('contratante')} className={`px-6 py-4 border-2 font-black uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-transform ${isDark ? 'bg-[#0066FF] text-white border-[#0066FF]' : 'bg-black text-white border-black'}`}>
              <div className="text-[10px] opacity-80">PARA BARES E RESTAURANTES</div>
              <div>Quero Contratar →</div>
            </button>
          </div>

          <div className="mt-3">
            <button onClick={() => setTelaAtiva('codigo')} className={`w-full px-6 py-3 border-2 font-black uppercase text-xs ${isDark ? 'bg-white text-black border-white' : 'bg-[#FFC700] text-black border-black'}`}>
              Ver Código Freela
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 border-2 border-black"><div className="text-xl font-black">500+</div><div className="text-[10px] uppercase font-bold">Freelas</div></div>
            <div className="p-3 border-2 border-black"><div className="text-xl font-black">1200+</div><div className="text-[10px] uppercase font-bold">Trampos</div></div>
            <div className="p-3 border-2 border-black"><div className="text-xl font-black">4.9★</div><div className="text-[10px] uppercase font-bold">Avaliação</div></div>
          </div>

          {/* Seção contratante destacada */}
          <div className={`mt-8 p-4 border-2 border-dashed ${isDark ? 'border-white/30 bg-white/5' : 'border-black/20 bg-yellow-50'}`}>
            <h4 className="font-black uppercase text-xs">Você é bar, restaurante ou evento?</h4>
            <p className="text-[11px] mt-1 opacity-70">Publique vagas em 1 minuto. Receba candidatos filtrados por bairro, função e valor/hora. Sem CLT, sem dor de cabeça.</p>
            <button onClick={() => irParaCadastro('contratante')} className="mt-3 px-4 py-2 bg-black text-white border-2 border-black text-[10px] font-black uppercase">Cadastrar como Contratante</button>
          </div>
        </div>
        <div className={`p-8 border-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white' : 'bg-white border-black'}`}>
          <h3 className="font-black uppercase">Como funciona?</h3>
          <div className="mt-4 space-y-4">
            {[
              { n: '01', t: 'Cadastre-se', d: 'Escolha Freela ou Contratante. CPF, bairro, função e valor/hora. 5 termos.' },
              { n: '02', t: 'Valide e-mail', d: 'Código de 6 dígitos. Vira ATIVO na hora.' },
              { n: '03', t: 'Veja o Mural', d: 'Freela vê vagas, Contratante publica. Candidate-se ou escolha candidatos.' },
              { n: '04', t: 'Trampe e receba', d: 'Check-in, trabalho, avaliação e pagamento via plataforma.' },
            ].map(item => (
              <div key={item.n} className="flex gap-3">
                <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-black text-sm">{item.n}</div>
                <div><div className="font-black uppercase text-sm">{item.t}</div><div className="text-xs opacity-70">{item.d}</div></div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-3 bg-[#FFC700] text-black border-2 border-black text-[10px] font-bold">
            💡 Dica: Você pode ser os dois! Cadastre como DUAL (Freela + Contratante) e depois não volta mais para simples por segurança.
          </div>
        </div>
      </div>
    </div>
  );
}