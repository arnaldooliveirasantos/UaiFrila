
// =====================================================================
// UAI FRILA - SISTEMA CENTRAL DE ESTILOS COM GRID
// Arquivo: src/styles/uaifrila.styles.ts
// =====================================================================
// REGRA: Nenhuma tela deve ter formatação de estilo ou cor hardcoded.
// Tudo deve vir deste arquivo.
//
// FUNDO DEFINIDO:
// - Modo claro: fundo #FFFFFF + grid mostarda #CC9900 1.2px 22% 36px
// - Modo escuro: fundo #000 puro + grid azul #0066FF 1.2px 22% 40px
// =====================================================================

export type ThemeMode = 'light' | 'dark';

// 1. PALETA DE CORES
export const Colors = {
  primary: '#0066FF',
  primaryHover: '#0055DD',
  accent: '#FFC700',
  mustard: '#CC9900', // Grid claro
  blueGrid: '#0066FF', // Grid escuro
  danger: '#E53935',
  success: '#00C851',

  light: {
    bgPage: '#FFFFFF',
    bgCard: '#FFFFFF',
    bgInput: '#FFFFFF',
    textPrimary: 'text-black',
    textSecondary: 'text-zinc-600',
    textMuted: 'text-zinc-400',
    border: 'border-black',
    borderLight: 'border-black/20',
    shadow: 'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
    shadowSmall: 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  },

  dark: {
    bgPage: '#000000',
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

// 2. FUNDO COM GRID - DEFINIÇÃO OFICIAL
export const PageBackground = {
  // Retorna style object para usar como style={}
  style: (isDark: boolean): React.CSSProperties => {
    if (isDark) {
      // Fundo #000 puro + grid azul #0066FF 1.2px 22% 40px
      return {
        backgroundColor: '#000000',
        backgroundImage: `
          linear-gradient(to right, rgba(0,102,255,0.22) 1.2px, transparent 1.2px),
          linear-gradient(to bottom, rgba(0,102,255,0.22) 1.2px, transparent 1.2px)
        `,
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0',
      };
    } else {
      // Fundo #FFFFFF + grid mostarda #CC9900 1.2px 22% 36px
      return {
        backgroundColor: '#FFFFFF',
        backgroundImage: `
          linear-gradient(to right, rgba(204,153,0,0.22) 1.2px, transparent 1.2px),
          linear-gradient(to bottom, rgba(204,153,0,0.22) 1.2px, transparent 1.2px)
        `,
        backgroundSize: '36px 36px',
        backgroundPosition: '0 0',
      };
    }
  },

  // Classe Tailwind para o wrapper geral (cor de fundo sólida, grid via style)
  className: (isDark: boolean) => {
    return isDark ? 'bg-black text-white' : 'bg-white text-black';
  }
};

// 3. TIPOGRAFIA
export const Typography = {
  h1: 'text-2xl font-black uppercase tracking-tighter',
  h2: 'text-xl font-black uppercase',
  h3: 'text-sm font-black uppercase',
  label: 'text-[10px] font-black uppercase tracking-wider',
  body: 'text-sm font-medium',
  bodySmall: 'text-xs',
  caption: 'text-[10px] font-bold opacity-60',
} as const;

// 4. COMPONENTES BASE
export const StyleConfig = {
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

  label: (isDark: boolean) => `
    text-[10px] font-black uppercase tracking-wider 
    ${isDark ? 'text-zinc-300' : 'text-black'}`,

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

  badge: (isDark: boolean, variant: 'default' | 'success' | 'warning' | 'danger' = 'default') => {
    const variants = {
      default: isDark ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-gray-100 text-black border-black',
      success: isDark ? 'bg-green-900/30 text-green-100 border-green-600' : 'bg-green-100 text-green-700 border-green-500',
      warning: isDark ? 'bg-yellow-900/30 text-yellow-100 border-yellow-600' : 'bg-yellow-100 text-yellow-800 border-yellow-500',
      danger: isDark ? 'bg-red-900/30 text-red-100 border-red-600' : 'bg-red-100 text-red-700 border-red-500',
    };
    return `px-2 py-1 text-[10px] font-black uppercase border-2 ${variants[variant]}`;
  },

  valorBox: (isDark: boolean) => `
    grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-bold border-2 p-2
    ${isDark ? 'bg-zinc-800 border-zinc-600 text-zinc-100' : 'bg-gray-50 border-black text-black'}`,

  errorBox: (isDark: boolean) => `
    border-2 p-3 font-bold text-sm
    ${isDark ? 'bg-red-900/30 border-red-600 text-red-100' : 'bg-red-100 border-red-500 text-red-700'}`,

  successBox: (isDark: boolean) => `
    border-2 p-3 font-bold text-sm
    ${isDark ? 'bg-green-900/30 border-green-600 text-green-100' : 'bg-green-100 border-green-500 text-green-700'}`,

  pageContainer: (isDark: boolean) => `
    max-w-[1280px] mx-auto px-4 py-8
    ${isDark ? 'text-white' : 'text-black'}`,

  pageContainerSmall: (isDark: boolean) => `
    max-w-md mx-auto mt-8
    ${isDark ? 'text-white' : 'text-black'}`,

  grid2Cols: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  gridMainSide: 'grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6',
};

// 5. HOOK PRINCIPAL
import { useTheme } from '../context/ThemeContext';

export const useUaiFrilaStyles = () => {
  const { isDark } = useTheme();
  
  return {
    isDark,
    colors: isDark ? Colors.dark : Colors.light,
    typography: Typography,
    pageBackground: {
      style: PageBackground.style(isDark),
      className: PageBackground.className(isDark),
    },
    // Para usar no ThemeProvider wrapper: <div style={styles.pageBackground.style} className={styles.pageBackground.className}>
    input: StyleConfig.input(isDark),
    textarea: StyleConfig.textarea(isDark),
    select: StyleConfig.select(isDark),
    label: StyleConfig.label(isDark),
    card: StyleConfig.card(isDark),
    cardSmall: StyleConfig.cardSmall(isDark),
    cardHighlight: StyleConfig.cardHighlight(isDark),
    buttonPrimary: (disabled?: boolean) => StyleConfig.buttonPrimary(isDark, disabled),
    buttonSecondary: StyleConfig.buttonSecondary(isDark),
    buttonWarning: StyleConfig.buttonWarning(),
    buttonDanger: StyleConfig.buttonDanger(),
    buttonGhost: StyleConfig.buttonGhost(isDark),
    badge: (variant?: 'default' | 'success' | 'warning' | 'danger') => StyleConfig.badge(isDark, variant),
    valorBox: StyleConfig.valorBox(isDark),
    errorBox: StyleConfig.errorBox(isDark),
    successBox: StyleConfig.successBox(isDark),
    pageContainer: StyleConfig.pageContainer(isDark),
    pageContainerSmall: StyleConfig.pageContainerSmall(isDark),
    grid2Cols: StyleConfig.grid2Cols,
    gridMainSide: StyleConfig.gridMainSide,
    raw: (fn: (isDark: boolean) => string) => fn(isDark),
  };
};

// 6. COMPATIBILIDADE
export const getInputClass = (isDark: boolean, extra = '') => StyleConfig.input(isDark, extra);
export const getLabelClass = (isDark: boolean) => StyleConfig.label(isDark);
export const getCardClass = (isDark: boolean, extra = '') => StyleConfig.card(isDark, extra);
export const getSelectClass = (isDark: boolean, extra = '') => StyleConfig.select(isDark, extra);
export const getButtonPrimaryClass = (isDark: boolean, disabled = false) => StyleConfig.buttonPrimary(isDark, disabled);
export const getButtonSecondaryClass = (isDark: boolean) => StyleConfig.buttonSecondary(isDark);
export const getPageBackgroundStyle = (isDark: boolean) => PageBackground.style(isDark);
