import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function PainelConfiguracaoCidades() {
  const { styles } = useTheme();
  const [cidades, setCidades] = useState<any[]>([
    { id: 1, nome: 'Uberlândia', estado: 'MG', ativo: true },
    { id: 2, nome: 'Uberaba', estado: 'MG', ativo: false },
    { id: 3, nome: 'Araguari', estado: 'MG', ativo: false },
  ]);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const toggleCidade = async (id: number, ativo: boolean) => {
    const token = localStorage.getItem('@UaiFrila:token');
    await fetch(`${API}/admin/cidade/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ativo: !ativo }) });
    setCidades(prev => prev.map(c => c.id === id ? { ...c, ativo: !ativo } : c));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className={`p-8 ${styles.bgQuadros}`}>
        <h2 className="text-2xl font-black uppercase">Configuração de Cidades - Só Admin</h2>
        <p className="text-xs mt-1">Relação bairros → cidades → estado → país. Ativar apenas Uberlândia inicialmente. Pode ativar cidade que quiser.</p>
        <div className="mt-6 space-y-3">
          {cidades.map(c => (
            <div key={c.id} className="flex justify-between items-center p-4 border-2 border-black/10">
              <span className="font-bold text-sm">{c.nome} - {c.estado} {c.ativo ? '🟢 Ativa' : '🔴 Inativa'}</span>
              <button onClick={()=>toggleCidade(c.id, c.ativo)} className={`px-4 py-2 text-xs font-black uppercase ${c.ativo ? styles.btnDanger : styles.btnPrimary}`}>{c.ativo ? 'Desativar' : 'Ativar'}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
