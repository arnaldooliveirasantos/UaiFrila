
import React from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import LogoIcone from './LogoIcone';

export default function LandingPage({ setTelaAtiva }: { setTelaAtiva: (t: string) => void }) {
  const styles = useUaiFrilaStyles();

  const irParaCadastro = (tipo?: string) => {
    if (tipo) localStorage.setItem('uaifrila_tipo_cadastro', tipo);
    setTelaAtiva('cadastro');
  };

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className={`${styles.pageContainer} py-16 md:py-24`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <LogoIcone size={64} />
              <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter">UAI FRILA</h1>
            </div>
            <p className={`${styles.typography.h2} text-2xl md:text-3xl leading-tight`}>
              Trampos diários em Uberlândia.<br />
              Sem enrolação, pagamento no dia.
            </p>
            <p className={`${styles.typography.bodySmall} mt-4 max-w-lg`}>
              Conectamos freelas e contratantes da mesma cidade. Garçom, cozinheiro, diarista, segurança — tudo com endereço real, valor por serviço e transporte incluso.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
              <button onClick={() => irParaCadastro('FREELA')} className={styles.buttonPrimary()}>
                Quero Trampar
              </button>
              <button onClick={() => irParaCadastro('CONTRATANTE')} className={styles.buttonWarning}>
                Quero Contratar
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-6">
              <span className={styles.badge('default')}>Sem CLT</span>
              <span className={styles.badge('success')}>PIX no dia</span>
              <span className={styles.badge('warning')}>Valor por serviço + transporte</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className={styles.cardHighlight}>
              <h3 className="font-black uppercase">Como funciona?</h3>
              <div className="mt-4 space-y-3 text-sm font-bold">
                <div className="flex gap-3"><span className="font-black">1.</span><span>Contratante publica vaga com título, descrição, função, horário de entrada/saída, valor do serviço e transporte + endereço completo (rua, bairro, CEP, cidade)</span></div>
                <div className="flex gap-3"><span className="font-black">2.</span><span>Freela vê no mural (sem dados do contratante) e se candidata</span></div>
                <div className="flex gap-3"><span className="font-black">3.</span><span>Contratante aceita, vira trampo com cronômetro</span></div>
                <div className="flex gap-3"><span className="font-black">4.</span><span>Pagamento via PIX, transação registrada com taxa e líquido freela</span></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className={styles.cardSmall + ' text-center'}>
                <p className="text-2xl font-black">R$75</p>
                <p className={styles.label}>Mínimo por serviço</p>
              </div>
              <div className={styles.cardSmall + ' text-center'}>
                <p className="text-2xl font-black">12h</p>
                <p className={styles.label}>Antecedência</p>
              </div>
              <div className={styles.cardSmall + ' text-center'}>
                <p className="text-2xl font-black">15%</p>
                <p className={styles.label}>Taxa app</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA FREELA */}
      <section className={`border-t-4 ${styles.isDark ? 'bg-zinc-900 border-white' : 'bg-white border-black'}`}>
        <div className={`${styles.pageContainer} py-12`}>
          <h2 className={styles.typography.h1 + ' mb-8'}>Para quem quer trampar</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={styles.cardSmall}>
              <h3 className="font-black uppercase text-sm">1. Cadastro</h3>
              <p className={styles.typography.bodySmall + ' mt-2'}>Nome, CPF (bloqueado após cadastro), e-mail com código, função principal, valor hora base, bio, bairro, endereço com lat/lng, cidade, como chega (moto, ônibus), ajuda Uber.</p>
            </div>
            <div className={styles.cardSmall}>
              <h3 className="font-black uppercase text-sm">2. Mural</h3>
              <p className={styles.typography.bodySmall + ' mt-2'}>Vê vagas abertas perto de você. Cada card mostra título, função, valor_hora, valor_servico, valor_transporte, total_freela, horário UTC convertido pro seu fuso, endereço e bairro. Sem ver quem é contratante.</p>
            </div>
            <div className={styles.cardSmall}>
              <h3 className="font-black uppercase text-sm">3. Candidatura</h3>
              <p className={styles.typography.bodySmall + ' mt-2'}>Clica candidatar, mensagem opcional. Se aceito, vira trampo na tabela trampos. Cronômetro conta horas, depois avalia contratante de 1 a 5 estrelas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PARA CONTRATANTE */}
      <section className="border-t-4 border-black bg-[#FFC700] text-black">
        <div className="max-w-[1280px] mx-auto px-4 py-12">
          <h2 className="text-2xl font-black uppercase">Para quem quer contratar</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-black uppercase text-sm">1. Publicar Vaga</h3>
              <p className="text-xs mt-2 font-medium">Título, descrição, função (garçom, cozinheiro...), entrada e saída, meio pagamento PIX/cartão, valor serviço + transporte, calcula total_freela e valor_hora automaticamente. Endereço com CEP que busca bairro/cidade.</p>
            </div>
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-black uppercase text-sm">2. Meus Trampos</h3>
              <p className="text-xs mt-2 font-medium">Lista todas vagas publicadas com status PENDENTE, ABERTA, PREENCHIDA, CANCELADA. Mostra serviço, transporte, total freela e hora. Botão editar leva pra publicar com dados salvos em localStorage.</p>
            </div>
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-black uppercase text-sm">3. Candidatos e Pagamento</h3>
              <p className="text-xs mt-2 font-medium">Vê candidatos, aceita um (outros recusados automaticamente). Gera transação com código TRX-YYYYMMDD-000001, valor_base, taxa_percentual, valor_total_contratante, valor_liquido_freela.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CÓDIGO FREELA */}
      <section className={styles.pageContainer + ' py-12'}>
        <div className={styles.card + ' border-dashed'}>
          <div className="flex justify-between items-start">
            <div>
              <h2 className={styles.typography.h2}>Código Freela</h2>
              <p className={styles.typography.bodySmall + ' mt-2 max-w-2xl'}>Transparência total: autônomo art 442-B CLT, LGPD, limite MEI R$1500 por contratante, taxa cancelamento R$40 em menos de 12h, intermediação 15%. Modo DUAL permite ser freela e contratante ao mesmo tempo.</p>
            </div>
            <button onClick={() => setTelaAtiva('codigoFreela')} className={styles.buttonSecondary + ' text-xs whitespace-nowrap ml-4'}>Ler código completo</button>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className={`${styles.isDark ? 'bg-black border-white' : 'bg-black border-black'} border-t-4 text-white py-12`}>
        <div className={`${styles.pageContainer} text-center`}>
          <h2 className="text-3xl font-black uppercase">Pronto pra começar?</h2>
          <p className="text-sm mt-2 opacity-80">Cadastro com e-mail + código de 6 dígitos, sem senha. Validação em 5 minutos, log no terminal em DEV.</p>
          <div className="flex justify-center gap-3 mt-6">
            <button onClick={() => irParaCadastro()} className="px-8 py-4 bg-white text-black border-2 border-white font-black uppercase text-sm hover:bg-zinc-100">Criar conta</button>
            <button onClick={() => setTelaAtiva('login')} className="px-8 py-4 bg-[#0066FF] text-white border-2 border-[#0066FF] font-black uppercase text-sm hover:bg-[#0055DD]">Fazer login</button>
          </div>
        </div>
      </section>
    </div>
  );
}
