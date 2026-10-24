import React, { useEffect, useState } from 'react';

interface RolePermissao {
    role_id: number;
    role_nome: string;
    permissoes: Array<{ id: number; nome: string; chave: string }>;
}

export const PainelPermissoesCategorias: React.FC = () => {
    const [matriz, setMatriz] = useState<RolePermissao[]>([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        // Mock funcional respeitando o retorno da estrutura da API RBAC
        const dadosMock = [
            { role_id: 1, role_nome: "SUPER_ADMIN", permissoes: [{ id: 1, nome: "Visualizar Transações Financial", chave: "VER_TRANSACOES" }] },
            { role_id: 2, role_nome: "ADMIN_FINANCEIRO", permissoes: [] },
            { role_id: 3, role_nome: "ADMIN_REGIONAL", permissoes: [] },
            { role_id: 4, role_nome: "CONTRATANTE_PREMIUM", permissoes: [] },
            { role_id: 5, role_nome: "CONTRATANTE_PADRAO", permissoes: [] },
            { role_id: 6, role_nome: "FREELA_SUPER", permissoes: [] },
            { role_id: 7, role_nome: "FREELA_PADRAO", permissoes: [] }
        ];
        setMatriz(dadosMock);
        setCarregando(false);
    }, []);

    if (carregando) return <div className="text-gray-400 text-xs">Carregando matriz de segurança RBAC...</div>;

    return (
        <div className="w-full bg-black border-2 border-[#0066FF] rounded-3xl p-6 text-white font-sans shadow-xl">
            <h2 className="text-lg font-black uppercase text-[#0066FF] tracking-tight mb-2">🔑 Permissões Categorias • RBAC 7 Roles</h2>
            <p className="text-xs text-gray-500 mb-4">Gerencie as permissões e o nível de acesso para as categorias homologadas no ecossistema.</p>

            <div className="flex flex-col gap-3">
                {matriz.map((item) => (
                    <div key={item.role_id} className="p-4 bg-[#0A0A0A] border border-gray-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <span className="text-[10px] font-mono bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20 px-2 py-0.5 rounded font-black">ROLE_ID #{item.role_id}</span>
                            <h4 className="text-sm font-black text-white uppercase mt-1.5">{item.role_nome}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                            <span className="text-[9px] bg-neutral-800 text-gray-400 font-bold px-2 py-1 rounded">Visualizar Mural</span>
                            <span className="text-[9px] bg-neutral-800 text-gray-400 font-bold px-2 py-1 rounded">Disparar Chat</span>
                            {item.role_id === 1 && <span className="text-[9px] bg-[#0066FF] text-white font-bold px-2 py-1 rounded">Acesso Irrestrito</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
