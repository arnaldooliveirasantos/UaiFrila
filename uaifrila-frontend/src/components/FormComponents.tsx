import React from 'react';
import { useTheme } from '../context/ThemeContext';

// PADRÃO UNIFICADO DE ESTILO PARA TODOS OS FORMULÁRIOS - CLARO/ESCURO
// Usar em todos os formulários existentes e futuros

export const useFormStyles = () => {
  const { isDark } = useTheme();
  
  const input = `w-full h-[48px] px-4 text-sm border-2 outline-none font-medium transition-all
    ${isDark 
      ? 'bg-zinc-900 text-white border-zinc-700 placeholder:text-zinc-500 focus:border-[#0066FF] focus:bg-black' 
      : 'bg-white text-black border-black placeholder:text-zinc-400 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
    }`;

  const label = `text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-black'}`;

  const card = `p-6 border-2 ${isDark ? 'bg-zinc-900 border-white text-white shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]' : 'bg-white border-black text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'}`;

  const buttonPrimary = `w-full py-4 font-black uppercase text-sm border-2 border-black transition-all
    ${isDark ? 'bg-[#0066FF] text-white hover:bg-[#0055DD]' : 'bg-black text-white hover:bg-zinc-800'}`;

  const buttonSecondary = `w-full py-3 font-black uppercase text-xs border-2 transition-all
    ${isDark ? 'bg-white text-black border-white hover:bg-zinc-100' : 'bg-white text-black border-black hover:bg-zinc-50'}`;

  const select = input;
  const textarea = `w-full min-h-[80px] p-4 text-sm border-2 outline-none font-medium resize-none
    ${isDark 
      ? 'bg-zinc-900 text-white border-zinc-700 placeholder:text-zinc-500 focus:border-[#0066FF]' 
      : 'bg-white text-black border-black placeholder:text-zinc-400'
    }`;

  return { input, label, card, buttonPrimary, buttonSecondary, select, textarea, isDark };
};

// Componentes reutilizáveis
export function FormInput({ label, ...props }: any) {
  const { input, label: labelClass } = useFormStyles();
  return (
    <div className="flex flex-col gap-1">
      {label && <label className={labelClass}>{label}</label>}
      <input className={input} {...props} />
    </div>
  );
}

export function FormSelect({ label, children, ...props }: any) {
  const { select, label: labelClass } = useFormStyles();
  return (
    <div className="flex flex-col gap-1">
      {label && <label className={labelClass}>{label}</label>}
      <select className={select} {...props}>{children}</select>
    </div>
  );
}

export function FormCard({ children, className = '' }: any) {
  const { card } = useFormStyles();
  return <div className={`${card} ${className}`}>{children}</div>;
}

export function FormButton({ children, variant = 'primary', ...props }: any) {
  const { buttonPrimary, buttonSecondary } = useFormStyles();
  const cls = variant === 'primary' ? buttonPrimary : buttonSecondary;
  return <button className={cls} {...props}>{children}</button>;
}
