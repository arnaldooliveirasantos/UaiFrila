import React, { useState, useEffect, useRef } from 'react';
import { apiFetch, apiGetPublic } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

// CadastroEndereco NO PADRAO DO SISTEMA:
// - Estilos: TUDO via useUaiFrilaStyles() (ThemeContext) — nenhuma cor/classe hardcoded.
//   Antes: border-2 border-black, bg-black text-white, bg-red-50, bg-green-50... fora do
//   design system, e sem respeitar o tema claro/escuro.
// - Estados: SOMENTE ativos (GET /estados/ativos).
// - Ao editar, Estado + Cidade se preenchem sozinhos. Causa raiz: /api/enderecos/meus
//   NAO devolve cidade_nome/estado_sigla (o toJSON do model so expoe as colunas),
//   entao o editar antigo procurava estado_sigla = undefined e nunca achava o estado.
//   Agora o estado e resolvido pela cidade (mapa de cidades ativas / GET /cidades/:id)
//   e a cidade editada entra nas opcoes mesmo que esteja inativa.

interface Props { onEnderecoSelecionado?: (id: number, endereco: any) => void; modoSelecao?: boolean; modoCadastro?: boolean; editarIdInicial?: number | null; onSalvo?: () => void; }

function temToken(): boolean {
  try { return !!(localStorage.getItem('uaifrila_token') || localStorage.getItem('@UaiFrila:token') || localStorage.getItem('token')); } catch { return false; }
}

const FORM_VAZIO = { logradouro: '', numero: '', bairro: '', cep: '', complemento: '', apelido: 'Casa', cidade_id: 0, tipo_endereco_id: 1 };

export default function CadastroEndereco({ onEnderecoSelecionado, modoSelecao = false, modoCadastro = false, editarIdInicial = null, onSalvo }: Props) {
  const styles = useUaiFrilaStyles();
  const [enderecos, setEnderecos] = useState<any[]>([]);
  const [estados, setEstados] = useState<any[]>([]);
  const [cidades, setCidades] = useState<any[]>([]);
  const [cidadesMap, setCidadesMap] = useState<Record<number, any>>({});
  const [tipos, setTipos] = useState<any[]>([]);
  const [estadoId, setEstadoId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ ...FORM_VAZIO });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const prevEditarIdRef = useRef<number | null>(editarIdInicial);
  const semToken = modoCadastro || !temToken();

  // Ref p/ o submit validar contra o mapa de cidades ativas.
  const cidadesMapRef = useRef(cidadesMap); cidadesMapRef.current = cidadesMap;

  useEffect(() => {
    // Estados: SOMENTE ativos.
    apiGetPublic('/estados/ativos').then((d: any) => {
      const lista = d.estados || d.data || [];
      setEstados(Array.isArray(lista) ? lista.filter((s: any) => s.ativo !== false) : []);
    }).catch(() => setEstados([]));
    apiGetPublic('/tipos-endereco').then((d: any) => setTipos(d.tipos || d.data || [])).catch(() => {});
    // Mapa de cidades ativas: nomes/siglas p/ exibir na lista + resolver o estado ao editar.
    apiGetPublic('/cidades').then((d: any) => {
      const lista = d.cidades || d.data || [];
      const mapa: Record<number, any> = {};
      (Array.isArray(lista) ? lista : []).forEach((c: any) => { mapa[Number(c.id)] = c; });
      setCidadesMap(mapa);
    }).catch(() => {});
    if (semToken) return;
    carregarEnderecos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semToken]);

  // Cidades do estado: SO ativas (backend filtra + filtro client-side).
  // Cidade inativa NUNCA entra nas opcoes — nem a do endereco sendo editado.
  useEffect(() => {
    if (!estadoId) { setCidades([]); return; }
    apiGetPublic(`/cidades/estado/${estadoId}`).then((d: any) => {
      const lista = d.cidades || d.data || [];
      const base = Array.isArray(lista) ? lista.filter((c: any) => c.ativa !== false && c.ativo !== false) : [];
      setCidades(base);
    }).catch(() => setCidades([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoId]);

  const carregarEnderecos = async () => {
    if (semToken) return; // cadastro: não busca
    try {
      const data = await apiFetch('/api/enderecos/meus');
      const lista = (data as any).enderecos || (data as any).data || [];
      // A API devolve camelCase (cidadeId, tipoEnderecoId) — normaliza p/ snake_case do form.
      const norm = (Array.isArray(lista) ? lista : []).map((e: any) => ({
        ...e,
        cidade_id: e.cidade_id ?? e.cidadeId,
        tipo_endereco_id: e.tipo_endereco_id ?? e.tipoEnderecoId,
      }));
      setEnderecos(norm);
    } catch (e: any) { setErro(e.message); }
  };

  // Preenche o form de edicao. Estado: CAMINHO UNICO — end.cidade.estadoId
  // (o /api/enderecos/meus devolve o cidade aninhado). Sem buscar cidade por
  // outro caminho, sem fallback.
  const iniciarEdicao = (end: any) => {
    setForm({ logradouro: end.logradouro || '', numero: end.numero || '', bairro: end.bairro || '', cep: end.cep || '', complemento: end.complemento || '', apelido: end.apelido || 'Casa', cidade_id: Number(end.cidade_id || 0), tipo_endereco_id: end.tipo_endereco_id ?? 1 });
    setEditandoId(Number(end.id));
    const eid = end?.cidade?.estadoId;
    setEstadoId(eid ? Number(eid) : null);
  };

  const cancelarEdicao = () => { setForm({ ...FORM_VAZIO }); setEditandoId(null); setEstadoId(null); };

  // Abre ja em edicao quando o pai pede (botao Editar do endereco ativo).
  // So reage quando a prop MUDA: carregar a lista nao pode apagar o que o
  // usuario esta digitando. Id -> null (botao Cadastrar) limpa o form.
  useEffect(() => {
    const prev = prevEditarIdRef.current;
    prevEditarIdRef.current = editarIdInicial;
    if (editarIdInicial == null) {
      if (prev != null) cancelarEdicao();
      return;
    }
    const end = enderecos.find((e: any) => Number(e.id) === Number(editarIdInicial));
    if (end && editandoId !== Number(end.id)) iniciarEdicao(end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editarIdInicial, enderecos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (semToken) { setErro('No cadastro o endereço vai junto com o usuário - não cadastre aqui. Preencha o endereço no formulário de cadastro.'); return; }
    if (!form.logradouro) { setErro('Logradouro obrigatório'); return; }
    if (!form.cidade_id) { setErro('Cidade obrigatória'); return; }
    // REGRA: so cidades ativas. Endereco antigo cuja cidade foi desativada
    // nao pode ser salvo com ela — o usuario escolhe uma cidade ativa.
    if (Object.keys(cidadesMapRef.current).length > 0 && !cidadesMapRef.current[Number(form.cidade_id)]) {
      setErro('A cidade atual deste endereço não está mais ativa. Escolha uma cidade ativa antes de salvar.');
      return;
    }
    setCarregando(true); setErro(null);
    try {
      const payload = { ...form }; delete (payload as any).estado_id;
      if (editandoId) await apiFetch(`/api/enderecos/${editandoId}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await apiFetch('/api/enderecos', { method: 'POST', body: JSON.stringify({ ...payload, ativo: enderecos.length === 0 }) });
      await carregarEnderecos();
      cancelarEdicao();
      onSalvo?.();
    } catch (e: any) { setErro(e.message); } finally { setCarregando(false); }
  };

  const ativar = async (end: any) => {
    await apiFetch(`/api/enderecos/${end.id}/ativo`, { method: 'PUT' });
    await carregarEnderecos();
    onSalvo?.();
    // Em modo selecao (Trocar, na tela de Publicar Vaga): ativar TAMBEM seleciona
    // o endereco para a vaga. Antes, Ativar so marcava no backend e a tela de
    // Publicar Vaga continuava com "Nenhum endereco ativo encontrado", mesmo
    // depois de trocar o endereco.
    if (modoSelecao) onEnderecoSelecionado?.(end.id, { ...end, ativo: true });
  };

  const cidadeDe = (end: any) => end.cidade || null;
  const tipoDe = (end: any) => tipos.find((t: any) => Number(t.id) === Number(end.tipo_endereco_id)) || null;

  if (semToken && modoCadastro) {
    // No cadastro este componente nem deve ser renderizado (BlocoEndereco já esconde),
    // mas se for, não chama nada e explica.
    return <div className={styles.cardSmall}><p className={styles.typography.body}>O endereço será cadastrado junto com o usuário ao finalizar o cadastro.</p></div>;
  }

  return (
    <div className="space-y-4">
      <h3 className={styles.typography.h3}>Endereços ({enderecos.length})</h3>
      {erro && <div className={styles.errorBox}>{erro}</div>}
      <div className="grid gap-2">
        {enderecos.map((end: any) => {
          const cid = cidadeDe(end);
          const tipo = tipoDe(end);
          return (
            <div key={end.id} className={styles.cardSmall}>
              <div className="flex justify-between gap-3">
                <div>
                  <div className="flex gap-2 flex-wrap items-center">
                    <span className={styles.typography.label}>{end.apelido || 'Endereço'}</span>
                    {tipo && <span className={styles.badge('default')}>{tipo.nome}</span>}
                    {end.ativo && <span className={styles.badge('success')}>ATIVO</span>}
                  </div>
                  <div className={`${styles.typography.body} mt-2 font-black`}>{[end.logradouro, end.numero].filter(Boolean).join(', ')}{end.bairro ? ` - ${end.bairro}` : ''}</div>
                  <div className={styles.typography.caption}>
                    {cid ? `${cid.nome} / ${cid.estado || ''}` : `Cidade ID ${end.cidade_id || ''}`}{end.cep ? ` • CEP: ${end.cep}` : ''}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!end.ativo && <button type="button" onClick={() => ativar(end)} className={styles.buttonSecondary}>{modoSelecao ? 'Ativar e usar nesta Vaga' : 'Ativar'}</button>}
                  {modoSelecao && <button type="button" onClick={() => onEnderecoSelecionado?.(end.id, end)} className={styles.buttonSecondary}>Usar nesta Vaga</button>}
                  <button type="button" onClick={() => iniciarEdicao(end)} className={styles.buttonSecondary}>Editar</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSubmit} className={styles.cardSmall + ' space-y-3'}>
        <h4 className={styles.typography.h3}>{editandoId ? 'Editar' : 'Novo'} endereço</h4>
        {editandoId && form.cidade_id && Object.keys(cidadesMap).length > 0 && !cidadesMap[Number(form.cidade_id)] && (
          <div className={styles.errorBox}>A cidade atual deste endereço não está mais ativa. Escolha uma cidade ativa abaixo antes de salvar.</div>
        )}
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className={styles.label}>Apelido</label><input value={form.apelido || ''} onChange={(e) => setForm({ ...form, apelido: e.target.value })} className={styles.input} placeholder="Casa, Trabalho" /></div>
          <div><label className={styles.label}>Tipo</label><select value={form.tipo_endereco_id || ''} onChange={(e) => setForm({ ...form, tipo_endereco_id: Number(e.target.value) })} className={styles.select}><option value="">Tipo</option>{tipos.map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>
          <div><label className={styles.label}>Estado *</label><select value={estadoId || ''} onChange={(e) => { const v = e.target.value ? Number(e.target.value) : null; setEstadoId(v); setForm({ ...form, cidade_id: 0 }); }} className={styles.select}><option value="">Estado</option>{estados.map((s: any) => <option key={s.id} value={s.id}>{s.sigla} - {s.nome}</option>)}</select></div>
          <div><label className={styles.label}>Cidade *</label><select value={form.cidade_id || ''} onChange={(e) => setForm({ ...form, cidade_id: Number(e.target.value) })} className={styles.select} required><option value="">Cidade</option>{cidades.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
          <div className="md:col-span-2"><label className={styles.label}>Logradouro *</label><input value={form.logradouro || ''} onChange={(e) => setForm({ ...form, logradouro: e.target.value })} className={styles.input} placeholder="Rua / Avenida" required /></div>
          <div><label className={styles.label}>Número</label><input value={form.numero || ''} onChange={(e) => setForm({ ...form, numero: e.target.value })} className={styles.input} placeholder="Número" /></div>
          <div><label className={styles.label}>Bairro</label><input value={form.bairro || ''} onChange={(e) => setForm({ ...form, bairro: e.target.value })} className={styles.input} placeholder="Bairro" /></div>
          <div><label className={styles.label}>CEP</label><input value={form.cep || ''} onChange={(e) => setForm({ ...form, cep: e.target.value })} className={styles.input} placeholder="CEP" /></div>
          <div><label className={styles.label}>Complemento</label><input value={form.complemento || ''} onChange={(e) => setForm({ ...form, complemento: e.target.value })} className={styles.input} placeholder="Complemento" /></div>
        </div>
        <button type="submit" disabled={carregando} className={styles.buttonPrimary(carregando)}>{carregando ? 'Salvando...' : editandoId ? 'Atualizar' : 'Cadastrar'}</button>
        {editandoId && <button type="button" onClick={cancelarEdicao} className={styles.buttonSecondary}>Cancelar edição</button>}
      </form>
    </div>
  );
}
