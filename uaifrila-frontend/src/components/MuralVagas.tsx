import { useEffect, useState } from 'react';
import { apiGetPublic } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

export default function MuralVagas() {
  const styles = useUaiFrilaStyles();
  const [vagas, setVagas] = useState<any[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const carregar = async () => {
      try {
        setLoading(true);
        setErro(null);
        // FIX: endpoint correto é /api/vagas/abertas, não /api/vagas/mural
        const data = await apiGetPublic('/api/vagas/abertas');
        const lista = data.vagas || data.data || data || [];
        // Garante que é array
        if (mounted) setVagas(Array.isArray(lista) ? lista : []);
      } catch (e: any) {
        if (mounted) {
          console.error('[MuralVagas] Erro:', e);
          setErro(e.message);
          setVagas([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    carregar();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="p-8 text-center">Carregando mural de vagas...</div>;
  
  if (erro) {
    return (
      <div className="p-4 m-4 border-4 border-red-600 bg-red-50">
        <p className="font-black">ERRO no mural:</p>
        <p className="text-xs mt-2">{erro}</p>
        <p className="text-[10px] mt-2 opacity-60">Verifique se o backend está rodando e se a rota /api/vagas/abertas existe no App.ts</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h2 className="font-black text-2xl uppercase mb-6">Mural de Vagas ({vagas.length})</h2>
      
      {vagas.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-black">
          <p className="font-bold">Nenhuma vaga no momento</p>
          <p className="text-xs mt-2 opacity-60">Seja o primeiro a publicar uma vaga!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {vagas.map((vaga: any) => (
            <div key={vaga.id} className="border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
              <h3 className="font-black uppercase text-sm">{vaga.titulo || 'Vaga sem título'}</h3>
              <p className="text-xs mt-2 line-clamp-3">{vaga.descricao || 'Sem descrição'}</p>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs font-bold">
                  R$ {vaga.valor_servico || vaga.valor_total || '0'} 
                  {vaga.cidade_nome ? ` - ${vaga.cidade_nome}` : ''}
                </span>
                <span className={`text-[10px] px-2 py-1 border-2 border-black font-black ${vaga.status === 'ABERTA' ? 'bg-green-400' : 'bg-yellow-300'}`}>
                  {vaga.status || 'ABERTA'}
                </span>
              </div>
              <div className="mt-2 text-[10px] opacity-50">
                {vaga.data_inicio ? new Date(vaga.data_inicio).toLocaleString('pt-BR') : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
