import React from 'react';

export const PainelConfiguracaoCidades: React.FC = () => {
    return (
        <div className="w-full bg-neutral-900/40 p-4 rounded-xl border border-gray-800 text-white">
            <h3 className="font-bold uppercase text-sm mb-2">🗺️ Expansão Regional</h3>
            <div className="bg-black p-3 rounded border border-gray-800 flex justify-between items-center">
                <span>Uberlândia (MG)</span>
                <span className="text-xs bg-emerald-600 px-2 py-0.5 rounded font-bold">🟢 ATIVA</span>
            </div>
        </div>
    );
};
