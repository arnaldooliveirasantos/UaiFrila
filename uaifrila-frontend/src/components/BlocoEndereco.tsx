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
  const [mostrar, setMostrar] = useState(false);
  const [cidades, setCidades] = useState<any[]>(cidadesProp || []);
  const [estados, setEstados] = useState<any[]>([]);
  const [estadoId, setEstadoId] = useState<number | null>(null);

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
    apiGetPublic('/estados').then((d: any) => setEstados(d.estados || d.data || [])).catch(() => setEstados([]));
  }, [form, setForm]);

  useEffect(() => {
    if (!form || !setForm) return;
    if (!estadoId) return;
    apiGetPublic(`/cidades/estado/${estadoId}`).then((d: any) => setCidades(d.cidades || d.data || [])).catch(() => setCidades([]));
  }, [estadoId, form, setForm]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={styles.label}>CEP</label><input value={form.cep || ''} onChange={(e) => setForm({ ...form, cep: e.target.value })} onBlur={buscarCep} className={styles.input} placeholder="38400-000" /></div>
          <div><label className={styles.label}>Número</label><input value={form.numero || ''} onChange={(e) => setForm({ ...form, numero: e.target.value })} className={styles.input} placeholder="123" /></div>
          <div className="md:col-span-2"><label className={styles.label}>Endereço / Logradouro</label><input value={form.endereco || ''} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className={styles.input} placeholder="Rua / Avenida" /></div>
          <div><label className={styles.label}>Bairro</label><input value={form.bairro || ''} onChange={(e) => setForm({ ...form, bairro: e.target.value })} className={styles.input} placeholder="Centro" /></div>
          <div><label className={styles.label}>Complemento</label><input value={form.complemento || ''} onChange={(e) => setForm({ ...form, complemento: e.target.value })} className={styles.input} placeholder="Apto, bloco" /></div>
          <div>
            <label className={styles.label}>Estado</label>
            <select value={estadoId || ''} onChange={(e) => setEstadoId(e.target.value ? Number(e.target.value) : null)} className={styles.select}>
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
        {!ehCadastro && ativo && <p className={styles.typography.caption}>Endereço ativo atual: {ativo.endereco_completo || ativo.logradouro}</p>}
      </div>
    );
  }

  // ===== MODO LEITURA (Vaga / Perfil logado) - só com token =====
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className={styles.typography.h3}>Endereço {modoVaga ? 'da Vaga' : 'Ativo'} (Estado via Cidade)</h4>
        {temToken() && <button type="button" onClick={() => setMostrar(!mostrar)} className={styles.buttonSecondary}>{mostrar ? 'Fechar' : 'Trocar'}</button>}
      </div>
      {ativo ? (
        <div className={styles.cardSmall}>
          <div className={styles.typography.label}>{ativo.apelido || ativo.tipo_nome || 'Ativo'}</div>
          <div className={`${styles.typography.body} mt-2 font-black`}>{ativo.endereco_completo || `${ativo.logradouro || ''} ${ativo.numero || ''} ${ativo.bairro || ''}`.trim()}</div>
          <div className={styles.typography.caption}>{ativo.cidade_nome || ''} / {ativo.estado_sigla || ''}{ativo.cep ? ` • CEP: ${ativo.cep}` : ''}</div>
        </div>
      ) : (
        <div className={`${styles.cardSmall} text-center`}><p className={styles.typography.body}>Nenhum endereço ativo</p><p className={styles.typography.caption}>Cadastre um endereço em Perfil ou selecione abaixo</p></div>
      )}
      {mostrar && temToken() && (
        <div className={styles.card}><CadastroEndereco modoSelecao={modoVaga} onEnderecoSelecionado={(id: number, end: any) => { setAtivo(end); setMostrar(false); onEnderecoSelecionado?.(id, end); }} /></div>
      )}
    </div>
  );
}
