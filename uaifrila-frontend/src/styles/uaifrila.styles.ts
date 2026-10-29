
// =====================================================================
// UAI FRILA - SISTEMA CENTRAL DE ESTILOS
// Arquivo: src/styles/uaifrila.styles.ts
// =====================================================================
// REGRA: Nenhuma tela deve ter formatação de estilo ou cor hardcoded.
// Tudo deve vir deste arquivo. Facilita alteração e criação de novas telas.
// =====================================================================

export type ThemeMode = 'light' | 'dark';

// ---------------------------------------------------------------------
// 1. PALETA DE CORES - Fonte única da verdade
// ---------------------------------------------------------------------
export const Colors = {
  // Brand
  primary: '#0066FF',      // Azul principal (dark mode)
  primaryHover: '#0055DD',
  accent: '#FFC700',        // Amarelo destaque (aviso, editar)
  danger: '#E53935',        // Vermelho erro/cancelar
  success: '#00C851',       // Verde sucesso
  warning: '#FF6D00',       // Laranja aviso

  // Light theme
  light: {
    bgPage: 'bg-[#F3F4F6]',
    bgCard: 'bg-white',
    bgInput: 'bg-white',
    textPrimary: 'text-black',
    textSecondary: 'text-zinc-600',
    textMuted: 'text-zinc-400',
    border: 'border-black',
    borderLight: 'border-black/20',
    shadow: 'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
    shadowSmall: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  },

  // Dark theme
  dark: {
    bgPage: 'bg-[#0b0f19]',
    bgCard: 'bg-zinc-900',
    bgInput: 'bg-zinc-900',
    textPrimary: 'text-white',
    textSecondary: 'text-zinc-300',
    textMuted: 'text-zinc-500',
    border: 'border-white',
    borderLight: 'border-zinc-700',
    shadow: 'shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]',
    shadowSmall: 'shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]',
  }
} as const;

// ---------------------------------------------------------------------
// 2. TIPOGRAFIA
// ---------------------------------------------------------------------
export const Typography = {
  h1: 'text-2xl font-black uppercase tracking-tighter',
  h2: 'text-xl font-black uppercase',
  h3: 'text-sm font-black uppercase',
  label: 'text-[10px] font-black uppercase tracking-wider',
  body: 'text-sm font-medium',
  bodySmall: 'text-xs',
  caption: 'text-[10px] font-bold opacity-60',
} as const;

// ---------------------------------------------------------------------
// 3. COMPONENTES BASE - Inputs, Labels, Cards, Botões
// ---------------------------------------------------------------------

export const StyleConfig = {
  // INPUTS - Usar em TODOS os formulários
  input: (isDark: boolean, extra = '') => `
    w-full h-[48px] px-4 text-sm border-2 outline-none font-medium transition-all rounded-none
    ${isDark 
      ? 'bg-zinc-900 text-white border-zinc-700 placeholder:text-zinc-500 focus:border-[#0066FF] focus:bg-black' 
      : 'bg-white text-black border-black placeholder:text-zinc-400 focus:border-black focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
    } ${extra}`,

  textarea: (isDark: boolean, extra = '') => `
    w-full px-4 py-3 text-sm border-2 outline-none font-medium transition-all rounded-none min-h-[100px]
    ${isDark 
      ? 'bg-zinc-900 text-white border-zinc-700 placeholder:text-zinc-500 focus:border-[#0066FF] focus:bg-black' 
      : 'bg-white text-black border-black placeholder:text-zinc-400 focus:border-black'
    } ${extra}`,

  select: (isDark: boolean, extra = '') => `
    w-full h-[48px] px-4 text-sm border-2 outline-none font-medium transition-all rounded-none
    ${isDark 
      ? 'bg-zinc-900 text-white border-zinc-700 focus:border-[#0066FF] focus:bg-black' 
      : 'bg-white text-black border-black focus:border-black'
    } ${extra}`,

  // LABELS
  label: (isDark: boolean) => `
    text-[10px] font-black uppercase tracking-wider 
    ${isDark ? 'text-zinc-300' : 'text-black'}`,

  labelWithIcon: (isDark: boolean) => `
    text-xs font-black uppercase flex items-center gap-1
    ${isDark ? 'text-zinc-300' : 'text-black'}`,

  // CARDS
  card: (isDark: boolean, extra = '') => `
    p-6 border-2 transition-all rounded-none
    ${isDark 
      ? 'bg-zinc-900 border-white text-white shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]' 
      : 'bg-white border-black text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
    } ${extra}`,

  cardSmall: (isDark: boolean) => `
    p-4 border-4 transition-all rounded-none
    ${isDark 
      ? 'bg-zinc-900 border-white text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]' 
      : 'bg-white border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
    }`,

  cardHighlight: (isDark: boolean) => `
    p-6 border-4 transition-all rounded-none
    bg-[#FFC700] text-black border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`,

  // BOTÕES
  buttonPrimary: (isDark: boolean, disabled = false) => `
    w-full py-4 font-black uppercase text-sm border-2 transition-all rounded-none
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${isDark 
      ? 'bg-[#0066FF] text-white border-[#0066FF] hover:bg-[#0055DD]' 
      : 'bg-black text-white border-black hover:bg-zinc-800'
    }`,

  buttonSecondary: (isDark: boolean) => `
    px-4 py-2 font-black uppercase text-xs border-2 transition-all rounded-none
    ${isDark 
      ? 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700' 
      : 'bg-white text-black border-black hover:bg-zinc-100'
    }`,

  buttonWarning: () => `
    px-3 py-2 bg-[#FFC700] text-black border-2 border-black font-black text-xs uppercase hover:bg-yellow-300 transition-all rounded-none`,

  buttonDanger: () => `
    px-3 py-1 bg-[#E53935] text-white border-2 border-black font-black text-xs uppercase hover:bg-red-600 transition-all rounded-none`,

  buttonGhost: (isDark: boolean) => `
    w-full py-2 text-xs font-bold underline transition-all
    ${isDark ? 'text-zinc-300 hover:text-white' : 'text-black hover:text-zinc-700'}`,

  // BADGES E STATUS
  badge: (isDark: boolean, variant: 'default' | 'success' | 'warning' | 'danger' = 'default') => {
    const variants = {
      default: isDark ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-gray-100 text-black border-black',
      success: isDark ? 'bg-green-900/30 text-green-100 border-green-600' : 'bg-green-100 text-green-700 border-green-500',
      warning: isDark ? 'bg-yellow-900/30 text-yellow-100 border-yellow-600' : 'bg-yellow-100 text-yellow-800 border-yellow-500',
      danger: isDark ? 'bg-red-900/30 text-red-100 border-red-600' : 'bg-red-100 text-red-700 border-red-500',
    };
    return `px-2 py-1 text-[10px] font-black uppercase border-2 ${variants[variant]}`;
  },

  // VALOR BOX (para mostrar valores financeiros)
  valorBox: (isDark: boolean) => `
    grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-bold border-2 p-2
    ${isDark ? 'bg-zinc-800 border-zinc-600 text-zinc-100' : 'bg-gray-50 border-black text-black'}`,

  // MENSAGENS
  errorBox: (isDark: boolean) => `
    border-2 p-3 font-bold text-sm
    ${isDark ? 'bg-red-900/30 border-red-600 text-red-100' : 'bg-red-100 border-red-500 text-red-700'}`,

  successBox: (isDark: boolean) => `
    border-2 p-3 font-bold text-sm
    ${isDark ? 'bg-green-900/30 border-green-600 text-green-100' : 'bg-green-100 border-green-500 text-green-700'}`,

  // PAGE CONTAINERS
  pageContainer: (isDark: boolean) => `
    max-w-[1280px] mx-auto px-4 py-8
    ${isDark ? 'text-white' : 'text-black'}`,

  pageContainerSmall: (isDark: boolean) => `
    max-w-md mx-auto mt-8
    ${isDark ? 'text-white' : 'text-black'}`,

  // LAYOUTS
  grid2Cols: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  gridMainSide: 'grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6',
};

// ---------------------------------------------------------------------
// 4. HOOK PERSONALIZADO - Facilita uso nas telas
// ---------------------------------------------------------------------
// Uso nas telas:
// import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
// const styles = useUaiFrilaStyles();
// <div className={styles.card}>
// <input className={styles.input} />
// <button className={styles.buttonPrimary}>

import { useTheme } from '../context/ThemeContext';

export const useUaiFrilaStyles = () => {
  const { isDark } = useTheme();
  
  return {
    isDark,
    // Cores
    colors: isDark ? Colors.dark : Colors.light,
    // Tipografia
    typography: Typography,
    // Inputs
    input: StyleConfig.input(isDark),
    textarea: StyleConfig.textarea(isDark),
    select: StyleConfig.select(isDark),
    label: StyleConfig.label(isDark),
    // Cards
    card: StyleConfig.card(isDark),
    cardSmall: StyleConfig.cardSmall(isDark),
    cardHighlight: StyleConfig.cardHighlight(isDark),
    // Botões
    buttonPrimary: (disabled?: boolean) => StyleConfig.buttonPrimary(isDark, disabled),
    buttonSecondary: StyleConfig.buttonSecondary(isDark),
    buttonWarning: StyleConfig.buttonWarning(),
    buttonDanger: StyleConfig.buttonDanger(),
    buttonGhost: StyleConfig.buttonGhost(isDark),
    // Badges
    badge: (variant?: 'default' | 'success' | 'warning' | 'danger') => StyleConfig.badge(isDark, variant),
    // Boxes
    valorBox: StyleConfig.valorBox(isDark),
    errorBox: StyleConfig.errorBox(isDark),
    successBox: StyleConfig.successBox(isDark),
    // Containers
    pageContainer: StyleConfig.pageContainer(isDark),
    pageContainerSmall: StyleConfig.pageContainerSmall(isDark),
    // Grids
    grid2Cols: StyleConfig.grid2Cols,
    gridMainSide: StyleConfig.gridMainSide,
    // Helpers diretos para casos especiais
    raw: (fn: (isDark: boolean) => string) => fn(isDark),
  };
};

// ---------------------------------------------------------------------
// 5. EXPORTS COMPATIBILIDADE - Mantém compatibilidade com código antigo
// ---------------------------------------------------------------------
// Para não quebrar telas que já usam getInputClass, getLabelClass, getCardClass
export const getInputClass = (isDark: boolean, extra = '') => StyleConfig.input(isDark, extra);
export const getLabelClass = (isDark: boolean) => StyleConfig.label(isDark);
export const getCardClass = (isDark: boolean, extra = '') => StyleConfig.card(isDark, extra);
export const getSelectClass = (isDark: boolean, extra = '') => StyleConfig.select(isDark, extra);
export const getButtonPrimaryClass = (isDark: boolean, disabled = false) => StyleConfig.buttonPrimary(isDark, disabled);
export const getButtonSecondaryClass = (isDark: boolean) => StyleConfig.buttonSecondary(isDark);

// ---------------------------------------------------------------------
// 6. GUIA DE USO
// ---------------------------------------------------------------------
/*
  COMO USAR EM UMA NOVA TELA:

  1. Importe o hook:
     import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

  2. Use no componente:
     function MinhaNovaTela() {
       const styles = useUaiFrilaStyles();

       return (
         <div className={styles.pageContainer}>
           <h1 className={styles.typography.h1}>Título</h1>
           
           <div className={styles.card}>
             <label className={styles.label}>Nome *</label>
             <input className={styles.input} placeholder="Digite..." />
             
             <button className={styles.buttonPrimary()}>Salvar</button>
             <button className={styles.buttonSecondary}>Cancelar</button>
           </div>

           <div className={styles.errorBox}>Erro aqui</div>
           <div className={styles.successBox}>Sucesso aqui</div>
           
           <span className={styles.badge('success')}>Ativo</span>
         </div>
       );
     }

  REGRAS:
  - NUNCA use "bg-white", "border-black", "text-black" direto na tela
  - SEMPRE use styles.input, styles.card, styles.buttonPrimary, etc
  - Para mudar cor de tudo, edite APENAS este arquivo
  - Cores novas? Adicione em Colors e em StyleConfig
*/
