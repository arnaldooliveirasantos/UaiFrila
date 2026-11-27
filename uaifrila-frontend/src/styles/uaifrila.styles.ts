// UAI FRILA - SISTEMA CENTRAL DE ESTILOS
// REGRA: Nenhuma tela deve ter cor hardcoded. Tudo vem daqui.
// Uso correto:
//   const styles = useUaiFrilaStyles();
//   const { isDark } = useTheme(); // se precisar de isDark direto
//   className={styles.card}            // string
//   className={styles.buttonPrimary(false)} // FUNÇÃO (disabled?: boolean) => string
//   className={styles.buttonSecondary}  // STRING, NÃO é função - não chame styles.buttonSecondary()
//   className={styles.input}           // string
//   className={styles.badge('success')} // FUNÇÃO (variant) => string

import React from "react";
import { useTheme } from "../context/ThemeContext";

export type ThemeMode = "light" | "dark";

export const Colors = {
  primary: "#0066FF",
  accent: "#FFC700",
  mustard: "#CC9900",
  danger: "#E53935",
  success: "#00C851",
  light: {
    bgPage: "#CC9900",
    bgCard: "#CC9900",
    textPrimary: "text-black",
    border: "border-black",
    shadow: "shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
  },
  dark: {
    bgPage: "#000000",
    bgCard: "bg-zinc-900",
    textPrimary: "text-white",
    border: "border-white",
    shadow: "shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]",
  },
} as const;

export const PageBackground = {
  style: (isDark: boolean): React.CSSProperties =>
    isDark
      ? {
          backgroundColor: "#000000",
          backgroundImage: `linear-gradient(to right, rgba(0, 102, 255, 0.6) 1.2px, transparent 1.2px), linear-gradient(to bottom, rgba(0,102,255,0.6) 1.2px, transparent 1.2px)`,
          backgroundSize: "40px 40px",
        }
      : {
          backgroundColor: "#CC990038",
          backgroundImage: `linear-gradient(to right, rgb(255, 255, 255,0.6) 1.2px, transparent 1.2px), linear-gradient(to bottom, rgb(255, 255, 255,0.6) 1.2px, transparent 1.2px)`,
          backgroundSize: "36px 36px",
        },
  className: (isDark: boolean) =>
    isDark ? "bg-black text-white" : "bg-white text-black",
};

export const Typography = {
  h1: "text-2xl font-black uppercase tracking-tighter",
  h2: "text-xl font-black uppercase",
  h3: "text-sm font-black uppercase",
  label: "text-[10px] font-black uppercase tracking-wider",
  body: "text-sm font-medium",
  bodySmall: "text-xs",
  caption: "text-[10px] font-bold opacity-60",
} as const;

export const StyleConfig = {
  input: (isDark: boolean, extra = "") =>
    `w-full h-[48px] px-4 text-sm border-2 outline-none font-medium transition-all rounded-none ${isDark ? "bg-zinc-900 text-white border-zinc-700 placeholder:text-zinc-500 focus:border-[#0066FF] focus:bg-black" : "bg-white text-black border-black placeholder:text-zinc-400 focus:border-black focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"} ${extra}`,
  textarea: (isDark: boolean, extra = "") =>
    `w-full px-4 py-3 text-sm border-2 outline-none font-medium rounded-none min-h-[100px] ${isDark ? "bg-zinc-900 text-white border-zinc-700" : "bg-white text-black border-black"} ${extra}`,
  select: (isDark: boolean, extra = "") =>
    `w-full h-[48px] px-4 text-sm border-2 outline-none font-medium rounded-none ${isDark ? "bg-zinc-900 text-white border-zinc-700" : "bg-white text-black border-black"} ${extra}`,
  label: (isDark: boolean) =>
    `text-[10px] font-black uppercase tracking-wider ${isDark ? "text-zinc-300" : "text-black"}`,
  card: (isDark: boolean, extra = "") =>
    `p-6 border-2 transition-all rounded-none ${isDark ? "bg-zinc-900 border-white text-white shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)]" : "bg-white border-black text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"} ${extra}`,
  cardSmall: (isDark: boolean, extra = "") =>
    `p-4 border-2 transition-all rounded-none ${isDark ? "bg-zinc-900 border-white text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]" : "bg-white border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"} ${extra}`,
  cardHighlight: (isDark: boolean) =>
    `p-6 border-4 transition-all rounded-none bg-[#FFC700] text-black border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`,
  // buttonPrimary É FUNÇÃO - recebe disabled
  buttonPrimary: (isDark: boolean, disabled = false) =>
    `w-full py-4 font-black uppercase text-sm border-2 transition-all rounded-none ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${isDark ? "bg-[#0066FF] text-white border-[#0066FF]" : "bg-black text-white border-black"}`,
  // buttonSecondary É STRING - NÃO chame como função
  buttonSecondary: (isDark: boolean) =>
    `px-4 py-2 font-black uppercase text-xs border-2 transition-all rounded-none ${isDark ? "bg-zinc-900 text-white border-white" : "bg-white text-black border-black"}`,
  buttonWarning: () =>
    `px-4 py-2 font-black uppercase text-xs border-2 border-black bg-[#FFC700] text-black rounded-none`,
  buttonDanger: () =>
    `px-4 py-2 font-black uppercase text-xs border-2 border-black bg-[#E53935] text-white rounded-none`,
  buttonGhost: (isDark: boolean) =>
    `px-4 py-2 font-black uppercase text-xs underline ${isDark ? "text-zinc-300" : "text-zinc-600"}`,
  badge: (
    isDark: boolean,
    variant: "default" | "success" | "warning" | "danger" = "default",
  ) => {
    if (variant === "success")
      return "px-2 py-1 text-[11px] font-black bg-[#00C851] text-white border-2 border-black";
    if (variant === "warning")
      return "px-2 py-1 text-[11px] font-black bg-[#FFC700] text-black border-2 border-black";
    if (variant === "danger")
      return "px-2 py-1 text-[11px] font-black bg-[#E53935] text-white border-2 border-black";
    return `px-2 py-1 text-[11px] font-black border-2 border-black ${isDark ? "bg-zinc-800 text-white" : "bg-white text-black"}`;
  },
  valorBox: (isDark: boolean) =>
    `p-4 border-2 rounded-none ${isDark ? "bg-zinc-900 border-white text-white" : "bg-white border-black text-black"}`,
  errorBox: (isDark: boolean) =>
    `p-3 bg-[#E53935] text-white border-2 border-black text-xs font-bold`,
  successBox: (isDark: boolean) =>
    `p-3 bg-[#00C851] text-white border-2 border-black text-xs font-bold`,
  pageContainer: (isDark: boolean) =>
    `max-w-5xl mx-auto px-4 py-8 ${isDark ? "text-white" : "text-black"}`,
  pageContainerSmall: (isDark: boolean) =>
    `max-w-md mx-auto mt-8 ${isDark ? "text-white" : "text-black"}`,
  grid2Cols: "grid grid-cols-1 md:grid-cols-2 gap-4",
  gridMainSide: "grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6",
};

// Seguro: useTheme() agora NÃO dá throw sem Provider (volta DEFAULT dark)
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
    input: StyleConfig.input(isDark),
    textarea: StyleConfig.textarea(isDark),
    select: StyleConfig.select(isDark),
    label: StyleConfig.label(isDark),
    card: StyleConfig.card(isDark),
    cardSmall: StyleConfig.cardSmall(isDark),
    cardHighlight: StyleConfig.cardHighlight(isDark),
    buttonPrimary: (disabled?: boolean) =>
      StyleConfig.buttonPrimary(isDark, disabled),
    buttonSecondary: StyleConfig.buttonSecondary(isDark),
    buttonWarning: StyleConfig.buttonWarning(),
    buttonDanger: StyleConfig.buttonDanger(),
    buttonGhost: StyleConfig.buttonGhost(isDark),
    badge: (variant?: "default" | "success" | "warning" | "danger") =>
      StyleConfig.badge(isDark, variant),
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
export const getInputClass = (isDark: boolean, extra = "") =>
  StyleConfig.input(isDark, extra);
export const getLabelClass = (isDark: boolean) => StyleConfig.label(isDark);
export const getCardClass = (isDark: boolean, extra = "") =>
  StyleConfig.card(isDark, extra);
export const getSelectClass = (isDark: boolean, extra = "") =>
  StyleConfig.select(isDark, extra);
