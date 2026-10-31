
import React, { useState, useEffect } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

interface Props {
  form: any;
  setForm: (fn: any) => void;
  cidades: any[];
  titulo?: string;
  subtitulo?: string;
  buscandoCep?: boolean;
  setBuscandoCep?: (b: boolean) => void;
}

export default function BlocoEndereco({ form, setForm, cidades, titulo = 'SEU ENDEREÇO', subtitulo = 'Preencha o CEP para autocompletar', buscandoCep, setBuscandoCep }: Props) {
  const styles = useUaiFrilaStyles();
  const [buscandoInterno, setBuscandoInterno] = useState(false);
  const [erroCep, setErroCep] = useState('');
  const [estados, setEstados] = useState<any[]>([]);
  const [cidadesDoEstado, setCidadesDoEstado] = useState<any[]>([]);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const isBuscando = buscandoCep ?? buscandoInterno;
  const setBuscando = setBuscandoCep ?? setBuscandoInterno;
  const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

  // CARREGA SÓ ESTADOS ATIVOS - SELECT
  useEffect(() => {
    fetch(`${API}/estados`).then(r=>r.json()).then(data=>{
      const lista = data.estados || [];
      const ativos = lista.filter((e:any) => e.ativo === true || e.ativo === 1);
      console.log('[BlocoEndereco] ESTADOS ATIVOS (SELECT):', ativos);
      if (ativos.length > 0) setEstados(ativos);
      else setEstados(lista.filter((e:any)=> e.sigla === 'MG'));
    }).catch(()=> setEstados([{ id: 31, nome: 'Minas Gerais', sigla: 'MG', ativo: true }]));
  }, []);

  // QUANDO ESTADO MUDA, CARREGA SÓ CIDADES ATIVAS DAQUELE ESTADO ATIVO
  useEffect(() => {
    const estadoId = form.estado_id;
    const sigla = form.estado || form.uf;
    if (!estadoId && !sigla) { setCidadesDoEstado([]); return; }
    setCarregandoCidades(true);
    const url = estadoId ? `${API}/cidades?estado_id=${estadoId}` : `${API}/cidades?uf=${sigla}`;
    fetch(url).then(r=>r.json()).then(data=>{
      const lista = data.cidades || [];
      const ativas = lista.filter((c:any)=> c.ativa !== false && c.ativa !== 0);
      console.log(`[BlocoEndereco] CIDADES ATIVAS do estado ${sigla || estadoId}:`, ativas.length);
      setCidadesDoEstado(ativas);
    }).catch(()=>{
      const ativas = cidades.filter((c:any)=>{
        if (c.ativa === false || c.ativa === 0) return false;
        if (estadoId && c.estado_id) return Number(c.estado_id) === Number(estadoId);
        if (sigla) return (c.estado || c.estado_sigla || '').toUpperCase() === String(sigla).toUpperCase();
        return true;
      });
      setCidadesDoEstado(ativas);
    }).finally(()=>setCarregandoCidades(false));
  }, [form.estado_id, form.estado, form.uf, cidades]);

  const cidadesParaSelect = cidadesDoEstado.length > 0 ? cidadesDoEstado : cidades.filter((c:any)=> c.ativa !== false);

  const buscarCep = async (cepRaw: string) => {
    const cep = cepRaw.replace(/\D/g,'');
    if (cep.length !== 8) { setErroCep('CEP deve ter 8 dígitos'); return; }
    setBuscando(true); setErroCep('');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) { setErroCep('CEP não encontrado'); throw new Error('CEP não encontrado'); }
      const localidade = (data.localidade||'').toLowerCase().trim();
      const uf = (data.uf||'').toUpperCase().trim();
      let estadoEncontrado = estados.find((e:any)=> e.sigla.toUpperCase()===uf && (e.ativo===true||e.ativo===1));
      if (!estadoEncontrado) {
        setErroCep(`CEP cidade não ativa - Estado ${uf} não está ativo. Só MG ativo.`);
        throw new Error('CEP cidade não ativa');
      }
      let cidadesDoEstadoAtivo: any[] = [];
      try {
        const r = await fetch(`${API}/cidades?estado_id=${estadoEncontrado.id}`).then(x=>x.json());
        cidadesDoEstadoAtivo = r.cidades || [];
      } catch { cidadesDoEstadoAtivo = cidades; }
      let cidadeEncontrada = cidadesDoEstadoAtivo.find((c:any)=> (c.nome||'').toLowerCase().trim()===localidade && c.ativa!==false);
      if (!cidadeEncontrada) {
        setErroCep(`CEP cidade não ativa - ${data.localidade}/${uf} não está ativa`);
        throw new Error('CEP cidade não ativa');
      }
      setForm((f:any)=>({
        ...f,
        cep: data.cep || cepRaw,
        endereco: data.logradouro || f.endereco || '',
        endereco_completo: data.logradouro || f.endereco_completo || '',
        bairro: data.bairro || f.bairro || '',
        cidade_id: Number(cidadeEncontrada.id),
        cidade: cidadeEncontrada.nome,
        cidade_nome: cidadeEncontrada.nome,
        estado: estadoEncontrado.sigla,
        uf: estadoEncontrado.sigla,
        estado_id: Number(estadoEncontrado.id),
        complemento: data.complemento || f.complemento || '',
      }));
      setErroCep('');
    } catch (e:any) {
      if (!erroCep) setErroCep(e.message);
    } finally { setBuscando(false); }
  };

  const hasValue = (v:any)=> v!=null && String(v).trim()!=='';

  return (
    <div className={styles.cardSmall} style={{ borderWidth: '2px' }}>
      <h3 className={styles.typography.h3 + ' mb-1'} style={{ fontSize: '14px', fontWeight: 900 }}>📍 {titulo}</h3>
      {subtitulo && <p className={styles.typography.caption + ' mb-3'}>{subtitulo}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
        <div>
          <label className={styles.label}>CEP * {hasValue(form.cep) && '✅'}</label>
          <input value={form.cep||''} onChange={e=>{ setForm((f:any)=>({ ...f, cep: e.target.value })); setErroCep(''); }} onBlur={e=>{ if (form.cep) buscarCep(form.cep); }} placeholder="38400-000" className={styles.input} />
          {erroCep && <p className="text-[11px] text-red-600 font-bold mt-1">❌ {erroCep}</p>}
        </div>
        <div className="flex items-end">
          <button type="button" onClick={()=>buscarCep(form.cep||'')} disabled={isBuscando} className={isBuscando ? styles.buttonPrimary(true) : styles.buttonWarning} style={{ height: '48px' }}>{isBuscando ? 'Buscando...' : 'BUSCAR CEP'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3 mt-3">
        <div>
          <label className={styles.label}>RUA / AVENIDA * {hasValue(form.endereco) && '✅'}</label>
          <input value={form.endereco || form.enderecoCompleto || ''} onChange={e=>{ const v=e.target.value; setForm((f:any)=>({ ...f, endereco: v, endereco_completo: v, enderecoCompleto: v })); }} placeholder="Av. Floriano Peixoto" className={styles.input} />
        </div>
        <div>
          <label className={styles.label}>NÚMERO * {hasValue(form.numero) && '✅'}</label>
          <input value={form.numero||''} onChange={e=>setForm((f:any)=>({ ...f, numero: e.target.value }))} placeholder="1000" className={styles.input} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <div>
          <label className={styles.label}>BAIRRO * {hasValue(form.bairro) && '✅'}</label>
          <input value={form.bairro||''} onChange={e=>setForm((f:any)=>({ ...f, bairro: e.target.value }))} placeholder="Centro" className={styles.input} />
        </div>
        <div>
          <label className={styles.label}>COMPLEMENTO {hasValue(form.complemento) && '✅'}</label>
          <input value={form.complemento||''} onChange={e=>setForm((f:any)=>({ ...f, complemento: e.target.value }))} placeholder="Bloco A, Sala 2" className={styles.input} />
        </div>
      </div>

      {/* ESTADO É SELECT - SÓ ATIVOS - CIDADE DEPENDE DO ESTADO ATIVO - POSIÇÃO INVERTIDA */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-3 mt-3">
        <div>
          <label className={styles.label}>ESTADO * {hasValue(form.estado) && '✅'} - SELECT só ativos</label>
          <select 
            value={form.estado_id || ''} 
            onChange={e=>{
              const estadoId = Number(e.target.value);
              const estado = estados.find((es:any)=> Number(es.id)===estadoId);
              setForm((f:any)=>({ ...f, estado_id: estadoId, estado: estado?.sigla || 'MG', uf: estado?.sigla || 'MG', cidade_id: '', cidade: '', cidade_nome: '' }));
              setCidadesDoEstado([]);
            }} 
            className={styles.select}
          >
            <option value="">Selecione o estado</option>
            {estados.map((es:any)=>(
              <option key={es.id} value={Number(es.id)}>{es.sigla} - {es.nome}</option>
            ))}
          </select>
          <p className="text-[10px] text-green-600 mt-1">✅ {estados.length} ativo(s): {estados.map((e:any)=>e.sigla).join(', ')}</p>
        </div>
        <div>
          <label className={styles.label}>CIDADE * {hasValue(form.cidade_id) && '✅'} - Só do estado ativo</label>
          <select 
            value={Number(form.cidade_id) || ''} 
            onChange={e=>{
              const cidadeId = Number(e.target.value);
              const cidade = cidadesParaSelect.find((c:any)=> Number(c.id)===cidadeId);
              setForm((f:any)=>({ ...f, cidade_id: cidadeId, cidade: cidade?.nome || '', cidade_nome: cidade?.nome || '' }));
            }} 
            className={styles.select}
            disabled={!form.estado_id && !form.estado}
          >
            <option value="">{!form.estado_id && !form.estado ? 'Selecione o estado primeiro' : carregandoCidades ? 'Carregando...' : `Selecione (${cidadesParaSelect.length} ativas)`}</option>
            {cidadesParaSelect.map((c:any)=>(
              <option key={c.id} value={Number(c.id)}>{c.nome}</option>
            ))}
          </select>
          <p className="text-[10px] opacity-70 mt-1">{form.estado ? `${cidadesParaSelect.length} ativas em ${form.estado}` : 'Selecione o estado ativo'}</p>
        </div>
      </div>
    </div>
  );
}
