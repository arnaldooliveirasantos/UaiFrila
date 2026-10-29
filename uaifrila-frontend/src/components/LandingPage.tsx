import React from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import LogoIcone from './LogoIcone';

export default function LandingPage({ setTelaAtiva }: { setTelaAtiva: (t: string, params?: any) => void }) {
  const styles = useUaiFrilaStyles();

  const irParaCadastro = (tipo: 'freela' | 'contratante') => {
    localStorage.setItem('uaifrila_tipo_cadastro', tipo);
    setTelaAtiva('cadastro', { tipo });
  };

  return (
    <div className="min-h-[calc(100vh-72px)]">
      <div className={`${styles.pageContainer} py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center`}>
        <div>
          <h1 className={`${styles.typography.h1} mt-6 text-5xl md:text-7xl leading-[0.9]`}>
            UAI<br/>FRILA
          </h1>
          <p className={`mt-6 text-lg font-bold uppercase ${styles.isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
            Conectando freelas e contratantes de bares, restaurantes e eventos
          </p>
          <p className={`mt-4 text-sm ${styles.isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Cadastro em 2 minutos. Vagas diárias. Pagamento garantido. Sem burocracia CLT Art 442-B.
          </p>
          
          {/* Botões principais - Agora com Quero Contratar */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => irParaCadastro('freela')} className={`${styles.buttonDanger} py-4 !text-sm !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-transform`}>
              <div className="text-[10px] opacity-80">PARA QUEM QUER TRAMPAR</div>
              <div>Quero Trampar →</div>
            </button>
            <button onClick={() => irParaCadastro('contratante')} className={`${styles.buttonPrimary()} !w-auto px-6 py-4 !text-sm !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-transform`}>
              <div className="text-[10px] opacity-80">PARA BARES E RESTAURANTES</div>
              <div>Quero Contratar →</div>
            </button>
          </div>

          <div className="mt-3">
            <button onClick={() => setTelaAtiva('codigo')} className={`${styles.buttonWarning} w-full py-3 text-xs`}>
              Ver Código Freela
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className={styles.cardSmall}><div className="text-xl font-black">500+</div><div className="text-[10px] uppercase font-bold">Freelas</div></div>
            <div className={styles.cardSmall}><div className="text-xl font-black">1200+</div><div className="text-[10px] uppercase font-bold">Trampos</div></div>
            <div className={styles.cardSmall}><div className="text-xl font-black">4.9★</div><div className="text-[10px] uppercase font-bold">Avaliação</div></div>
          </div>

          {/* Seção contratante destacada */}
          <div className={`${styles.card} mt-8 border-dashed bg-transparent`}>
            <h4 className="font-black uppercase text-xs">Você é bar, restaurante ou evento?</h4>
            <p className={`text-[11px] mt-1 ${styles.isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Publique vagas em 1 minuto. Receba candidatos filtrados por bairro, função e valor/hora. Sem CLT, sem dor de cabeça.</p>
            <button onClick={() => irParaCadastro('contratante')} className={`${styles.buttonSecondary} mt-3 text-[10px]`}>Cadastrar como Contratante</button>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.typography.h3 + ' text-base'}>Como funciona?</h3>
          <div className="mt-4 space-y-4">
            {[
              { n: '01', t: 'Cadastre-se', d: 'Escolha Freela ou Contratante. Informe seus dados e finalize rápido.' },
              { n: '02', t: 'Valide e-mail', d: 'Código de 6 dígitos. Seu perfil fica ativo na hora.' },
              { n: '03', t: 'Veja o Mural', d: 'Freela vê vagas, contratante publica. Candidate-se ou escolha candidatos.' },
              { n: '04', t: 'Trampe e receba', d: 'Check-in, trabalho, avaliação e pagamento via plataforma.' },
            ].map(item => (
              <div key={item.n} className="flex gap-3">
                <div className={`w-10 h-10 flex items-center justify-center font-black text-sm border-2 ${styles.isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black'}`}>{item.n}</div>
                <div><div className="font-black uppercase text-sm">{item.t}</div><div className={`text-xs ${styles.isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{item.d}</div></div>
              </div>
            ))}
          </div>
          <div className={styles.cardHighlight + ' mt-6'}>
            <span className="text-[10px] font-bold">💡 Dica: Você pode ser os dois! Cadastre como DUAL (Freela + Contratante) e tenha acesso completo.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
