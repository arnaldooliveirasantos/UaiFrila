import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function PainelExpansaoCidades() {
  const { styles } = useTheme();
  const dados = [
    { cidade: 'Uberlândia', usuarios: 1245, vagas: 342, crescimento: '+23% mês' },
    { cidade: 'Uberaba', usuarios: 0, vagas: 0, crescimento: 'Inativa' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className={`p-8 ${styles.bgQuadros}`}>
        <h2 className="text-2xl font-black uppercase">Expansão de Utilização - Crescimento por Cidade - Só Admin</h2>
        <p className="text-xs mt-1">Tela de expansão de utilização das cidades que o aplicativo passou a ser utilizado, crescimento no período, acesso só administrador</p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {dados.map(d => (
            <div key={d.cidade} className={`p-4 ${styles.boxInfo}`}>
              <h3 className="font-black">{d.cidade}</h3>
              <p className="text-xs mt-1">Usuários: {d.usuarios}</p>
              <p className="text-xs">Vagas: {d.vagas}</p>
              <p className="text-xs font-bold mt-2">{d.crescimento}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
