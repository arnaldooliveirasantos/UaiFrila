import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import LogoIcone from "./LogoIcone";

export default function Navbar({
  telaAtiva,
  setTelaAtiva,
  usuario,
  onLogout,
}: any) {
  const { toggleTheme, styles, isDark } = useTheme();
  const [menuAberto, setMenuAberto] = useState(false);
  const menu = [
    { id: "home", label: "Home", public: true },
    { id: "mural", label: "Mural", auth: true },
    { id: "publicar", label: "Publicar", role: "contratante" },
    { id: "candidatos", label: "Candidatos", role: "contratante" },
    { id: "trampos", label: "Meus Trampos", auth: true },
    { id: "cidades", label: "Cidades", admin: true },
    { id: "expansao", label: "Expansão", admin: true },
    { id: "transacoes", label: "Transações", admin: true },
    { id: "variaveis", label: "Variáveis", admin: true },
    { id: "codigo", label: "Código Freela", public: true },
  ];
  const filtrado = menu.filter((m: any) => {
    if (m.admin && !usuario?.is_admin) return false;
    if (
      m.role === "contratante" &&
      !usuario?.is_contratante &&
      !usuario?.is_admin
    )
      return false;
    if (m.auth && !usuario) return false;
    return true;
  });
  const handleNav = (id: string) => {
    setTelaAtiva(id);
    setMenuAberto(false);
  };
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b-2 border-black dark:border-[#0066FF]/50 bg-white/95 dark:bg-black/95">
      <div className="max-w-7xl mx-auto px-4 h-[72px] flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => handleNav("home")}
        >
          <LogoIcone size={44} />
          <span className="font-black text-xl tracking-tighter hidden sm:block">
            UAI FRILA
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-1">
          {filtrado.map((item: any) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`px-3 py-2 text-xs font-black uppercase border-2 ${telaAtiva === item.id ? "bg-black text-white dark:bg-[#0066FF]" : "border-transparent hover:border-black dark:hover:border-white"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`w-10 h-10 border-2 border-black dark:border-[#0066FF] flex items-center justify-center font-black text-xs ${isDark ? "bg-[#0066FF] text-white" : "bg-[#FFC700] text-black"}`}
          >
            {isDark ? "☾" : "☀"}
          </button>
          <div className="hidden md:flex items-center gap-2">
            {usuario ? (
              <>
                <span className="text-xs font-bold">{usuario.nome}</span>
                <button
                  onClick={onLogout}
                  className="px-3 py-2 bg-[#E53935] text-white border-2 border-black text-xs font-black uppercase"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNav("login")}
                  className={`px-4 py-2 border-2 border-black text-xs font-black uppercase ${styles.btnYellow}`}
                >
                  Login
                </button>
                <button
                  onClick={() => handleNav("cadastro")}
                  className={`px-4 py-2 text-xs font-black uppercase ${styles.btnPrimary}`}
                >
                  Cadastro
                </button>
              </>
            )}
          </div>
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="lg:hidden w-10 h-10 border-2 border-black dark:border-white bg-white dark:bg-black flex flex-col items-center justify-center gap-1"
          >
            <span
              className={`block w-5 h-0.5 bg-black dark:bg-white transition-all ${menuAberto ? "rotate-45 translate-y-1.5" : ""}`}
            />
            <span
              className={`block w-5 h-0.5 bg-black dark:bg-white ${menuAberto ? "opacity-0" : ""}`}
            />
            <span
              className={`block w-5 h-0.5 bg-black dark:bg-white transition-all ${menuAberto ? "-rotate-45 -translate-y-1.5" : ""}`}
            />
          </button>
        </div>
      </div>
      {menuAberto && (
        <div className="lg:hidden absolute top-[72px] left-0 right-0 bg-white dark:bg-black border-b-2 border-black dark:border-[#0066FF] max-h-[80vh] overflow-y-auto">
          <div className="p-4 space-y-2">
            {filtrado.map((item: any) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-4 py-3 text-sm font-black uppercase border-2 ${telaAtiva === item.id ? "bg-black text-white dark:bg-[#0066FF]" : "border-black/20 dark:border-white/20"}`}
              >
                {item.label}
              </button>
            ))}
            <div className="border-t-2 border-black/10 mt-4 pt-4 space-y-2">
              {usuario ? (
                <button
                  onClick={() => {
                    onLogout();
                    setMenuAberto(false);
                  }}
                  className="w-full px-4 py-3 bg-[#E53935] text-white border-2 border-black text-sm font-black uppercase"
                >
                  Sair
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleNav("login")}
                    className={`w-full px-4 py-3 border-2 border-black text-sm font-black uppercase ${styles.btnYellow}`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleNav("cadastro")}
                    className={`w-full px-4 py-3 text-sm font-black uppercase ${styles.btnPrimary}`}
                  >
                    Cadastro
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
