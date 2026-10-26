import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function PainelAdminFinanceiro() {
  const { styles } = useTheme();
  const [transacoes] = useState([
    { id: 1, funcao: 'Garçom', data: '2026-05-13', contratante: 'Bar do Zé', freela: 'João', valor_cheio: 150, comissao: 15, status: 'PAGO' },
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className={`p-8 ${styles.bgQuadros}`}>
        <h2 className="text-2xl font-black uppercase">Transações por Período - Só Admin</h2>
        <div className="mt-4 flex gap-2">
          <input type="date" className={`px-3 py-2 text-xs ${styles.input}`} />
          <input type="date" className={`px-3 py-2 text-xs ${styles.input}`} />
          <button className={`px-4 py-2 text-xs font-black uppercase ${styles.btnPrimary}`}>Filtrar</button>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-xs border-2 border-black">
            <thead className="bg-black text-white"><tr><th className="p-2">ID</th><th>Função</th><th>Data</th><th>Contratante</th><th>Freela</th><th>Valor Cheio</th><th>Comissão 10%</th><th>Status</th></tr></thead>
            <tbody>{transacoes.map(t=><tr key={t.id} className="border-t border-black/10"><td className="p-2">{t.id}</td><td>{t.funcao}</td><td>{t.data}</td><td>{t.contratante}</td><td>{t.freela}</td><td>R$ {t.valor_cheio}</td><td>R$ {t.comissao}</td><td>{t.status}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
