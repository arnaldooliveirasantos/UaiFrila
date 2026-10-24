import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function CodigoFreela() {
  const { styles } = useTheme();
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className={`p-8 ${styles.bgQuadros}`}>
        <h2 className="text-3xl font-black uppercase">📋 Código de Responsabilidades do Freela - Frila</h2>
        <p className="mt-4 text-sm font-medium">O que separa um freela que ganha R$100/dia de um que ganha R$400 e vira Super Freela</p>
        <div className="mt-6 space-y-6 text-sm">
          <div><h3 className="font-black uppercase">1. Pontualidade é tudo</h3><p>Chegue 10 min antes. Atraso avise no chat IMEDIATAMENTE. 3 atrasos sem aviso = pausa 7 dias. No-show = estorno total + 15 dias sem vagas</p></div>
          <div><h3 className="font-black uppercase">2. WhatsApp Verificado</h3><p>Responda em até 30 min. Foto real. Não passe contato por fora - banimento permanente. Taxa 10% garante Pix seguro e avaliações</p></div>
          <div><h3 className="font-black uppercase">3. O que levar sempre</h3><p>Ferramentas categoria, documento com foto, powerbank</p></div>
          <div><h3 className="font-black uppercase">4. No local</h3><p>Confirme serviço: Vim fazer X por R$Y. Não peça adiantamento. Tire foto antes/depois</p></div>
          <div><h3 className="font-black uppercase">5. Obrigações legais autônomo</h3><p>Sem FGTS/férias. MEI recomendado se &gt;R$2k/mês (R$75/mês)</p></div>
          <div><h3 className="font-black uppercase">6. Reputação = Dinheiro</h3><p>5.0 + 20 trampos = Super Freela - topo, 3x mais propostas. Abaixo 3.5 algoritmo para de mostrar</p></div>
          <div><h3 className="font-black uppercase">7. O que NUNCA fazer</h3><p>Não cobrar por fora, não levar acompanhante sem avisar, não postar foto contratante, não desmarcar em cima da hora</p></div>
        </div>
      </div>
    </div>
  );
}
