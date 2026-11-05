import React, { useState, useEffect } from 'react';
import { apiFetch, getApiUrl } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

interface Endereco {
  id?: number; cep?: string; logradouro: string; numero?: string; complemento?: string; bairro?: string;
  cidade_id: number; cidade_nome?: string; estado_id?: number; estado_sigla?: string; estado_nome?: string;
  tipo_endereco_id?: number; tipo_chave?: string; tipo_nome?: string; apelido?: string; ativo?: boolean; endereco_completo?: string;
}
interface TipoEndereco { id: number; chave: string; nome: string; }

interface Props { onEnderecoSelecionado?: (id: number, endereco: Endereco) => void; modoSelecao?: boolean; }

export default function CadastroEndereco({ onEnderecoSelecionado, modoSelecao = false }: Props) {
  const styles = useUaiFrilaStyles();
  const [enderecos, setEnderecos] = useState<Endereco[]>([]);
  const [estados, setEstados] = useState<any[]>([]);
  const [cidades, setCidades] = useState<any[]>([]);
  const [tipos, setTipos] = useState<TipoEndereco[]>([]);
  const [estadoId, setEstadoId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ logradouro: '', numero: '', bairro: '', cep: '', apelido: 'Casa', cidade_id: 0, tipo_endereco_id: 1 });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  useEffect(() => { carregarEnderecos(); carregarEstados(); carregarTipos(); }, []);
  
  useEffect(() => { 
    if (estadoId) { 
      // FIX: usa apiFetch que já corrige /api/api
      apiFetch(`/api/cidades/estado/${estadoId}`)
        .then((d: any) => setCidades(d.cidades || d.data || []))
        .catch(() => setCidades([])); 
    } else {
      setCidades([]);
    }
  }, [estadoId]);

  const carregarEnderecos = async () => { 
    try { 
      const data = await apiFetch('/api/enderecos/meus'); 
      const lista = data.enderecos || data.data || data || [];
      setEnderecos(Array.isArray(lista) ? lista : []); 
    } catch (e: any) { 
      console.warn('[CadastroEndereco] enderecos:', e.message);
      setEnderecos([]);
    } 
  };
  
  const carregarEstados = async () => { 
    try { 
      const data = await apiFetch('/api/estados'); 
      setEstados(data.estados || data.data || []); 
    } catch {} 
  };
  
  const carregarTipos = async () => { 
    try { 
      const data = await apiFetch('/api/tipos-endereco'); 
      const lista = data.tipos || data.data || [{id:1,chave:'CASA',nome:'Casa'},{id:2,chave:'TRABALHO',nome:'Trabalho'}];
      setTipos(Array.isArray(lista) ? lista : []); 
    } catch {
      setTipos([{id:1,chave:'CASA',nome:'Casa'},{id:2,chave:'TRABALHO',nome:'Trabalho'}]);
    } 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setCarregando(true); setErro(null);
    try {
      if (!form.logradouro) throw new Error('Logradouro obrigatório');
      if (!form.cidade_id) throw new Error('Cidade obrigatória');
      const payload = { ...form }; delete (payload as any).estado_id;
      if (editandoId) await apiFetch(`/api/enderecos/${editandoId}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await apiFetch('/api/enderecos', { method: 'POST', body: JSON.stringify({ ...payload, ativo: enderecos.length === 0 }) });
      await carregarEnderecos();
      setForm({ logradouro: '', numero: '', bairro: '', cep: '', apelido: 'Casa', cidade_id: 0, tipo_endereco_id: 1 });
      setEstadoId(null); setEditandoId(null);
    } catch (e: any) { setErro(e.message); }
    finally { setCarregando(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className={styles.typography.h3}>Endereços ({enderecos.length}) - Estado via Cidade</h3>
        <span className={styles.badge('default')}>{modoSelecao ? 'Seleção' : 'Cadastro'}</span>
      </div>
      
      {erro && <div className={styles.errorBox}>ERRO: {erro}</div>}
      
      <div className="grid gap-2">
        {enderecos.map(end => (
          <div key={end.id} className={`${styles.cardSmall} flex justify-between ${end.ativo ? 'border-green-600' : ''} ${end.ativo ? (styles.isDark ? 'bg-green-900/20' : 'bg-green-50') : ''}`}>
            <div>
              <div className="flex gap-2 items-center">
                <span className={styles.typography.h3}>{end.apelido}</span>
                <span className="text-[9px] bg-zinc-200 px-1 text-black">{end.tipo_nome}</span>
                {end.ativo && <span className="bg-green-600 text-white text-[9px] px-1">ATIVO</span>}
              </div>
              <div className={styles.typography.bodySmall}>{end.endereco_completo || `${end.logradouro} ${end.numero || ''} ${end.bairro || ''}`}</div>
              <div className={styles.typography.caption}>Cidade: {end.cidade_nome} | Estado: {end.estado_sigla} | Tipo: {end.tipo_chave}</div>
            </div>
            <div className="flex flex-col gap-1">
              {!end.ativo && <button onClick={async()=>{ await apiFetch(`/api/enderecos/${end.id}/ativar`,{method:'POST'}); await carregarEnderecos(); }} className={styles.buttonSecondary}>Ativar</button>}
              {modoSelecao && <button onClick={()=>onEnderecoSelecionado?.(end.id!, end)} className="text-[10px] bg-blue-600 text-white border-2 border-black px-2 py-1 font-black">Usar</button>}
              <button onClick={()=>{ setForm(end); setEstadoId(end.estado_id||null); setEditandoId(end.id!); }} className={styles.buttonSecondary}>Editar</button>
            </div>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} className={styles.card}>
        <h4 className={styles.typography.h3}>{editandoId?'Editar':'Novo'} Endereço</h4>
        <div className={`${styles.grid2Cols} mt-4`}>
          <div>
            <label className={styles.label}>Apelido</label>
            <input value={form.apelido||''} onChange={e=>setForm({...form, apelido:e.target.value})} className={styles.input} placeholder="Casa" />
          </div>
          <div>
            <label className={styles.label}>Tipo</label>
            <select value={form.tipo_endereco_id||''} onChange={e=>setForm({...form, tipo_endereco_id:Number(e.target.value)})} className={styles.select}>
              <option value="">Tipo</option>{tipos.map(t=><option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label}>Estado (filtro)</label>
            <select value={estadoId||''} onChange={e=>setEstadoId(Number(e.target.value)||null)} className={styles.select}>
              <option value="">Estado</option>{estados.map((s:any)=><option key={s.id} value={s.id}>{s.sigla} - {s.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label}>Cidade *</label>
            <select value={form.cidade_id||''} onChange={e=>setForm({...form, cidade_id:Number(e.target.value)})} className={styles.select} required>
              <option value="">Cidade *</option>{cidades.map((c:any)=><option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label}>Logradouro *</label>
            <input value={form.logradouro||''} onChange={e=>setForm({...form, logradouro:e.target.value})} className={styles.input} placeholder="Rua..." required />
          </div>
          <div>
            <label className={styles.label}>Número</label>
            <input value={form.numero||''} onChange={e=>setForm({...form, numero:e.target.value})} className={styles.input} placeholder="123" />
          </div>
          <div>
            <label className={styles.label}>Bairro</label>
            <input value={form.bairro||''} onChange={e=>setForm({...form, bairro:e.target.value})} className={styles.input} placeholder="Centro" />
          </div>
          <div>
            <label className={styles.label}>CEP</label>
            <input value={form.cep||''} onChange={e=>setForm({...form, cep:e.target.value})} className={styles.input} placeholder="38400-000" />
          </div>
        </div>
        <div className="mt-4">
          <button type="submit" disabled={carregando} className={styles.buttonPrimary(carregando)}>{carregando ? 'Salvando...' : editandoId ? 'Atualizar' : 'Cadastrar'}</button>
        </div>
      </form>
    </div>
  );
}
