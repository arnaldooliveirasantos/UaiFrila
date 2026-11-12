import React, { useState, useEffect } from 'react';
import { apiFetch, apiGetPublic } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

// CadastroEndereco CORRIGIDO: NÃO chama /enderecos/meus nem POST /enderecos sem token
// Antes: useEffect chamava carregarEnderecos() SEMPRE -> 401 no cadastro (token=NÃO)
// Agora: sem token, não busca endereços e não permite POST - o endereço do cadastro vai junto no cadastro.
// Com token (Meu Perfil / Vaga): comportamento normal, busca /enderecos/meus + POST/PUT com token.

interface Props { onEnderecoSelecionado?: (id: number, endereco: any) => void; modoSelecao?: boolean; modoCadastro?: boolean; }

function temToken(): boolean {
  try { return !!(localStorage.getItem('uaifrila_token') || localStorage.getItem('@UaiFrila:token') || localStorage.getItem('token')); } catch { return false; }
}

export default function CadastroEndereco({ onEnderecoSelecionado, modoSelecao = false, modoCadastro = false }: Props) {
  const styles = useUaiFrilaStyles();
  const [enderecos, setEnderecos] = useState<any[]>([]);
  const [estados, setEstados] = useState<any[]>([]);
  const [cidades, setCidades] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [estadoId, setEstadoId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ logradouro: '', numero: '', bairro: '', cep: '', apelido: 'Casa', cidade_id: 0, tipo_endereco_id: 1 });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const semToken = modoCadastro || !temToken();

  useEffect(() => {
    // Listas públicas - SEMPRE via apiGetPublic, nunca com token
    apiGetPublic('/estados/ativos').then((d: any) => setEstados(d.estados || d.data || [])).catch(() => {});
    apiGetPublic('/tipos-endereco').then((d: any) => setTipos(d.tipos || d.data || [])).catch(() => {});
    // Endereços do usuário - SÓ com token, NUNCA no cadastro
    if (semToken) return;
    carregarEnderecos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semToken]);

  useEffect(() => {
    if (!estadoId) { setCidades([]); return; }
    apiGetPublic(`/cidades/estado/${estadoId}`).then((d: any) => setCidades(d.cidades || d.data || [])).catch(() => setCidades([]));
  }, [estadoId]);

  const carregarEnderecos = async () => {
    if (semToken) return; // cadastro: não busca
    try {
      const data = await apiFetch('/api/enderecos/meus');
      const lista = (data as any).enderecos || (data as any).data || [];
      setEnderecos(Array.isArray(lista) ? lista : []);
    } catch (e: any) { setErro(e.message); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (semToken) { setErro('No cadastro o endereço vai junto com o usuário - não cadastre aqui. Preencha o endereço no formulário de cadastro.'); return; }
    if (!form.logradouro) { setErro('Logradouro obrigatório'); return; }
    if (!form.cidade_id) { setErro('Cidade obrigatória'); return; }
    setCarregando(true); setErro(null);
    try {
      const payload = { ...form }; delete (payload as any).estado_id;
      if (editandoId) await apiFetch(`/api/enderecos/${editandoId}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await apiFetch('/api/enderecos', { method: 'POST', body: JSON.stringify({ ...payload, ativo: enderecos.length === 0 }) });
      await carregarEnderecos();
      setForm({ logradouro: '', numero: '', bairro: '', cep: '', apelido: 'Casa', cidade_id: 0, tipo_endereco_id: 1 });
      setEstadoId(null); setEditandoId(null);
    } catch (e: any) { setErro(e.message); } finally { setCarregando(false); }
  };

  if (semToken && modoCadastro) {
    // No cadastro este componente nem deve ser renderizado (BlocoEndereco já esconde),
    // mas se for, não chama nada e explica.
    return <div className={styles.cardSmall}><p className={styles.typography.body}>O endereço será cadastrado junto com o usuário ao finalizar o cadastro.</p></div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-black uppercase">Endereços ({enderecos.length}) - Estado via Cidade + Tipos</h3>
      {erro && <div className="bg-red-50 border-2 border-red-600 p-2 text-[12px] font-bold">ERRO: {erro}</div>}
      <div className="grid gap-2">
        {enderecos.map((end: any) => (
          <div key={end.id} className={`border-2 p-3 flex justify-between ${end.ativo ? 'border-green-600 bg-green-50' : 'border-black bg-white'}`}>
            <div>
              <div className="flex gap-2"><span className="font-black text-[12px]">{end.apelido}</span><span className="text-[9px] bg-zinc-200 px-1">{end.tipo_nome}</span>{end.ativo && <span className="bg-green-600 text-white text-[9px] px-1">ATIVO</span>}</div>
              <div className="text-[12px]">{end.endereco_completo}</div>
              <div className="text-[10px]">Cidade: {end.cidade_nome} | Estado: {end.estado_sigla} | Tipo: {end.tipo_chave}</div>
            </div>
            <div className="flex flex-col gap-1">
              {!end.ativo && <button type="button" onClick={async () => { await apiFetch(`/api/enderecos/${end.id}/ativar`, { method: 'POST' }); await carregarEnderecos(); }} className="text-[10px] bg-green-600 text-white border-2 border-black px-2 py-1 font-black">Ativar</button>}
              {modoSelecao && <button type="button" onClick={() => onEnderecoSelecionado?.(end.id, end)} className="text-[10px] bg-blue-600 text-white border-2 border-black px-2 py-1 font-black">Usar nesta Vaga</button>}
              <button type="button" onClick={() => { setForm(end); setEstadoId(end.estado_id || null); setEditandoId(end.id!); }} className="text-[10px] border-2 border-black px-2 py-1 font-black">Editar</button>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="border-2 border-black p-4 space-y-3 bg-white">
        <h4 className="font-black text-[12px] uppercase">{editandoId ? 'Editar' : 'Novo'} Endereço - Sem estado_id</h4>
        <div className="grid md:grid-cols-2 gap-3">
          <input value={form.apelido || ''} onChange={(e) => setForm({ ...form, apelido: e.target.value })} className="border-2 border-black p-2 text-[13px]" placeholder="Apelido" />
          <select value={form.tipo_endereco_id || ''} onChange={(e) => setForm({ ...form, tipo_endereco_id: Number(e.target.value) })} className="border-2 border-black p-2 text-[13px]"><option value="">Tipo</option>{tipos.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}</select>
          <select value={estadoId || ''} onChange={(e) => setEstadoId(Number(e.target.value))} className="border-2 border-black p-2 text-[13px]"><option value="">Estado (filtra)</option>{estados.map((s: any) => <option key={s.id} value={s.id}>{s.sigla} - {s.nome}</option>)}</select>
          <select value={form.cidade_id || ''} onChange={(e) => setForm({ ...form, cidade_id: Number(e.target.value) })} className="border-2 border-black p-2 text-[13px]" required><option value="">Cidade *</option>{cidades.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select>
          <input value={form.logradouro || ''} onChange={(e) => setForm({ ...form, logradouro: e.target.value })} className="md:col-span-2 border-2 border-black p-2 text-[13px]" placeholder="Logradouro *" required />
          <input value={form.numero || ''} onChange={(e) => setForm({ ...form, numero: e.target.value })} className="border-2 border-black p-2 text-[13px]" placeholder="Número" />
          <input value={form.bairro || ''} onChange={(e) => setForm({ ...form, bairro: e.target.value })} className="border-2 border-black p-2 text-[13px]" placeholder="Bairro" />
          <input value={form.cep || ''} onChange={(e) => setForm({ ...form, cep: e.target.value })} className="border-2 border-black p-2 text-[13px]" placeholder="CEP" />
          <input value={form.complemento || ''} onChange={(e) => setForm({ ...form, complemento: e.target.value })} className="border-2 border-black p-2 text-[13px]" placeholder="Complemento" />
        </div>
        <button type="submit" disabled={carregando} className="w-full bg-black text-white border-2 border-black p-2 font-black uppercase text-[12px]">{carregando ? 'Salvando...' : editandoId ? 'Atualizar' : 'Cadastrar'}</button>
      </form>
    </div>
  );
}
