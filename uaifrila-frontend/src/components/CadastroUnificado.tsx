import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import ValidacaoCodigo from './ValidacaoCodigo';

interface Props {
  onCadastro?: () => void;
  usuario?: any;
  modoEdicao?: boolean;
  onAtualizado?: (usuario: any) => void;
}

function apenasNumeros(str: string) {
  return (str || '').replace(/\D/g, '');
}
function formatarCPF(cpf: string) {
  const nums = apenasNumeros(cpf).slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0,3)}.${nums.slice(3)}`;
  if (nums.length <= 9) return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6)}`;
  return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6,9)}-${nums.slice(9)}`;
}
function mascararCPF(cpf: string) {
  const nums = apenasNumeros(cpf);
  if (nums.length < 11) {
    if (nums.length === 0) return '***.***.***-**';
    if (nums.length <= 3) return `${nums}.***.***-**`;
    return `${nums.slice(0,3)}.***.***-**`;
  }
  const inicio = nums.slice(0, 3);
  const fim = nums.slice(9, 11);
  return `${inicio}.***.***-${fim}`; // 123.***.***-01
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
    nome: '', cpf: '', cpfOriginal: '', email: '', senha: '',
    cnpj: '', nomeFantasia: '',
    funcao: 'Garçom', valorHora: 20, bio: '',
    bairro: 'Centro', comoChega: 'Moto', ajudaUber: 10,
    is_freela: true, is_contratante: false,
    termos: [false, false, false, false, false],
    temMei: false
  });
  const [etapa, setEtapa] = useState<'form' | 'codigo'>('form');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [statusInfo, setStatusInfo] = useState<any>(null);
  const [mensagem, setMensagem] = useState('');
  const [bairros] = useState<string[]>(['Centro','Granja Marileusa','Karaíba','Santa Mônica','Umuarama','Jardim Karaíba','Morada da Colina','Patrimônio','Laranjeiras','Segismundo Pereira','Custódio Pereira','Jardim Europa','Jardim Célia','Luizote','Planalto','Chácaras Tubalina','Mansões Aeroporto']);
  const [tipoInicial] = useState<string>(() => localStorage.getItem('uaifrila_tipo_cadastro') || '');
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
        cpf: u.cpf || '',
        cpfOriginal: u.cpf || '',
        email: u.email || '',
        senha: '',
        cnpj: u.cnpj || '',
        nomeFantasia: u.nome_fantasia || u.nomeFantasia || '',
        funcao: u.funcao_principal || u.funcao || 'Garçom',
        valorHora: u.valor_hora_base || u.valorHora || 20,
        bio: u.bio || '',
        bairro: u.bairro || 'Centro',
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
          const res = await fetch(`${API}/usuarios/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const uCompleto = data.usuario || data;
            carregar(uCompleto);
            return;
          }
        } catch {}
        // fallback
        if (usuarioProp) carregar(usuarioProp);
        else {
          const ls = localStorage.getItem('uaifrila_usuario');
          if (ls) { try { carregar(JSON.parse(ls)); } catch {} }
        }
      }
    };
    // Se é cadastro novo e veio da Landing com tipo pré-definido
    if (!modoEdicao) {
      const tipo = localStorage.getItem('uaifrila_tipo_cadastro');
      if (tipo === 'contratante') {
        setForm(prev => ({ ...prev, is_freela: false, is_contratante: true }));
      } else if (tipo === 'freela') {
        setForm(prev => ({ ...prev, is_freela: true, is_contratante: false }));
      }
      // Limpa após usar para não afetar próxima vez
      // localStorage.removeItem('uaifrila_tipo_cadastro');
    }
    buscarCompleto();
  }, [modoEdicao, usuarioProp]);

  const handleCpfChange = (valor: string) => {
    if (modoEdicao) return;
    const nums = apenasNumeros(valor).slice(0,11);
    setForm({...form, cpf: nums, cpfOriginal: nums});
  };

  const handleFreelaChange = (checked: boolean) => {
    if (modoEdicao) {
      // Se já é dual original ou virou dual, não pode voltar para simples
      if (isDualOriginal || virouDual) return;
      // Não pode desmarcar se for o único marcado
      if (!checked && !form.is_contratante) return;
      const novoForm = { ...form, is_freela: checked };
      if (novoForm.is_freela && novoForm.is_contratante && !isDualOriginal) {
        setVirouDual(true);
      }
      setForm(novoForm);
    } else {
      setForm({...form, is_freela: checked});
    }
  };

  const handleContratanteChange = (checked: boolean) => {
    if (modoEdicao) {
      if (isDualOriginal || virouDual) return;
      if (!checked && !form.is_freela) return;
      const novoForm = { ...form, is_contratante: checked };
      if (novoForm.is_freela && novoForm.is_contratante && !isDualOriginal) {
        setVirouDual(true);
      }
      setForm(novoForm);
    } else {
      setForm({...form, is_contratante: checked});
    }
  };

  const handleSubmit = async () => {
    if (!modoEdicao && !form.termos.every(t=>t)) { setErro('Aceite todos os 5 termos'); return; }
    if (!form.email.includes('@')) { setErro('E-mail inválido'); return; }
    if (!form.is_freela && !form.is_contratante) { setErro('Selecione pelo menos Freela ou Contratante'); return; }
    setCarregando(true); setErro(''); setMensagem('');
    try {
      if (modoEdicao) {
        const token = localStorage.getItem('uaifrila_token');
        const usuarioLS = JSON.parse(localStorage.getItem('uaifrila_usuario') || '{}');
        const id = usuarioProp?.id || usuarioLS.id;
        // API NÃO atualiza CPF nem email - só demais campos
        const res = await fetch(`${API}/usuarios/${id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            nome_completo: form.nome,
            cnpj: form.cnpj,
            nome_fantasia: form.nomeFantasia,
            bairro: form.bairro,
            funcao_principal: form.funcao,
            valor_hora_base: form.valorHora,
            bio: form.bio,
            is_freela: form.is_freela,
            is_contratante: form.is_contratante,
            // cpf e email propositalmente NÃO enviados
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);
        const usuarioAtualizado = data.usuario;
        localStorage.setItem('uaifrila_usuario', JSON.stringify(usuarioAtualizado));
        setMensagem('Cadastro atualizado com sucesso! ✅');
        onAtualizado?.(usuarioAtualizado);
        if (virouDual) setIsDualOriginal(true);
      } else {
        const res = await fetch(`${API}/usuarios/registrar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: form.nome, cpf: form.cpf, email: form.email, senha: form.senha,
            cnpj: form.cnpj, nomeFantasia: form.nomeFantasia,
            isFreela: form.is_freela, isContratante: form.is_contratante,
            funcao: form.funcao, valorHora: form.valorHora, bio: form.bio,
            bairro: form.bairro, comoChega: form.comoChega, ajudaUber: form.ajudaUber,
            temMei: form.temMei
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro);
        setStatusInfo(data);
        if (data.sucesso) onCadastro?.();
        else setEtapa('codigo');
      }
    } catch (e: any) { setErro(e.message); }
    finally { setCarregando(false); }
  };

  if (etapa === 'codigo' && !modoEdicao) {
    return (
      <div>
        {statusInfo && (
          <div className={`mx-auto max-w-md mt-4 p-3 border-2 text-xs text-center ${isDark ? 'bg-yellow-900/30 border-yellow-600 text-yellow-200' : 'bg-yellow-100 border-black text-black'}`}>
            Usuario inserido - Valide o código para ativar
          </div>
        )}
        <ValidacaoCodigo email={form.email} tipo="cadastro" onValidado={() => { onCadastro?.(); }} onVoltar={() => setEtapa('form')} />
      </div>
    );
  }

  const freelaDesabilitado = modoEdicao && (isDualOriginal || virouDual);
  const contratanteDesabilitado = modoEdicao && (isDualOriginal || virouDual);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className={`p-8 border-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black uppercase">{modoEdicao ? 'Editar Meu Cadastro' : 'Cadastro'}</h2>
            <p className="text-xs mt-2 opacity-70">{modoEdicao ? `Editando ${form.email}` : 'Crie sua conta'} {isDualOriginal ? '(Modo Dual)' : ''} {virouDual ? '(Virou Dual - não volta mais)' : ''}</p>
          </div>
          {modoEdicao && (
            <span className={`px-3 py-1 border-2 text-[10px] font-black uppercase ${isDualOriginal || virouDual ? 'bg-[#E53935] text-white border-black' : 'bg-[#FFC700] text-black border-black'}`}>
              {isDualOriginal || virouDual ? 'DUAL 🔒' : 'Modo Edição'}
            </span>
          )}
        </div>

        <h3 className="mt-6 font-black uppercase text-sm">Tipo de Conta - Mesma regra do cadastro</h3>
        <p className="text-[10px] opacity-60 mt-1">{modoEdicao ? (isDualOriginal || virouDual ? 'Você está no modo DUAL. Não é possível voltar para modo simples por segurança.' : 'Você pode mudar para modo DUAL marcando as duas opções. Após virar DUAL, não volta mais para simples.') : 'Selecione pelo menos um. Pode selecionar os dois para modo DUAL.'}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className={`p-4 border-2 flex items-center gap-3 ${freelaDesabilitado ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${form.is_freela ? 'bg-[#FFC700] border-black text-black' : 'border-black/20'}`}>
            <input type="checkbox" checked={form.is_freela} disabled={freelaDesabilitado} onChange={e=>handleFreelaChange(e.target.checked)} />
            <span className="font-black uppercase text-xs">Freela {freelaDesabilitado ? '🔒' : ''}</span>
          </label>
          <label className={`p-4 border-2 flex items-center gap-3 ${contratanteDesabilitado ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${form.is_contratante ? 'bg-[#E53935] text-white border-black' : 'border-black/20'}`}>
            <input type="checkbox" checked={form.is_contratante} disabled={contratanteDesabilitado} onChange={e=>handleContratanteChange(e.target.checked)} />
            <span className="font-black uppercase text-xs">Contratante {contratanteDesabilitado ? '🔒' : ''}</span>
          </label>
        </div>
        {modoEdicao && (isDualOriginal || virouDual) && (
          <div className="mt-2 p-2 bg-zinc-100 border border-black/10 text-[10px]">🔒 Modo DUAL ativado - por segurança não é possível voltar para modo simples</div>
        )}

        <h3 className="mt-8 font-black uppercase text-sm">Dados</h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase">Nome Completo</label>
            <input value={form.nome} onChange={e=>setForm({...form, nome: e.target.value})} placeholder="Nome completo" className={`w-full mt-1 px-4 py-3 text-sm border-2 ${isDark ? 'bg-black text-white border-white' : 'bg-white text-black border-black'}`} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase flex items-center gap-2">
              CPF <span className="px-2 py-0.5 bg-zinc-300 text-black text-[8px] border border-black">BLOQUEADO 🔒</span>
            </label>
            <div className="relative">
              <input 
                value={form.cpfOriginal ? mascararCPF(form.cpfOriginal) : (form.cpf ? mascararCPF(form.cpf) : '')} 
                disabled={true}
                placeholder="CPF não informado" 
                className={`w-full mt-1 px-4 py-3 text-sm border-2 bg-zinc-200 text-zinc-600 border-black/20 cursor-not-allowed font-mono`} 
              />
              <div className="absolute right-3 top-[60%] -translate-y-1/2 text-[10px]">🔒</div>
            </div>
            <p className="text-[9px] mt-1 opacity-60 font-mono">
              {form.cpfOriginal ? `Máscara 123.***.***-01 aplicada: ${mascararCPF(form.cpfOriginal)}` : 'CPF não pode ser alterado por segurança (API bloqueia)'} 
              <br/>Original guardado: {form.cpfOriginal ? apenasNumeros(form.cpfOriginal).length + ' dígitos' : '0 dígitos - verifique se API /usuarios/me retorna cpf'}
            </p>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase">E-mail <span className="px-2 py-0.5 bg-zinc-300 text-black text-[8px] border border-black">BLOQUEADO 🔒</span></label>
            <input value={form.email} disabled={true} placeholder="E-mail" className={`w-full mt-1 px-4 py-3 text-sm border-2 bg-zinc-200 text-zinc-500 border-black/20 cursor-not-allowed`} />
            <p className="text-[9px] mt-1 opacity-60">E-mail não pode ser alterado (API bloqueia)</p>
          </div>
          {!modoEdicao && (
            <div>
              <label className="text-[10px] font-black uppercase">Senha</label>
              <input value={form.senha} onChange={e=>setForm({...form, senha: e.target.value})} type="password" placeholder="Senha" className={`w-full mt-1 px-4 py-3 text-sm border-2 ${isDark ? 'bg-black text-white border-white' : 'bg-white text-black border-black'}`} />
            </div>
          )}
          <div>
            <label className="text-[10px] font-black uppercase">Bairro</label>
            <select value={form.bairro} onChange={e=>setForm({...form, bairro: e.target.value})} className={`w-full mt-1 px-4 py-3 text-sm border-2 ${isDark ? 'bg-black text-white border-white' : 'bg-white text-black border-black'}`}>
              {bairros.map(b=><option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase">Função</label>
            <select value={form.funcao} onChange={e=>setForm({...form, funcao: e.target.value})} className={`w-full mt-1 px-4 py-3 text-sm border-2 ${isDark ? 'bg-black text-white border-white' : 'bg-white text-black border-black'}`}>
              {['Garçom','Bartender','Cozinheiro','Auxiliar de Cozinha','Recepcionista','Segurança','Limpeza','Outros'].map(f=><option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase">Valor Hora (R$)</label>
            <input type="number" value={form.valorHora} onChange={e=>setForm({...form, valorHora: Number(e.target.value)})} className={`w-full mt-1 px-4 py-3 text-sm border-2 ${isDark ? 'bg-black text-white border-white' : 'bg-white text-black border-black'}`} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase">CNPJ (opcional)</label>
            <input value={form.cnpj} onChange={e=>setForm({...form, cnpj: e.target.value})} placeholder="CNPJ" className={`w-full mt-1 px-4 py-3 text-sm border-2 ${isDark ? 'bg-black text-white border-white' : 'bg-white text-black border-black'}`} />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase">Nome Fantasia</label>
            <input value={form.nomeFantasia} onChange={e=>setForm({...form, nomeFantasia: e.target.value})} placeholder="Nome Fantasia" className={`w-full mt-1 px-4 py-3 text-sm border-2 ${isDark ? 'bg-black text-white border-white' : 'bg-white text-black border-black'}`} />
          </div>
        </div>

        <h3 className="mt-8 font-black uppercase text-sm">Termos Aceitos {modoEdicao ? '(Somente visualização 🔒)' : ''}</h3>
        <div className="mt-3 space-y-2">
          {TERMOS.map((t,i)=>(
            <label key={t.id} className={`flex gap-3 p-3 border-2 text-xs ${modoEdicao ? 'bg-zinc-100 border-black/10 cursor-not-allowed opacity-80' : 'border-black/10 cursor-pointer'}`}>
              <input type="checkbox" checked={form.termos[i]} disabled={modoEdicao} onChange={e=>{ if (!modoEdicao) { const nt=[...form.termos]; nt[i]=e.target.checked; setForm({...form, termos: nt}); }}} />
              <div>
                <span className="font-black">{t.titulo}</span> <span className="opacity-70">- {t.desc}</span>
                {modoEdicao && <span className="ml-2 text-[8px] px-1 bg-zinc-300 border">ACEITO 🔒</span>}
              </div>
            </label>
          ))}
        </div>
        {modoEdicao && <p className="text-[10px] mt-2 opacity-60">Termos não podem ser desmarcados. Só é possível evoluir para modo DUAL.</p>}

        {erro && <div className="mt-4 p-3 bg-[#E53935] text-white border-2 border-black text-xs font-bold">❌ {erro}</div>}
        {mensagem && <div className="mt-4 p-3 bg-[#00C851] text-white border-2 border-black text-xs font-bold">{mensagem}</div>}

        <button onClick={handleSubmit} disabled={carregando} className={`mt-8 w-full py-4 font-black uppercase text-sm border-2 border-black ${isDark ? 'bg-[#0066FF] text-white' : 'bg-black text-white'} ${carregando ? 'opacity-50' : ''}`}>
          {carregando ? 'Salvando...' : modoEdicao ? 'Salvar Alterações' : 'Cadastrar'}
        </button>
      </div>
    </div>
  );
}