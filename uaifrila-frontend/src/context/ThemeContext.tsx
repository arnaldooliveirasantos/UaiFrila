import React, { createContext, useContext, useState } from 'react';

type Theme = 'light' | 'dark';
const ThemeContext = createContext({ theme: 'dark' as Theme, toggleTheme: () => {}, styles: {} as any });

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<Theme>('dark');
    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    const styles = {
        light: {
            bgGeral: 'bg-[#F3F4F6]', bgQuadros: 'bg-[#FFFFFF] text-[#000000] border-2 border-[#000000]',
            input: 'bg-[#FFFFFF] text-[#000000] border-2 border-[#000000] placeholder-[#000000]/50 font-bold',
            btnPrimary: 'bg-[#FFC700] text-[#000000] border-2 border-[#000000] hover:bg-[#E6B400] font-black',
            boxInfo: 'bg-[#000000] text-[#FFFFFF] border-2 border-[#E53935]', boxWarn: 'bg-[#FFC700]/10 border-2 border-[#E53935] text-[#000000]',
            grid: { background: '#FFFFFF', backgroundImage: 'radial-gradient(rgba(204, 153, 0, 0.22) 1.2px, transparent 1.2px)', backgroundSize: '36px 36px' }
        },
        dark: {
            bgGeral: 'bg-[#0b0f19]', bgQuadros: 'bg-[#000000] text-[#FFFFFF] border-2 border-[#0066FF]',
            input: 'bg-[#000000] text-[#FFFFFF] border-2 border-[#0066FF] placeholder-[#FFFFFF]/40 font-bold',
            btnPrimary: 'bg-[#0066FF] text-[#FFFFFF] border-2 border-[#0066FF] hover:bg-[#0055DD] font-black',
            boxInfo: 'bg-[#000000] border-2 border-[#FF00FF] text-[#FFFFFF]', boxWarn: 'bg-[#000000] border-2 border-[#0066FF] text-[#FF00FF]',
            grid: { background: '#000000', backgroundImage: 'radial-gradient(rgba(0, 102, 255, 0.22) 1.2px, transparent 1.2px)', backgroundSize: '40px 40px' }
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, styles: styles[theme] }}>
            <div className={`min-h-screen transition-colors duration-300 ${styles[theme].bgGeral}`}>{children}</div>
        </ThemeContext.Provider>
    );
};
export const useTheme = () => useContext(ThemeContext);