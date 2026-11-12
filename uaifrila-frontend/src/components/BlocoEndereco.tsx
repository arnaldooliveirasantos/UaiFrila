import React, { useState, useEffect } from 'react';
import { apiFetch, apiGetPublic } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import CadastroEndereco from './CadastroEndereco';

// BlocoEndereco CORRIGIDO para cadastro - NÃO chama rota com login quando não há token
// Causa do 401 no cadastro:
//   - BlocoEndereco chamava /api/enderecos/meus e /api/enderecos/ativo no useEffect SEMPRE,
//     mesmo em cadastro (token=NÃO, usuário ainda não existe)
//   - CadastroEndereco chamava /api/enderecos/meus e POST /api/enderecos sem token
//   - /api/cidades estava atrás de authMiddleware no backend
//
// Regra:
// - modoCadastro=true (CadastroUnificado modoEdicao=false): NÃO chama /enderecos/*, NÃO renderiza CadastroEndereco.
//   Só renderiza os inputs do endereço (CEP, logradouro, número, bairro, cidade) ligados ao form do cadastro.
//   O endereço vai junto no cadastro (INSERT no validar-codigo), não via POST /enderecos.
// - modoCadastro=false (logado / Meu Perfil / Vaga): chama /enderecos/meus SÓ se houver token.
// - /cidades, /estados, /tipos-endereco: SEMPRE via apiGetPublic (rotas públicas no backend).
// REGRA: SEM botão de tema aqui. Troca de tema só no Navbar.

interface Props {
  form?: any; setForm?: (f: any) => void; cidades?: any[];
  titulo?: string; subtitulo?: string;
  modoCadastro?: boolean; // true = cadastro novo, sem token
  modoVaga?: boolean;
  onEnderecoSelecionado?: (id: number, endereco: any) => void;
  onEnderecoChange?: (endereco: any) => void;
}

function temToken(): boolean {
  try {
    return !!(localStorage.getItem('uaifrila_token') || localStorage.getItem('@UaiFrila:token') || localStorage.getItem('token'));
  } catch { return false; }
}

export default function BlocoEndereco({ form, setForm, cidades: cidadesProp, titulo = 'ENDEREÇO', subtitulo, modoCadastro, modoVaga = false, onEnderecoSelecionado, onEnderecoChange }: Props) {
  const styles = useUaiFrilaStyles();
  const [ativo, setAtivo] = useState<any>(null);

  const [cidades, setCidades] = useState<any[]>(cidadesProp || []);
  const [estados, setEstados] = useState<any[]>([]);
  const [estadoId, setEstadoId] = useState<number | null>(null);

  // Botoes "Cadastrar endereco" / "Trocar endereco" — mesma regra no Perfil e na Vaga:
  // SO aparecem logado. No Perfil (modo formulario) o gate e modoCadastro === false
  // (CadastroUnificado passa modoCadastro={!modoEdicao}); na Vaga (modo leitura)
  // o gate e temToken(). No cadastro novo nao aparecem.
  const mostrarAcoesEndereco = modoCadastro === false && temToken();
  const [painel, setPainel] = useState<null | 'cadastrar' | 'trocar'>(null);
  const [painelVaga, setPainelVaga] = useState<null | 'cadastrar' | 'trocar'>(null);
  const [meusEnderecos, setMeusEnderecos] = useState<any[]>([]);
  const [carregandoEnderecos, setCarregandoEnderecos] = useState(false);
  const [erroEndereco, setErroEndereco] = useState('');
  const [msgEndereco, setMsgEndereco] = useState('');
  const [novo, setNovo] = useState<any>({ cep: '', logradouro: '', numero: '', bairro: '', complemento: '', apelido: 'Casa', cidade_id: '' });
  const [novoEstadoId, setNovoEstadoId] = useState<number | null>(null);
  const [novoCidades, setNovoCidades] = useState<any[]>([]);
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  const carregarMeusEnderecos = async () => {
    if (!temToken()) return;
    setCarregandoEnderecos(true);
    try {
      const data: any = await apiFetch('/api/enderecos/meus');
      const lista = data?.enderecos || data?.data || [];
      setMeusEnderecos(Array.isArray(lista) ? lista : []);
    } catch (e: any) { setErroEndereco(e.message || 'Nao foi possivel carregar seus enderecos'); }
    finally { setCarregandoEnderecos(false); }
  };
  useEffect(() => { if (painel && mostrarAcoesEndereco) carregarMeusEnderecos(); }, [painel]);
  useEffect(() => {
    if (!novoEstadoId) { setNovoCidades([]); return; }
    apiGetPublic(`/cidades/estado/${novoEstadoId}`).then((d: any) => setNovoCidades(d.cidades || d.data || [])).catch(() => setNovoCidades([]));
  }, [novoEstadoId]);
  const cadastrarNovoEndereco = async () => {
    if (!novo.logradouro?.trim()) { setErroEndereco('Logradouro obrigatorio'); return; }
    if (!novo.cidade_id) { setErroEndereco('Cidade obrigatoria'); return; }
    setSalvandoNovo(true); setErroEndereco(''); setMsgEndereco('');
    const eraPrimeiro = meusEnderecos.length === 0;
    try {
      await apiFetch('/api/enderecos', { method: 'POST', body: JSON.stringify({ ...novo, cidade_id: Number(novo.cidade_id), tipo_endereco_id: 1, ativo: false }) });
      setMsgEndereco('Endereco cadastrado!');
      setNovo({ cep: '', logradouro: '', numero: '', bairro: '', complemento: '', apelido: 'Casa', cidade_id: '' });
      setNovoEstadoId(null);
      await carregarMeusEnderecos();
      if (eraPrimeiro) {
        setForm({ ...form, cep: novo.cep, numero: novo.numero, endereco: novo.logradouro, bairro: novo.bairro, complemento: novo.complemento, cidade_id: Number(novo.cidade_id), estado_id: novoEstadoId });
        if (novoEstadoId) setEstadoId(novoEstadoId);
      }
      setPainel(null);
    } catch (e: any) { setErroEndereco(e.message || 'Nao foi possivel cadastrar o endereco'); }
    finally { setSalvandoNovo(false); }
  };
  const ativarEndereco = async (end: any) => {
    setErroEndereco(''); setMsgEndereco('');
    try {
      await apiFetch(`/api/enderecos/${end.id}/ativar`, { method: 'POST' });
      const cidadeId = Number(end.cidade_id ?? end.cidadeId);
      setForm({ ...form, cep: end.cep || '', numero: end.numero || '', endereco: end.logradouro || end.endereco || '', bairro: end.bairro || '', complemento: end.complemento || '', cidade_id: cidadeId, estado_id: null });
      setEstadoId(null);
      await carregarMeusEnderecos();
      setMsgEndereco(`Endereco "${end.apelido || end.logradouro}" ativado!`);
      setPainel(null);
    } catch (e: any) { setErroEndereco(e.message || 'Nao foi possivel ativar o endereco'); }
  };

  const ehCadastro = modoCadastro === true || (!!form && !!setForm && !temToken());

  useEffect(() => { if (cidadesProp) setCidades(cidadesProp); }, [cidadesProp]);

  // Só busca endereço ativo se NÃO é cadastro e TEM token
  useEffect(() => {
    if (ehCadastro) return; // cadastro: sem token, sem /enderecos/meus
    if (!temToken()) return;
    let cancelado = false;
    (async () => {
      try {
        let data: any = null;
        try { data = await apiFetch('/api/enderecos/meus'); }
        catch { data = await apiFetch('/api/enderecos/ativo'); }
        if (cancelado) return;
        let end: any = null;
        if (data?.data) end = Array.isArray(data.data) ? data.data[0] || null : data.data;
        else if (data?.endereco) end = data.endereco;
        else if (Array.isArray(data)) end = data[0] || null;
        else end = data;
        setAtivo(end);
        if (end) onEnderecoChange?.(end);
      } catch { /* sem endereço ativo - normal em perfil novo, não é erro */ }
    })();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ehCadastro]);

  // Estados / cidades por estado - SEMPRE público, nunca apiFetch com token
  useEffect(() => {
    if (!form || !setForm) return;
    apiGetPublic('/estados/ativos').then((d: any) => setEstados(d.estados || d.data || [])).catch(() => setEstados([]));
  }, [form, setForm]);

  useEffect(() => {
    if (!form || !setForm) return;
    if (!estadoId) return;
    apiGetPublic(`/cidades/estado/${estadoId}`).then((d: any) => setCidades(d.cidades || d.data || [])).catch(() => setCidades([]));
  }, [estadoId, form, setForm]);

  // Estado do endereco ativo: vem de form.estado_id (que o CadastroUnificado monta
  // a partir de end?.cidade?.estadoId). Fallback via /cidades/:id para telas que
  // passam o form sem estado. So roda com estadoId null: nao sobrescreve a escolha manual.
  useEffect(() => {
    if (!form || !setForm) return;
    if (estadoId) return;
    const idEstadoForm = Number(form.estado_id ?? form.estadoId ?? form.cidade?.estadoId ?? form.cidade?.estado_id);
    if (idEstadoForm) { setEstadoId(idEstadoForm); return; }
    const cidadeId = Number(form.cidade_id);
    if (!cidadeId) return;
    let cancelado = false;
    apiGetPublic(`/cidades/${cidadeId}`).then((d: any) => {
      if (cancelado) return;
      const cidade = d?.data || d?.cidade || d;
      const idEstado = Number(cidade?.estado_id ?? cidade?.estadoId);
      if (idEstado) setEstadoId(idEstado);
    }).catch(() => {});
    return () => { cancelado = true; };
  }, [form?.estado_id, form?.cidade_id, form?.cidade?.estadoId, estadoId, form, setForm]);

  // ===== MODO CADASTRO / FORM - inputs ligados ao form, sem chamar /enderecos =====
  if (form && setForm) {
    const buscarCep = async () => {
      const cepLimpo = String(form.cep || '').replace(/\D/g, '');
      if (cepLimpo.length !== 8) return;
      try {
        const r = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const d: any = await r.json();
        if (!d.erro) setForm({ ...form, endereco: d.logradouro || form.endereco, bairro: d.bairro || form.bairro });
      } catch {}
    };
    return (
      <div className="space-y-3">
        <h4 className={styles.typography.h3}>{titulo}</h4>
        {subtitulo && <p className={styles.typography.caption}>{subtitulo}</p>}
        {mostrarAcoesEndereco && (
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => { setPainel(painel === 'cadastrar' ? null : 'cadastrar'); setErroEndereco(''); setMsgEndereco(''); }} className={styles.buttonSecondary}>{painel === 'cadastrar' ? 'Fechar' : 'Cadastrar endereço'}</button>
            <button type="button" onClick={() => { setPainel(painel === 'trocar' ? null : 'trocar'); setErroEndereco(''); setMsgEndereco(''); }} className={styles.buttonSecondary}>{painel === 'trocar' ? 'Fechar' : 'Trocar endereço'}</button>
          </div>
        )}
        {msgEndereco && <p className="text-[12px] font-bold text-green-700">{msgEndereco}</p>}
        {erroEndereco && <p className="text-[12px] font-bold text-red-600">ERRO: {erroEndereco}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={styles.label}>CEP</label><input value={form.cep || ''} onChange={(e) => setForm({ ...form, cep: e.target.value })} onBlur={buscarCep} className={styles.input} placeholder="38400-000" /></div>
          <div><label className={styles.label}>Número</label><input value={form.numero || ''} onChange={(e) => setForm({ ...form, numero: e.target.value })} className={styles.input} placeholder="123" /></div>
          <div className="md:col-span-2"><label className={styles.label}>Endereço / Logradouro</label><input value={form.endereco || ''} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className={styles.input} placeholder="Rua / Avenida" /></div>
          <div><label className={styles.label}>Bairro</label><input value={form.bairro || ''} onChange={(e) => setForm({ ...form, bairro: e.target.value })} className={styles.input} placeholder="Centro" /></div>
          <div><label className={styles.label}>Complemento</label><input value={form.complemento || ''} onChange={(e) => setForm({ ...form, complemento: e.target.value })} className={styles.input} placeholder="Apto, bloco" /></div>
          <div>
            <label className={styles.label}>Estado</label>
            <select value={estadoId || ''} onChange={(e) => { const v = e.target.value ? Number(e.target.value) : null; setEstadoId(v); setForm({ ...form, cidade_id: '', estado_id: v }); }} className={styles.select}>
              <option value="">Selecione o estado</option>
              {estados.map((s: any) => <option key={s.id} value={s.id}>{s.sigla} - {s.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={styles.label}>Cidade</label>
            <select value={form.cidade_id || ''} onChange={(e) => setForm({ ...form, cidade_id: Number(e.target.value) })} className={styles.select}>
              <option value="">Selecione a cidade</option>
              {cidades.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </div>
        {mostrarAcoesEndereco && painel === 'trocar' && (
          <div className="md:col-span-2 border-2 border-black p-4 space-y-3 bg-white">
            <h5 className="font-black text-[12px] uppercase">Trocar endereço — escolha um para ativar ({meusEnderecos.length})</h5>
            {carregandoEnderecos && <p className="text-[12px]">Carregando seus endereços...</p>}
            {!carregandoEnderecos && meusEnderecos.length === 0 && <p className="text-[12px]">Você ainda não tem endereços cadastrados. Use "Cadastrar endereço" para criar o primeiro.</p>}
            <div className="grid gap-2">
              {meusEnderecos.map((end: any) => (
                <div key={end.id} className={`border-2 p-3 flex justify-between gap-2 ${end.ativo ? 'border-green-600 bg-green-50' : 'border-black bg-white'}`}>
                  <div>
                    <div className="flex gap-2 items-center"><span className="font-black text-[12px]">{end.apelido || 'Endereço'}</span>{end.ativo && <span className="bg-green-600 text-white text-[9px] px-1">ATIVO</span>}</div>
                    <div className="text-[12px]">{end.logradouro || end.endereco || ''} {end.numero || ''} {end.bairro ? `• ${end.bairro}` : ''}</div>
                    <div className="text-[10px]">{end.cep ? `CEP: ${end.cep}` : ''}</div>
                  </div>
                  {!end.ativo && <button type="button" onClick={() => ativarEndereco(end)} className="text-[10px] bg-green-600 text-white border-2 border-black px-2 py-1 font-black self-center">Ativar</button>}
                </div>
              ))}
            </div>
          </div>
        )}
        {mostrarAcoesEndereco && painel === 'cadastrar' && (
          <div className="md:col-span-2 border-2 border-black p-4 space-y-3 bg-white">
            <h5 className="font-black text-[12px] uppercase">Cadastrar endereço — novo endereço para você</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className={styles.label}>CEP</label><input value={novo.cep || ''} onChange={(e) => setNovo({ ...novo, cep: e.target.value })} onBlur={async () => { const c = String(novo.cep || '').replace(/\D/g, ''); if (c.length !== 8) return; try { const r = await fetch(`https://viacep.com.br/ws/${c}/json/`); const d: any = await r.json(); if (!d.erro) setNovo((n: any) => ({ ...n, logradouro: d.logradouro || n.logradouro, bairro: d.bairro || n.bairro })); } catch {} }} className={styles.input} placeholder="38400-000" /></div>
              <div><label className={styles.label}>Apelido</label><input value={novo.apelido || ''} onChange={(e) => setNovo({ ...novo, apelido: e.target.value })} className={styles.input} placeholder="Casa" /></div>
              <div className="md:col-span-2"><label className={styles.label}>Endereço / Logradouro</label><input value={novo.logradouro || ''} onChange={(e) => setNovo({ ...novo, logradouro: e.target.value })} className={styles.input} placeholder="Rua / Avenida" /></div>
              <div><label className={styles.label}>Número</label><input value={novo.numero || ''} onChange={(e) => setNovo({ ...novo, numero: e.target.value })} className={styles.input} placeholder="123" /></div>
              <div><label className={styles.label}>Bairro</label><input value={novo.bairro || ''} onChange={(e) => setNovo({ ...novo, bairro: e.target.value })} className={styles.input} placeholder="Centro" /></div>
              <div><label className={styles.label}>Complemento</label><input value={novo.complemento || ''} onChange={(e) => setNovo({ ...novo, complemento: e.target.value })} className={styles.input} placeholder="Apto, bloco" /></div>
              <div><label className={styles.label}>Estado</label><select value={novoEstadoId || ''} onChange={(e) => { const v = e.target.value ? Number(e.target.value) : null; setNovoEstadoId(v); setNovo((n: any) => ({ ...n, cidade_id: '' })); }} className={styles.select}><option value="">Selecione o estado</option>{estados.map((s: any) => <option key={s.id} value={s.id}>{s.sigla} - {s.nome}</option>)}</select></div>
              <div><label className={styles.label}>Cidade</label><select value={novo.cidade_id || ''} onChange={(e) => setNovo({ ...novo, cidade_id: e.target.value ? Number(e.target.value) : '' })} className={styles.select}><option value="">Selecione a cidade</option>{novoCidades.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={cadastrarNovoEndereco} disabled={salvandoNovo} className={styles.buttonPrimary(salvandoNovo)}>{salvandoNovo ? 'Salvando...' : 'Salvar endereço'}</button>
              <button type="button" onClick={() => setPainel(null)} className={styles.buttonSecondary}>Cancelar</button>
            </div>
          </div>
        )}
        {!ehCadastro && ativo && <p className={styles.typography.caption}>Endereço ativo atual: {ativo.endereco_completo || ativo.logradouro}</p>}
      </div>
    );
  }

  // ===== MODO LEITURA (Vaga / Perfil logado) - só com token =====
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className={styles.typography.h3}>Endereço {modoVaga ? 'da Vaga' : 'Ativo'} (Estado via Cidade)</h4>
        {temToken() && (
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => setPainelVaga(painelVaga === 'cadastrar' ? null : 'cadastrar')} className={styles.buttonSecondary}>{painelVaga === 'cadastrar' ? 'Fechar' : 'Cadastrar endereço'}</button>
            <button type="button" onClick={() => setPainelVaga(painelVaga === 'trocar' ? null : 'trocar')} className={styles.buttonSecondary}>{painelVaga === 'trocar' ? 'Fechar' : 'Trocar endereço'}</button>
          </div>
        )}
      </div>
      {ativo ? (
        <div className={styles.cardSmall}>
          <div className={styles.typography.label}>{ativo.apelido || ativo.tipo_nome || 'Ativo'}</div>
          <div className={`${styles.typography.body} mt-2 font-black`}>{ativo.endereco_completo || `${ativo.logradouro || ''} ${ativo.numero || ''} ${ativo.bairro || ''}`.trim()}</div>
          <div className={styles.typography.caption}>{ativo.cidade_nome || ''} / {ativo.estado_sigla || ''}{ativo.cep ? ` • CEP: ${ativo.cep}` : ''}</div>
        </div>
      ) : (
        <div className={`${styles.cardSmall} text-center`}><p className={styles.typography.body}>Nenhum endereço ativo</p><p className={styles.typography.caption}>Use "Cadastrar endereço" para criar um, ou "Trocar endereço" para escolher um.</p></div>
      )}
      {painelVaga && temToken() && (
        <div className={styles.card}><CadastroEndereco
          modoSelecao={modoVaga}
          modoPainel={painelVaga}
          onEnderecoSelecionado={(id: number, end: any) => { setAtivo(end); setPainelVaga(null); onEnderecoSelecionado?.(id, end); }}
          onEnderecoCriado={(end: any) => {
            // Na vaga, cadastrar ja seleciona o endereco novo para a vaga.
            // Fora da vaga, so reflete se o backend ativou (primeiro endereco).
            setPainelVaga(null);
            if (modoVaga && end?.id) { setAtivo(end); onEnderecoSelecionado?.(end.id, end); }
            else if (end?.ativo) { setAtivo(end); onEnderecoChange?.(end); }
          }}
        /></div>
      )}
    </div>
  );
}
