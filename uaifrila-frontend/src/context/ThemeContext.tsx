import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  styles: any;
  pageBackgroundStyle: React.CSSProperties;
}

const DEFAULT_VALUE: ThemeContextType = {
  theme: 'dark',
  toggleTheme: () => {},
  isDark: true,
  styles: {},
  pageBackgroundStyle: {},
};

const ThemeContext = createContext<ThemeContextType>(DEFAULT_VALUE);
const STORAGE_KEY = 'uaifrila:theme';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    try {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    } catch { return 'dark'; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const pageBackgroundStyle: React.CSSProperties = theme === 'dark' ? {
    backgroundColor: '#000000',
    backgroundImage: `linear-gradient(to right, rgba(0,102,255,0.6) 1.2px, transparent 1.2px), linear-gradient(to bottom, rgba(0,102,255,0.6) 1.2px, transparent 1.2px)`,
    backgroundSize: '40px 40px',
    backgroundPosition: '0 0',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
  } : {
    backgroundColor: '#CC990038',
    backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.6) 1.2px, transparent 1.2px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1.2px, transparent 1.2px)`,
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

// CORREÇÃO: NÃO dá throw se não houver Provider.
// Antes: throw new Error('useTheme deve ser usado dentro de ThemeProvider')
// Isso quebrava qualquer tela renderizada fora do Provider (ex: PainelVariaveis em rota isolada / teste).
// Agora: devolve o DEFAULT (dark) e a tela funciona, mesmo sem Provider.
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) return DEFAULT_VALUE;
  return ctx;
};
export default ThemeContext;
