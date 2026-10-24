import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function PainelVariaveisAmbiente() {
  const { styles } = useTheme();
  const [variaveis, setVariaveis] = useState([
    { chave: 'EMAIL_EXPIRACAO_MINUTOS', valor: '5', descricao: 'Expiração código e-mail' },
    { chave: 'TEMPO_PAGAMENTO_ANTECEDENCIA_MINUTOS', valor: '60', descricao: 'Pix 1h antes' },
    { chave: 'TAXA_INTERMEDIACAO_PERCENTUAL', valor: '10', descricao: 'Taxa 10%' },
    { chave: 'TAXA_CARTAO_PERCENTUAL', valor: '14', descricao: 'Taxa cartão 14%' },
  ]);

  const salvar = async (chave: string, valor: string) => {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const token = localStorage.getItem('@UaiFrila:token');
    await fetch(`${API}/admin/variaveis`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ chave, valor }) });
    alert('Variável atualizada!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className={`p-8 ${styles.bgQuadros}`}>
        <h2 className="text-2xl font-black uppercase">Variáveis de Ambiente - Só Admin</h2>
        <p className="text-xs mt-1">Exibe e altera variáveis de ambiente: EMAIL_EXPIRACAO_MINUTOS, TEMPO_PAGAMENTO_ANTECEDENCIA, TAXAS</p>
        <div className="mt-6 space-y-3">
          {variaveis.map(v => (
            <div key={v.chave} className="flex flex-col md:flex-row gap-2 p-3 border-2 border-black/10">
              <div className="flex-1"><p className="font-black text-xs">{v.chave}</p><p className="text-[10px] opacity-70">{v.descricao}</p></div>
              <input value={v.valor} onChange={e=>setVariaveis(prev=>prev.map(x=>x.chave===v.chave?{...x, valor: e.target.value}:x))} className={`px-3 py-2 text-xs w-24 ${styles.input}`} />
              <button onClick={()=>salvar(v.chave, v.valor)} className={`px-4 py-2 text-xs font-black uppercase ${styles.btnPrimary}`}>Salvar</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
