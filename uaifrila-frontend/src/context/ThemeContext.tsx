import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  styles: any;
}

const ThemeContext = createContext<ThemeContextType>({ 
  theme: 'dark' as Theme, 
  toggleTheme: () => {}, 
  isDark: true,
  styles: {} as any 
});

const STORAGE_KEY = 'uaifrila:theme';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const styles = {
    bgGeral: theme === 'dark' ? 'bg-[#0b0f19]' : 'bg-[#F3F4F6]',
    bgQuadros: theme === 'dark' 
      ? 'bg-black text-white border-[#0066FF]' 
      : 'bg-white text-black border-black',
    input: theme === 'dark'
      ? 'bg-black text-white border-white placeholder:text-zinc-500 focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]'
      : 'bg-white text-black border-black placeholder:text-zinc-400 focus:border-black focus:ring-1 focus:ring-black',
    btnPrimary: theme === 'dark'
      ? 'bg-[#0066FF] text-white border-[#0066FF] hover:bg-[#0055DD]'
      : 'bg-black text-white border-black hover:bg-zinc-800',
    card: theme === 'dark'
      ? 'bg-zinc-900 border-white text-white'
      : 'bg-white border-black text-black',
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark', styles }}>
      <div className={`min-h-screen transition-colors duration-300 ${styles.bgGeral}`}>
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

// Helper para inputs padronizados - USAR EM TODOS OS FORMULARIOS
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

export const getCardClass = (isDark: boolean) => {
  return `p-6 border-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]' : 'bg-white border-black text-black'}`;
};

export const getSelectClass = (isDark: boolean) => {
  return getInputClass(isDark);
};
