import React, { useEffect, useState } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import { apiFetch } from '../utils/Api';

export default function PainelPermissoesCategorias() {
  const styles = useUaiFrilaStyles();
  const [matriz, setMatriz] = useState<any[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const carregar = async () => {
      try {
        const data = await apiFetch('/api/permissoes/matriz');
        // FIX: Backend retorna {success, data: {message}} ou array direto
        // Garante que matriz sempre é array
        let lista: any[] = [];
        if (Array.isArray(data)) lista = data;
        else if (Array.isArray(data.data)) lista = data.data;
        else if (Array.isArray(data.matriz)) lista = data.matriz;
        else if (data?.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
          // Se vier objeto, transforma em array vazio ou mock
          console.warn('[Permissoes] API retornou objeto, não array:', data.data);
          lista = [];
        }
        
        if (mounted) setMatriz(lista);
      } catch (e: any) {
        if (mounted) setErro(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    carregar();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className={styles.pageContainer}>Carregando permissões...</div>;
  if (erro) return <div className="p-4 border-2 border-red-600 bg-red-50">Erro: {erro}</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <h2 className={styles.typography.h1}>Permissões - RBAC ({matriz.length})</h2>
        {matriz.length === 0 ? (
          <div className="mt-6 p-4 border-2 border-dashed border-black text-center text-[12px]">
            Nenhuma matriz configurada. Isso é normal - endpoint retorna placeholder.
            <br/>
            <small>Verifique se você é ADMIN/SUPER_ADMIN. Seu usuário atual: Uai Frila (SUPER_ADMIN) deve ter acesso.</small>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {matriz.map((item: any) => (
              <div key={item.role_id || item.id} className="p-4 border-2 border-black">
                <span className="text-[10px] font-mono bg-black text-white px-2 py-1">ROLE {item.role_id || item.id}</span>
                <p className="font-black uppercase mt-2">{item.role_nome || item.nome || item.chave}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {(item.permissoes || []).map((p: any) => (
                    <span key={p.id || p.chave} className="text-[9px] border-2 border-black px-2 py-1">{p.nome || p.chave}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
