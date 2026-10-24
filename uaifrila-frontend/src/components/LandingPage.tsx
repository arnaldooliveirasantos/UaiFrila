import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function LandingPage({ onEntrar }: { onEntrar: (tela: string) => void }) {
  const { styles } = useTheme();
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className={`p-8 md:p-12 ${styles.bgQuadros} mb-8`}>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
          O Marketplace <span className="text-[#E53935] dark:text-[#0066FF]">Autônomo</span> de Uberlândia
        </h1>
        <p className="mt-6 text-lg font-medium max-w-3xl">
          Garçons, barmans, cumins, diaristas, eletricistas. Conectamos quem precisa trampar com quem precisa contratar.
          Sem CLT. Sem enrolação. Pix na hora. Avaliação que vale dinheiro.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={() => onEntrar('cadastro')} className={`px-8 py-4 text-sm font-black uppercase ${styles.btnPrimary}`}>Quero Trampar - Cadastro Freela</button>
          <button onClick={() => onEntrar('cadastro')} className={`px-8 py-4 text-sm font-black uppercase ${styles.btnYellow}`}>Sou Bar/Restaurante - Contratar</button>
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className={`p-4 ${styles.boxInfo}`}><b className="block font-black uppercase">R$20-25/h</b> Garçom R$20, Barman R$25, Cumim R$15. Valor limpo pro freela, com ajuda Uber R$10/15/20/30</div>
          <div className={`p-4 ${styles.boxWarn}`}><b className="block font-black uppercase">Pix 10% / Cartão 14%</b> Contratante paga taxa, freela recebe cheio. Escrow EFI Bank seguro</div>
          <div className={`p-4 ${styles.bgQuadros}`}><b className="block font-black uppercase">Ponto Real 00:00:00</b> Código início/fim entre freela e contratante. Cronômetro real, sem fake</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 ${styles.bgQuadros}`}>
          <h3 className="font-black uppercase text-lg">Como Funciona</h3>
          <ol className="mt-4 space-y-2 text-sm list-decimal pl-5 font-medium">
            <li>Cadastro com CPF, selfie, função e bairro (18 bairros Udi)</li>
            <li>Publica vaga Qui-Dom com data/hora, valor/hora, Uber, endereço com Google Maps</li>
            <li>Mural: Freela vê R$ líquido, Contratante vê total com taxa</li>
            <li>Candidatura com bloqueio de avaliação ruim (nota ≤2 não se candidatam entre si)</li>
            <li>Aceitar cria trampo ativo com código início/fim</li>
            <li>Pagamento Pix 1h antes (variável ambiente) - sem estorno após prazo</li>
            <li>Chat freela-contratante + cronômetro ponto real</li>
            <li>Avaliação final: freela avalia contratante e vice-versa. Nota máxima se sem avaliação</li>
          </ol>
        </div>
        <div className={`p-6 ${styles.bgQuadros}`}>
          <h3 className="font-black uppercase text-lg">Teste Rápido</h3>
          <p className="mt-2 text-sm font-medium">Cadastrar Bar → Publicar Vaga → Loga como Freela → Mural → Candidatar → Volta no Bar → Candidatos → Aceitar → Trampos → Iniciar Ponto e vê o cronômetro contando real!</p>
          <div className="mt-6">
            <h4 className="font-black uppercase text-xs">Taxas (só admin vê)</h4>
            <p className="text-xs mt-1">Freela vê valor cheio sem taxa. Contratante vê total cartão (14%) e Pix desconto (10%).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
