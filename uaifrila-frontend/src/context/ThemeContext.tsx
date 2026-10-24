import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeStyles {
  bg: string;
  bgQuadros: string;
  cardHero: string;
  boxInfo: string;
  boxWarn: string;
  btnPrimary: string;
  btnDanger: string;
  btnYellow: string;
  input: string;
  text: string;
  textMuted: string;
  gridStyle: React.CSSProperties;
}

const lightStyles: ThemeStyles = {
  bg: 'bg-[#FFFFFF]',
  text: 'text-black',
  textMuted: 'text-gray-600',
  bgQuadros: 'bg-white border-2 border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  cardHero: 'bg-white border-2 border-black text-black',
  boxInfo: 'bg-blue-50 border-2 border-black text-black',
  boxWarn: 'bg-[#FFC700] border-2 border-black text-black',
  btnPrimary: 'bg-[#E53935] text-white border-2 border-black hover:bg-red-600 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
  btnDanger: 'bg-black text-white border-2 border-black hover:bg-neutral-800',
  btnYellow: 'bg-[#FFC700] text-black border-2 border-black hover:bg-yellow-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
  input: 'bg-white border-2 border-black text-black placeholder:text-gray-400 focus:border-[#E53935] focus:ring-0',
  gridStyle: {
    backgroundColor: '#FFFFFF',
    backgroundImage: `radial-gradient(circle, #CC9900 1.2px, transparent 1.2px)`,
    backgroundSize: '36px 36px',
    opacity: 1,
  }
};

const darkStyles: ThemeStyles = {
  bg: 'bg-black',
  text: 'text-white',
  textMuted: 'text-gray-400',
  bgQuadros: 'bg-[#0A0A0A] border border-[#0066FF]/30 text-white shadow-[0_0_20px_rgba(0,102,255,0.1)]',
  cardHero: 'bg-[#0A0A0A] border border-[#0066FF]/50 text-white',
  boxInfo: 'bg-[#0066FF]/10 border border-[#0066FF]/30 text-white',
  boxWarn: 'bg-[#FF00FF]/10 border border-[#FF00FF]/30 text-white',
  btnPrimary: 'bg-[#0066FF] text-white border border-[#0066FF] hover:bg-blue-600 shadow-[0_0_15px_rgba(0,102,255,0.5)]',
  btnDanger: 'bg-[#FF00FF] text-white border border-[#FF00FF] hover:bg-fuchsia-600',
  btnYellow: 'bg-white text-black border border-white hover:bg-gray-100',
  input: 'bg-black border border-[#0066FF]/50 text-white placeholder:text-gray-500 focus:border-[#0066FF]',
  gridStyle: {
    backgroundColor: '#000000',
    backgroundImage: `radial-gradient(circle, #0066FF 1.2px, transparent 1.2px)`,
    backgroundSize: '40px 40px',
    opacity: 1,
  }
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  styles: ThemeStyles;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  styles: darkStyles,
  isDark: true
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('@UaiFrila:theme') as Theme;
    return saved || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('@UaiFrila:theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const styles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, styles, isDark: theme === 'dark' }}>
      <div className={`min-h-screen transition-colors duration-300 ${styles.bg} ${styles.text}`} style={{ position: 'relative' }}>
        {/* Grid Background - Regra exata */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0,
            pointerEvents: 'none',
            ...styles.gridStyle,
          }}
        >
          <div style={{ position: 'absolute', inset: 0, backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.78)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
