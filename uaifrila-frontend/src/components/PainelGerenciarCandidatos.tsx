import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function PainelGerenciarCandidatos() {
  const { styles } = useTheme();
  const [candidatos, setCandidatos] = useState<any[]>([
    { id: 1, nome: 'João Silva', bairro: 'Centro', distancia: '1.2km', media: 4.9, trampos: 23, como_chega: 'Moto 🏍', foto: '' },
    { id: 2, nome: 'Maria Souza', bairro: 'Granja Marileusa', distancia: '5.3km', media: 5.0, trampos: 45, como_chega: 'Carro 🚗', foto: '' },
  ]);

  const aceitar = async (id: number) => {
    alert('Aceitar cria trampo ativo com código início/fim. Pagamento EFI escrow.');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-black uppercase">Onde aceita - Lista vagas com badge vermelha pendentes → clica vaga → lista candidatos</h2>
      <div className="mt-6 grid gap-4">
        {candidatos.map(c => (
          <div key={c.id} className={`p-5 ${styles.bgQuadros} flex justify-between`}>
            <div>
              <p className="font-black">{c.nome} - {c.media}★ - {c.trampos} trampos</p>
              <p className="text-xs">📍 {c.bairro} - {c.distancia} - {c.como_chega}</p>
              <p className="text-xs opacity-70">Foto, bairro distância, avaliação 4.9★, como chega</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={()=>aceitar(c.id)} className={`px-4 py-2 text-xs font-black uppercase ${styles.btnPrimary}`}>Aceitar (cria trampo ativo)</button>
              <button className={`px-4 py-2 text-xs font-black uppercase ${styles.btnDanger}`}>Recusar</button>
              <button className="px-4 py-2 text-xs font-black uppercase border-2 border-black">Ver perfil / WhatsApp</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
