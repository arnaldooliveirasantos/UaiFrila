import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  styles: any;
  pageBackgroundStyle: React.CSSProperties;
}

const ThemeContext = createContext<ThemeContextType>({ 
  theme: 'dark' as Theme, 
  toggleTheme: () => {}, 
  isDark: true,
  styles: {} as any,
  pageBackgroundStyle: {}
});

const STORAGE_KEY = 'uaifrila:theme';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    try {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // FUNDO OFICIAL COM GRID - aplicado no wrapper root
  const pageBackgroundStyle: React.CSSProperties = theme === 'dark' ? {
    backgroundColor: '#000000',
    backgroundImage: `
      linear-gradient(to right, rgba(0,102,255,0.22) 1.2px, transparent 1.2px),
      linear-gradient(to bottom, rgba(0,102,255,0.22) 1.2px, transparent 1.2px)
    `,
    backgroundSize: '40px 40px',
    backgroundPosition: '0 0',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
  } : {
    backgroundColor: '#FFFFFF',
    backgroundImage: `
      linear-gradient(to right, rgba(204,153,0,0.22) 1.2px, transparent 1.2px),
      linear-gradient(to bottom, rgba(204,153,0,0.22) 1.2px, transparent 1.2px)
    `,
    backgroundSize: '36px 36px',
    backgroundPosition: '0 0',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
  };

  const styles = {
    bgGeral: theme === 'dark' ? 'bg-black' : 'bg-white',
    bgQuadros: theme === 'dark' ? 'bg-zinc-900 text-white border-white' : 'bg-white text-black border-black',
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark', styles, pageBackgroundStyle }}>
      <div style={pageBackgroundStyle} className={`min-h-screen w-full transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  return ctx;
};

// Helpers compatíveis
export const getInputClass = (isDark: boolean, extra = '') => {
  return `w-full h-[48px] px-4 text-sm border-2 outline-none font-medium transition-all rounded-none
    ${isDark 
      ? 'bg-zinc-900 text-white border-zinc-700 placeholder:text-zinc-500 focus:border-[#0066FF] focus:bg-black' 
      : 'bg-white text-black border-black placeholder:text-zinc-400 focus:border-black focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
    } ${extra}`;
};

export const getLabelClass = (isDark: boolean) => {
  return `text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-zinc-300' : 'text-black'}`;
};

export const getCardClass = (isDark: boolean, extra = '') => {
  return `p-6 border-2 transition-all rounded-none
    ${isDark 
      ? 'bg-zinc-900 border-white text-white shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]' 
      : 'bg-white border-black text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
    } ${extra}`;
};
