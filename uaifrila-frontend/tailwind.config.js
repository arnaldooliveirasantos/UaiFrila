/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { 
    extend: { 
      colors: { 
        claro: { vermelho: '#E53935', amarelo: '#FFC700' }, 
        escuro: { azul: '#0066FF' } 
      } 
    } 
  },
  plugins: [],
}