import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function CodigoFreela({ setTelaAtiva }: { setTelaAtiva: (t: string) => void }) {
  const { isDark } = useTheme();
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className={`mt-4 text-4xl font-black uppercase ${isDark ? 'text-white' : 'text-black'}`}>Código Freela UAI FRILA</h1>
      <p className="mt-2 text-sm opacity-70">Transparência total para freelas e contratantes.</p>

      <div className={`mt-8 p-6 border-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
        <h2 className="font-black uppercase text-lg">1. Autônomo Art 442-B CLT</h2>
        <p className="text-xs mt-2 leading-relaxed">Você é autônomo, sem vínculo CLT. Emite nota como MEI ou recebe como autônomo. Não há horário fixo, só trampo por diária.</p>
      </div>

      <div className={`mt-4 p-6 border-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
        <h2 className="font-black uppercase text-lg">2. LGPD</h2>
        <p className="text-xs mt-2 leading-relaxed">Seus dados (CPF 123.***.***-01, e-mail, bairro) são usados só para conectar você ao trampo. CPF bloqueado para edição por segurança.</p>
      </div>

      <div className={`mt-4 p-6 border-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
        <h2 className="font-black uppercase text-lg">3. MEI R$1500</h2>
        <p className="text-xs mt-2">Limite de R$1500 por contratante por mês para não caracterizar vínculo. Acima disso, plataforma pausa novos trampos com mesmo contratante.</p>
      </div>

      <div className={`mt-4 p-6 border-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
        <h2 className="font-black uppercase text-lg">4. Cancelamento R$40</h2>
        <p className="text-xs mt-2">Cancelamento em menos de 12h antes do trampo gera taxa de R$40 para compensar contratante e freela reserva.</p>
      </div>

      <div className={`mt-4 p-6 border-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
        <h2 className="font-black uppercase text-lg">5. Intermediação</h2>
        <p className="text-xs mt-2">Taxa de intermediação de 15% sobre valor da diária. Freela recebe 85%, plataforma 15% para operação, suporte e garantia.</p>
      </div>

      <div className={`mt-8 p-6 border-2 border-dashed ${isDark ? 'border-white/30' : 'border-black/30'}`}>
        <h3 className="font-black uppercase text-sm">Modo DUAL - Regra importante</h3>
        <p className="text-xs mt-2">Você pode ser Freela e Contratante ao mesmo tempo (DUAL). Uma vez que vira DUAL, não pode voltar para modo simples por segurança contratual. No cadastro você escolhe, na edição pode evoluir para DUAL mas não voltar.</p>
        <button onClick={() => setTelaAtiva('cadastro')} className="mt-4 px-6 py-3 bg-black text-white border-2 border-black font-black uppercase text-xs">Quero me cadastrar</button>
      </div>
    </div>
  );
}