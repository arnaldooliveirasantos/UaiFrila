import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import ValidacaoCodigo from './ValidacaoCodigo';
import GoogleEnderecoInput from './GoogleEnderecoInput';

interface Props {
  onCadastro?: () => void;
  usuario?: any;
  modoEdicao?: boolean;
  onAtualizado?: (usuario: any) => void;
}

function apenasNumeros(str: string) {
  return (str || '').replace(/\D/g, '');
}
function mascararCPF(cpf: string) {
  const nums = apenasNumeros(cpf);
  if (nums.length < 11) return '***.***.***-**';
  return `${nums.slice(0,3)}.***.***-${nums.slice(9,11)}`;
}
function mascararCNPJ(cnpj: string) {
  const nums = apenasNumeros(cnpj);
  if (nums.length < 14) return '**.***.***/****-**';
  return `${nums.slice(0,2)}.***.***/****-${nums.slice(12,14)}`;
}
function formatarCPF(valor: string) {
  const nums = apenasNumeros(valor).slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0,3)}.${nums.slice(3)}`;
  if (nums.length <= 9) return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6)}`;
  return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6,9)}-${nums.slice(9)}`;
}
function formatarCNPJ(valor: string) {
  const nums = apenasNumeros(valor).slice(0, 14);
  if (nums.length <= 2) return nums;
  if (nums.length <= 5) return `${nums.slice(0,2)}.${nums.slice(2)}`;
  if (nums.length <= 8) return `${nums.slice(0,2)}.${nums.slice(2,5)}.${nums.slice(5)}`;
  if (nums.length <= 12) return `${nums.slice(0,2)}.${nums.slice(2,5)}.${nums.slice(5,8)}/${nums.slice(8)}`;
  return `${nums.slice(0,2)}.${nums.slice(2,5)}.${nums.slice(5,8)}/${nums.slice(8,12)}-${nums.slice(12)}`;
}

const TERMOS = [
  { id: 1, titulo: 'Autônomo Art 442-B CLT', desc: 'Declaro ser autônomo nos termos do art. 442-B da CLT' },
  { id: 2, titulo: 'LGPD', desc: 'Autorizo uso de dados conforme LGPD' },
  { id: 3, titulo: 'MEI R$1500', desc: 'Ciente do limite MEI R$1500 por contratante' },
  { id: 4, titulo: 'Cancelamento R$40', desc: 'Ciente da taxa de cancelamento R$40' },
  { id: 5, titulo: 'Intermediação', desc: 'Ciente da taxa de intermediação da plataforma' },
];

export default function CadastroUnificado({ onCadastro, usuario: usuarioProp, modoEdicao = false, onAtualizado }: Props) {
  const { isDark } = useTheme();
  const [form, setForm] = useState({
    nome: '', cpf: '', cpfOriginal: '', email: '',
    cnpj: '', nomeFantasia: '',
    funcao: 'Garçom', valorHora: 20, bio: '',
    bairro: 'Centro', endereco: '', endereco_completo: '', cidade: 'Uberlândia', cidade_id: 1, cidade_nome: 'Uberlândia',
    lat: undefined as number | undefined, lng: undefined as number | undefined,
    endereco_lat: undefined as number | undefined, endereco_lng: undefined as number | undefined,
    comoChega: 'Moto', ajudaUber: 10,
    is_freela: true, is_contratante: false,
    termos: [false, false, false, false, false],
    temMei: false
  });
  const [etapa, setEtapa] = useState<'form' | 'codigo'>('form');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [statusInfo, setStatusInfo] = useState<any>(null);
  const [mensagem, setMensagem] = useState('');
  const [isDualOriginal, setIsDualOriginal] = useState(false);
  const [virouDual, setVirouDual] = useState(false);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    const carregar = (u: any) => {
      if (!u) return;
      const dual = !!(u.is_freela && u.is_contratante);
      setIsDualOriginal(dual);
      setVirouDual(false);
      setForm({
        nome: u.nome_completo || u.nome || '',
        cpf: apenasNumeros(u.cpf || ''),
        cpfOriginal: u.cpf || '',
        email: u.email || '',
        cnpj: apenasNumeros(u.cnpj || ''),
        nomeFantasia: u.nome_fantasia || u.nomeFantasia || '',
        funcao: u.funcao_principal || u.funcao || 'Garçom',
        valorHora: u.valor_hora_base || u.valorHora || 20,
        bio: u.bio || '',
        bairro: u.bairro || u.cidade_nome || 'Centro',
        endereco: u.endereco_completo || u.endereco || '',
        endereco_completo: u.endereco_completo || u.endereco || '',
        cidade: u.cidade_nome || u.cidade || 'Uberlândia',
        cidade_id: u.cidade_id || 1,
        cidade_nome: u.cidade_nome || u.cidade || 'Uberlândia',
        lat: u.endereco_lat || u.lat,
        lng: u.endereco_lng || u.lng,
        endereco_lat: u.endereco_lat || u.lat,
        endereco_lng: u.endereco_lng || u.lng,
        comoChega: u.como_chega || u.comoChega || 'Moto',
        ajudaUber: u.ajuda_uber || u.ajudaUber || 10,
        is_freela: u.is_freela ?? true,
        is_contratante: u.is_contratante ?? false,
        termos: [true, true, true, true, true],
        temMei: u.tem_mei || u.temMei || false
      });
    };
    const buscarCompleto = async () => {
      if (modoEdicao) {
        const token = localStorage.getItem('uaifrila_token');
        if (!token) { if (usuarioProp) carregar(usuarioProp); return; }
        try {
          const res = await fetch(`${API}/usuarios/me`, { headers: { 'Authorization': `Bearer ${token}` } });
          if (res.ok) {
            const data = await res.json();
            carregar(data.usuario || data);
            return;
          }
        } catch {}
        if (usuarioProp) carregar(usuarioProp);
        else {
          const ls = localStorage.getItem('uaifrila_usuario');
          if (ls) { try { carregar(JSON.parse(ls)); } catch {} }
        }
      }
    };
    if (!modoEdicao) {
      const tipo = localStorage.getItem('uaifrila_tipo_cadastro');
      if (tipo === 'contratante') setForm(prev => ({ ...prev, is_freela: false, is_contratante: true }));
      else if (tipo === 'freela') setForm(prev => ({ ...prev, is_freela: true, is_contratante: false }));
    }
    buscarCompleto();
  }, [modoEdicao, usuarioProp]);

  const handleFreelaChange = (checked: boolean) => {
    if (modoEdicao && (isDualOriginal || virouDual)) return;
    if (!checked && !form.is_contratante) return;
    const nf = { ...form, is_freela: checked };
    if (nf.is_freela && nf.is_contratante && !isDualOriginal) setVirouDual(true);
    setForm(nf);
  };
  const handleContratanteChange = (checked: boolean) => {
    if (modoEdicao && (isDualOriginal || virouDual)) return;
    if (!checked && !form.is_freela) return;
    const nf = { ...form, is_contratante: checked };
    if (nf.is_freela && nf.is_contratante && !isDualOriginal) setVirouDual(true);
    setForm(nf);
  };

  const handleSubmit = async () => {
    if (!modoEdicao && !form.termos.every(t=>t)) { setErro('Aceite todos os 5 termos'); return; }
    if (!form.email.includes('@')) { setErro('E-mail inválido'); return; }
    if (form.cpf && form.cpf.length !== 11) { setErro('CPF deve ter 11 dígitos'); return; }
    if (!form.is_freela && !form.is_contratante) { setErro('Selecione pelo menos Freela ou Contratante'); return; }
    if (!form.cidade_nome && !form.cidade) { setErro('Selecione uma cidade ativa'); return; }
    if (!form.endereco_completo && !form.endereco) { setErro('Informe seu endereço completo com busca no mapa'); return; }
    setCarregando(true); setErro(''); setMensagem('');
    try {
      if (modoEdicao) {
        const token = localStorage.getItem('uaifrila_token');
        const usuarioLS = JSON.parse(localStorage.getItem('uaifrila_usuario') || '{}');
        const id = usuarioProp?.id || usuarioLS.id;
        const res = await fetch(`${API}/usuarios/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            nome: form.nome,
            bairro: form.bairro,
            endereco: form.endereco_completo || form.endereco,
            endereco_completo: form.endereco_completo || form.endereco,
            cidade: form.cidade_nome,
            cidade_nome: form.cidade_nome,
            cidade_id: form.cidade_id,
            lat: form.lat,
            lng: form.lng,
            endereco_lat: form.endereco_lat,
            endereco_lng: form.endereco_lng,
            funcao: form.funcao,
            valorHora: form.valorHora,
            cnpj: form.cnpj,
            nomeFantasia: form.nomeFantasia,
            bio: form.bio,
            is_freela: form.is_freela,
            is_contratante: form.is_contratante,
            comoChega: form.comoChega,
            ajudaUber: form.ajudaUber,
            temMei: form.temMei
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || 'Erro ao atualizar');
        setMensagem('Atualizado com sucesso!');
        if (onAtualizado) onAtualizado(data.usuario);
        localStorage.setItem('uaifrila_usuario', JSON.stringify(data.usuario));
      } else {
        const res = await fetch(`${API}/usuarios/registrar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: form.nome,
            cpf: form.cpf,
            email: form.email,
            bairro: form.bairro,
            endereco: form.endereco_completo || form.endereco,
            endereco_completo: form.endereco_completo || form.endereco,
            cidade: form.cidade_nome,
            cidade_nome: form.cidade_nome,
            cidade_id: form.cidade_id,
            lat: form.lat,
            lng: form.lng,
            endereco_lat: form.endereco_lat,
            endereco_lng: form.endereco_lng,
            funcao: form.funcao,
            valorHora: form.valorHora,
            cnpj: form.cnpj,
            nomeFantasia: form.nomeFantasia,
            bio: form.bio,
            isFreela: form.is_freela,
            isContratante: form.is_contratante,
            comoChega: form.comoChega,
            ajudaUber: form.ajudaUber,
            temMei: form.temMei
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || 'Erro ao cadastrar');
        if (data.status === 'AGUARDANDO_VALIDACAO_EMAIL') {
          setStatusInfo(data);
          setEtapa('codigo');
        } else if (data.sucesso) {
          if (onCadastro) onCadastro();
        }
      }
    } catch (e:any) { setErro(e.message); }
    finally { setCarregando(false); }
  };

  if (etapa === 'codigo' && statusInfo) {
    return <ValidacaoCodigo email={statusInfo.email || form.email} tipo="cadastro" onValidado={(dados:any) => { localStorage.setItem('uaifrila_token', dados.token); localStorage.setItem('uaifrila_usuario', JSON.stringify(dados.usuario)); if (onCadastro) onCadastro(); }} onVoltar={() => setEtapa('form')} />;
  }

  const freelaDesabilitado = modoEdicao && (isDualOriginal || virouDual);
  const contratanteDesabilitado = modoEdicao && (isDualOriginal || virouDual);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className={`p-6 md:p-8 border-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white' : 'bg-white border-black'}`}>
        <h2 className={`text-2xl font-black uppercase ${isDark ? 'text-white' : 'text-black'}`}>{modoEdicao ? 'Editar Perfil' : 'Cadastro'}</h2>
        <p className="text-xs mt-1 opacity-70">{modoEdicao ? 'Atualize seus dados - CPF e E-mail bloqueados' : 'Preencha seus dados - CPF e E-mail liberados'}</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <label className={`p-4 border-2 flex items-center gap-3 ${freelaDesabilitado ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${form.is_freela ? 'bg-[#E53935] text-white border-black' : 'border-black/20'}`}>
            <input type="checkbox" checked={form.is_freela} disabled={freelaDesabilitado} onChange={e=>handleFreelaChange(e.target.checked)} />
            <span className="font-black uppercase text-xs">Freela {freelaDesabilitado ? '🔒' : ''}</span>
          </label>
          <label className={`p-4 border-2 flex items-center gap-3 ${contratanteDesabilitado ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${form.is_contratante ? 'bg-[#E53935] text-white border-black' : 'border-black/20'}`}>
            <input type="checkbox" checked={form.is_contratante} disabled={contratanteDesabilitado} onChange={e=>handleContratanteChange(e.target.checked)} />
            <span className="font-black uppercase text-xs">Contratante {contratanteDesabilitado ? '🔒' : ''}</span>
          </label>
        </div>

        <h3 className="mt-8 font-black uppercase text-sm">Dados</h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase">Nome Completo</label>
            <input value={form.nome} onChange={e=>setForm({...form, nome: e.target.value})} placeholder="Nome completo" className={`w-full h-[48px] px-4 text-sm border-2 ${isDark ? 'bg-black text-white border-white' : 'bg-white text-black border-black'}`} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase flex items-center gap-2">CPF {modoEdicao && <span className="px-2 py-0.5 bg-zinc-300 text-black text-[8px] border border-black">BLOQUEADO 🔒</span>}</label>
            {modoEdicao ? (
              <div className="relative h-[48px]">
                <input value={form.cpfOriginal ? mascararCPF(form.cpfOriginal) : (form.cpf ? mascararCPF(form.cpf) : '')} disabled={true} placeholder="CPF não informado" className="w-full h-[48px] px-4 text-sm border-2 bg-zinc-200 text-zinc-600 border-black/20 cursor-not-allowed font-mono" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]">🔒</div>
              </div>
            ) : (
              <input value={formatarCPF(form.cpf)} onChange={e=>setForm({...form, cpf: apenasNumeros(e.target.value).slice(0,11)})} placeholder="123.456.789-10" maxLength={14} className={`w-full h-[48px] px-4 text-sm border-2 ${isDark ? 'bg-black text-white border-white' : 'bg-white text-black border-black'}`} />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase">E-mail {modoEdicao && <span className="px-2 py-0.5 bg-zinc-300 text-black text-[8px] border border-black">BLOQUEADO 🔒</span>}</label>
            {modoEdicao ? (
              <input value={form.email} disabled={true} placeholder="E-mail" className="w-full h-[48px] px-4 text-sm border-2 bg-zinc-200 text-zinc-500 border-black/20 cursor-not-allowed" />
            ) : (
              <input value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="seu@email.com" className="w-full h-[48px] px-4 text-sm border-2 ${isDark ? 'bg-black text-white border-white' : 'bg-white text-black border-black'}" />
            )}
          </div>

          <div className="md:col-span-2">
            <GoogleEnderecoInput
              endereco={form.endereco_completo || form.endereco}
              cidade={form.cidade_nome || form.cidade}
              cidadeId={form.cidade_id}
              lat={form.endereco_lat || form.lat}
              lng={form.endereco_lng || form.lng}
              onChange={(data) => setForm({
                ...form,
                endereco: data.endereco,
                endereco_completo: data.endereco,
                cidade: data.cidade,
                cidade_nome: data.cidade,
                cidade_id: data.cidade_id || form.cidade_id,
                lat: data.lat,
                lng: data.lng,
                endereco_lat: data.lat,
                endereco_lng: data.lng,
                bairro: data.bairro || form.bairro
              })}
            />
          </div>

          {/* Função e Valor Hora - só para Freela ou Dual */}
          {form.is_freela && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase">Função</label>
                <select value={form.funcao} onChange={e=>setForm({...form, funcao: e.target.value})} className={`w-full h-[48px] px-4 text-sm border-2 ${isDark ? 'bg-black text-white border-white' : 'bg-white text-black border-black'}`}>
                  {['Garçom','Bartender','Cozinheiro','Auxiliar de Cozinha','Recepcionista','Segurança','Limpeza','Outros'].map(f=><option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase">Valor Hora (R$)</label>
                <input type="number" value={form.valorHora} onChange={e=>setForm({...form, valorHora: Number(e.target.value)})} className={`w-full h-[48px] px-4 text-sm border-2 ${isDark ? 'bg-black text-white border-white' : 'bg-white text-black border-black'}`} />
              </div>
            </>
          )}

          {/* CNPJ e Nome Fantasia - só para Contratante ou Dual */}
          {form.is_contratante && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase">CNPJ (opcional)</label>
                <input value={formatarCNPJ(form.cnpj)} onChange={e=>setForm({...form, cnpj: apenasNumeros(e.target.value).slice(0,14)})} placeholder="12.345.678/0001-99" maxLength={18} className={`w-full h-[48px] px-4 text-sm border-2 ${isDark ? 'bg-black text-white border-white' : 'bg-white text-black border-black'}`} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase">Nome Fantasia</label>
                <input value={form.nomeFantasia} onChange={e=>setForm({...form, nomeFantasia: e.target.value})} placeholder="Nome Fantasia" className={`w-full h-[48px] px-4 text-sm border-2 ${isDark ? 'bg-black text-white border-white' : 'bg-white text-black border-black'}`} />
              </div>
            </>
          )}
        </div>

        <h3 className="mt-8 font-black uppercase text-sm">Termos Aceitos {modoEdicao ? '(Somente visualização 🔒)' : ''}</h3>
        <div className="mt-3 space-y-2">
          {TERMOS.map((t,i)=>(
            <label key={t.id} className={`flex gap-3 p-3 border-2 text-xs ${modoEdicao ? 'bg-zinc-100 border-black/10 cursor-not-allowed opacity-80' : 'border-black/10 cursor-pointer'}`}>
              <input type="checkbox" checked={form.termos[i]} disabled={modoEdicao} onChange={e=>{ if (!modoEdicao) { const nt=[...form.termos]; nt[i]=e.target.checked; setForm({...form, termos: nt}); }}} />
              <div><span className="font-black">{t.titulo}</span> <span className="opacity-70">- {t.desc}</span>{modoEdicao && <span className="ml-2 text-[8px] px-1 bg-zinc-300 border">ACEITO 🔒</span>}</div>
            </label>
          ))}
        </div>

        {erro && <div className="mt-4 p-3 bg-[#E53935] text-white border-2 border-black text-xs font-bold">❌ {erro}</div>}
        {mensagem && <div className="mt-4 p-3 bg-[#00C851] text-white border-2 border-black text-xs font-bold">{mensagem}</div>}

        <button onClick={handleSubmit} disabled={carregando} className={`mt-8 w-full py-4 font-black uppercase text-sm border-2 border-black ${isDark ? 'bg-[#0066FF] text-white' : 'bg-black text-white'} ${carregando ? 'opacity-50' : ''}`}>
          {carregando ? 'Salvando...' : modoEdicao ? 'Salvar Alterações' : 'Cadastrar'}
        </button>
      </div>
    </div>
  );
}
