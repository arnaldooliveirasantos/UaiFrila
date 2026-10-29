import React, { useEffect, useState } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

const API = (import.meta as any).env?.VITE_API_URL || 'http://192.168.24.11:3000/api';

export default function PainelMeusTrampos(props: any) {
  const styles = useUaiFrilaStyles();
  const [vagas, setVagas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = async () => {
    setLoading(true);
    setErro('');
    try {
      const token = localStorage.getItem('uaifrila_token');
      let res = await fetch(`${API}/vagas/minhas`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) {
        res = await fetch(`${API}/vagas/minhas-publicadas`, { headers: { 'Authorization': `Bearer ${token}` } });
      }
      if (!res.ok) {
        res = await fetch(`${API}/vagas/contratante`, { headers: { 'Authorization': `Bearer ${token}` } });
      }
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.erro || `Erro ${res.status}`);
      }
      
      const lista = data.vagas || data || [];
      setVagas(Array.isArray(lista) ? lista : []);
    } catch (e: any) {
      setErro(e.message || 'Erro ao carregar vagas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const formatarData = (utc: string) => {
    if (!utc) return '';
    try { return new Date(utc).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return utc; }
  };

  const editar = (vaga: any) => {
    localStorage.setItem('uaifrila_vaga_editar', JSON.stringify(vaga));
    if (props.setTelaAtiva) props.setTelaAtiva('criar-vaga');
  };

  const cancelar = async (id: number) => {
    if (!confirm('Cancelar vaga?')) return;
    try {
      const token = localStorage.getItem('uaifrila_token');
      const res = await fetch(`${API}/vagas/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { alert('Vaga cancelada'); carregar(); }
      else { const data = await res.json(); alert(data.erro || 'Erro'); }
    } catch (e: any) { alert('Erro: ' + e.message); }
  };

  const getStatusBadge = (vaga: any) => {
    const now = new Date();
    const fim = vaga.data_fim ? new Date(vaga.data_fim) : null;
    if (fim && fim < now) return <span className={styles.badge('danger')}>Finalizada</span>;
    if (vaga.status === 'cancelada') return <span className={styles.badge('danger')}>Cancelada</span>;
    if (vaga.status === 'preenchida' || vaga.status === 'concluida') return <span className={styles.badge('success')}>{vaga.status}</span>;
    return <span className={styles.badge('success')}>Ativa</span>;
  };

  if (loading) return <div className={styles.pageContainer + ' font-black'}>Carregando minhas vagas...</div>;

  return (
    <div className={styles.pageContainer}>
      <h1 className={`${styles.typography.h1} mb-6`}>Meus Trampos Publicados</h1>

      {erro && <div className={`${styles.errorBox} mb-4`}>{erro}</div>}

      {vagas.length === 0 && !erro && (
        <div className={styles.card}>
          <p className={`${styles.typography.body} font-bold`}>Nenhuma vaga publicada. Crie uma em Nova Vaga.</p>
          <div className="mt-4">
            <button className={styles.buttonPrimary()} onClick={() => props.setTelaAtiva && props.setTelaAtiva('criar-vaga')}>
              Criar Nova Vaga
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {vagas.map((v: any) => (
          <div key={v.id} className={styles.cardSmall}>
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-black uppercase">{v.titulo}</h3>
                  {getStatusBadge(v)}
                </div>
                <p className={`${styles.typography.bodySmall} opacity-70`}>
                  R$ {Number(v.valor_hora).toFixed(2).replace('.', ',')}/h • {v.funcao} | {formatarData(v.data_inicio)} → {formatarData(v.data_fim)}
                </p>
                <p className={`${styles.typography.bodySmall} mt-1`}>
                  📍 {v.endereco_completo || v.cidade_nome || 'Sem endereço'} {v.bairro || v.endereco_bairro ? `- ${v.bairro || v.endereco_bairro}` : ''}
                </p>
                {v.descricao && (
                  <p className={`${styles.typography.bodySmall} mt-2 opacity-70 line-clamp-2`}>{v.descricao}</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 ml-4 shrink-0">
                <button onClick={() => editar(v)} className={styles.buttonWarning}>Editar</button>
                <button onClick={() => cancelar(v.id)} className={styles.buttonDanger}>Cancelar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {vagas.length > 0 && (
        <div className="mt-6">
          <button className={styles.buttonSecondary} onClick={carregar}>Atualizar Lista</button>
        </div>
      )}
    </div>
  );
}
