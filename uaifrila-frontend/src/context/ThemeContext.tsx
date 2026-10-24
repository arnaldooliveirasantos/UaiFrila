import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

type Theme = 'light' | 'dark';

interface ThemeStyles {
  bgGeral: string;
  bgQuadros: string;
  input: string;
  btnPrimary: string;
  boxInfo: string;
  boxWarn: string;
  cardHero: string;
  grid: React.CSSProperties;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  styles: ThemeStyles;
}

const lightStyles: ThemeStyles = {
  bgGeral: 'bg-[#F3F4F6]',
  bgQuadros: 'bg-[#FFFFFF] text-[#000000] border-2 border-[#000000]',
  input: 'bg-[#FFFFFF] text-[#000000] border-2 border-[#000000] placeholder-[#000000]/50 font-bold',
  btnPrimary: 'bg-[#FFC700] text-[#000000] border-2 border-[#000000] hover:bg-[#E6B400] font-black',
  boxInfo: 'bg-[#000000] text-[#FFFFFF] border-2 border-[#E53935]',
  boxWarn: 'bg-[#FFC700]/10 border-2 border-[#E53935] text-[#000000]',
  cardHero: 'bg-white border-2 border-black text-black',
  grid: { background: '#FFFFFF', backgroundImage: 'radial-gradient(rgba(204, 153, 0, 0.22) 1.2px, transparent 1.2px)', backgroundSize: '36px 36px' }
};

const darkStyles: ThemeStyles = {
  bgGeral: 'bg-[#0b0f19]',
  bgQuadros: 'bg-[#000000] text-[#FFFFFF] border-2 border-[#0066FF]',
  input: 'bg-[#000000] text-[#FFFFFF] border-2 border-[#0066FF] placeholder-[#FFFFFF]/40 font-bold',
  btnPrimary: 'bg-[#0066FF] text-[#FFFFFF] border-2 border-[#0066FF] hover:bg-[#0055DD] font-black',
  boxInfo: 'bg-[#000000] border-2 border-[#FF00FF] text-[#FFFFFF]',
  boxWarn: 'bg-[#000000] border-2 border-[#0066FF] text-[#FF00FF]',
  cardHero: 'bg-[#0A0A0A] border border-gray-800 text-white',
  grid: { background: '#000000', backgroundImage: 'radial-gradient(rgba(0, 102, 255, 0.22) 1.2px, transparent 1.2px)', backgroundSize: '40px 40px' }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('@UaiFrila:theme') as Theme | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('@UaiFrila:theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const value = useMemo(() => ({
    theme,
    toggleTheme,
    styles: theme === 'light' ? lightStyles : darkStyles
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      <div className={`min-h-screen transition-colors duration-300 ${value.styles.bgGeral}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
