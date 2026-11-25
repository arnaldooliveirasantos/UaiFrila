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
              Trampos diários na sua cidade.<br />
              Sem enrolação, pagamento no dia.
            </p>
            <p className={`${styles.typography.bodySmall} mt-4 max-w-lg`}>
              Conectamos freelas e contratantes da mesma cidade. Garçom, cozinheiro, diarista, segurança — tudo com endereço real, valor por serviço e transporte incluso. Pague no cartão e o freela recebe na hora.
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
              <span className={styles.badge('default')}>Sem CLT — art. 442-B</span>
              <span className={styles.badge('success')}>Cartão = freela recebe na hora</span>
              <span className={styles.badge('warning')}>Pix economiza 5%</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className={styles.cardHighlight}>
              <h3 className="font-black uppercase">Como funciona?</h3>
              <div className="mt-4 space-y-3 text-sm font-bold">
                <div className="flex gap-3"><span className="font-black">1.</span><span>Contratante publica vaga com título, função, entrada/saída, valor serviço + transporte e endereço real (CEP busca bairro/cidade)</span></div>
                <div className="flex gap-3"><span className="font-black">2.</span><span>Freela vê no mural e se candidata — sem ver quem é o contratante</span></div>
                <div className="flex gap-3"><span className="font-black">3.</span><span>Contratante aceita até o último dia permitido (aviso 60 min antes do prazo)</span></div>
                <div className="flex gap-3"><span className="font-black">4.</span><span>Pagamento fica em escrow: Pix com desconto ou cartão — cartão o freela recebe na hora após confirmar</span></div>
              </div>
            </div>

            {/* PATCH 25: no lugar de 12h Antecedência -> Pague no Cartão e o Freela Recebe na Hora */}
            <div className="grid grid-cols-3 gap-3">
              <div className={styles.cardSmall + ' text-center border-b-4 border-black'}>
                <p className="text-2xl font-black">R$75</p>
                <p className={styles.label}>Mínimo por serviço</p>
              </div>
              <div className="bg-white border-4 border-black p-3 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[11px] font-black uppercase bg-black text-white inline-block px-1.5 py-0.5 mb-1">NOVO</p>
                <p className="text-xl font-black uppercase leading-none text-black">Cartão</p>
                <p className="text-[11px] font-black uppercase text-black mt-1 leading-tight">Freela recebe na hora</p>
              </div>
              <div className={styles.cardSmall + ' text-center border-b-4 border-[#0066FF]'}>
                <p className="text-2xl font-black">Pix</p>
                <p className={styles.label}>Economiza 5% de taxa</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* REGRAS DE PAGAMENTO — NOVO */}
      <section className="border-t-4 border-black bg-white text-black py-12">
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <h2 className="text-2xl font-black uppercase">Pague no cartão e o freela recebe na hora</h2>
            <span className="text-[11px] font-black uppercase bg-[#FFC700] border-2 border-black px-2 py-1">Escrow seguro + repasse em 15 min</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[11px] font-black uppercase opacity-60">01 — Escrow</p>
              <h3 className="font-black uppercase text-sm mt-1">Pagamento protegido</h3>
              <p className="text-xs mt-2 font-medium leading-snug">Ao aceitar o candidato, o valor fica reservado. Contratante paga até o último dia de aceite (aviso 60 min antes). Sem pagamento, a vaga volta ao mural.</p>
            </div>
            <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[11px] font-black uppercase opacity-60">02 — Cartão na hora</p>
              <h3 className="font-black uppercase text-sm mt-1">Cartão = recebe na hora</h3>
              <p className="text-xs mt-2 font-black leading-snug">Pagou no cartão via Checkout Bricks? Assim que o contratante confirma a presença, o repasse Pix cai em até 15 min. Auto-confirmação também dispara o repasse.</p>
            </div>
            <div className="bg-white border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[11px] font-black uppercase opacity-60">03 — Cancelamento</p>
              <h3 className="font-black uppercase text-sm mt-1">100% de volta</h3>
              <p className="text-xs mt-2 font-medium leading-snug">Cancelou antes do início? Estorno total. Pix volta integral, cartão estorna no provedor. Sem multa escondida.</p>
            </div>
            <div className="bg-[#FFC700] border-4 border-black p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[11px] font-black uppercase opacity-60">04 — Transporte</p>
              <h3 className="font-black uppercase text-sm mt-1">Por turno</h3>
              <p className="text-xs mt-2 font-medium leading-snug">Transporte é por turno. 3 turnos no mesmo dia = 3 transportes. Pode ser R$0 se combinar. Serviço e transporte multiplicados pela quantidade de vagas.</p>
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
              <p className={styles.typography.bodySmall + ' mt-2'}>Nome, CPF (bloqueado após cadastro), e-mail com código, função principal, valor hora base, bio, bairro, endereço com lat/lng, cidade, como chega (moto, ônibus), ajuda Uber. Pix com validação se titular diferente.</p>
            </div>
            <div className={styles.cardSmall}>
              <h3 className="font-black uppercase text-sm">2. Mural</h3>
              <p className={styles.typography.bodySmall + ' mt-2'}>Vê vagas perto de você, com filtros e ordenação. Card mostra serviço + transporte por candidato, sem ver quem é o contratante. Vaga já aplicada não reaparece.</p>
            </div>
            <div className={styles.cardSmall}>
              <h3 className="font-black uppercase text-sm">3. Trampo e repasse</h3>
              <p className={styles.typography.bodySmall + ' mt-2'}>Se aceito, vira trampo com cronômetro e check-in/out por turno. Contratante confirma presença e o Pix cai em até 15 min. Depois avalia de 1 a 5 estrelas.</p>
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
              <p className="text-xs mt-2 font-medium">Título, função, entrada e saída por turnos, valor serviço + transporte por candidato, quantidade de vagas. Total claro por candidato, sem surpresa no checkout.</p>
            </div>
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-black uppercase text-sm">2. Meus Trampos</h3>
              <p className="text-xs mt-2 font-medium">Lista vagas com status PENDENTE, ABERTA, PREENCHIDA, CANCELADA. Mostra serviço + transporte por candidato. Botão editar reaproveita endereço e turnos.</p>
            </div>
            <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-black uppercase text-sm">3. Candidatos e pagamento</h3>
              <p className="text-xs mt-2 font-medium">Aceita candidatos (outros recusados). Pagamento em escrow até último dia de aceite. Checkout Bricks: cartão gera token no front, nunca salva número. Pix mostra economia vs cartão.</p>
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
              <p className={styles.typography.bodySmall + ' mt-2 max-w-2xl'}>Autônomo art 442-B CLT, LGPD, limite MEI R$1500 por contratante, <b>cancelamento antes do início = 100% de volta</b>, comissão 10%, Pix economiza a taxa do cartão, escrow até aceite, repasse em 15 min após confirmação. Modo DUAL: freela e contratante ao mesmo tempo.</p>
            </div>
            <button onClick={() => setTelaAtiva('codigoFreela')} className={styles.buttonSecondary + ' text-xs whitespace-nowrap ml-4'}>Ler código completo</button>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className={`${styles.isDark ? 'bg-black border-white' : 'bg-black border-black'} border-t-4 text-white py-12`}>
        <div className={`${styles.pageContainer} text-center`}>
          <h2 className="text-3xl font-black uppercase">Pronto pra começar?</h2>
          <p className="text-sm mt-2 opacity-80">Pague no cartão e o freela recebe na hora. Pix economiza a taxa de 5%. Cadastro com e-mail + código de 6 dígitos, sem senha.</p>
          <div className="flex justify-center gap-3 mt-6">
            <button onClick={() => irParaCadastro()} className="px-8 py-4 bg-white text-black border-2 border-white font-black uppercase text-sm hover:bg-zinc-100">Criar conta</button>
            <button onClick={() => setTelaAtiva('login')} className="px-8 py-4 bg-[#0066FF] text-white border-2 border-[#0066FF] font-black uppercase text-sm hover:bg-[#0055DD]">Fazer login</button>
          </div>
        </div>
      </section>
    </div>
  );
}
