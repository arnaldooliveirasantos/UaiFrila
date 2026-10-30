
import React, { useState, useEffect } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import ValidacaoCodigo from './ValidacaoCodigo';
import GoogleEnderecoInput from './GoogleEnderecoInput';
import { useTiposUsuario } from './useTiposUsuario';

interface Props {
  onCadastro?: () => void;
  usuario?: any;
  modoEdicao?: boolean;
  onAtualizado?: (usuario: any) => void;
}

function apenasNumeros(str: string) { return (str || '').replace(/\D/g, ''); }
function mascararCPF(cpf: string) {
  const nums = apenasNumeros(cpf);
  if (nums.length < 11) return '***.***.***-**';
  return `${nums.slice(0,3)}.***.***-${nums.slice(9,11)}`;
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
  const styles = useUaiFrilaStyles();
  const [queroTrampar, setQueroTrampar] = useState(true);
  const [queroContratar, setQueroContratar] = useState(false);
  const [tipoOrigem, setTipoOrigem] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: '', cpf: '', cpfOriginal: '', email: '',
    cnpj: '', nomeFantasia: '',
    funcao: 'Garçom', valorHora: 20, bio: '',
    bairro: 'Centro', endereco: '', endereco_completo: '', cidade: 'Uberlândia', cidade_id: 1, cidade_nome: 'Uberlândia',
    lat: undefined as number | undefined, lng: undefined as number | undefined,
    endereco_lat: undefined as number | undefined, endereco_lng: undefined as number | undefined,
    comoChega: 'Moto', ajudaUber: 10,
    termos: [false, false, false, false, false],
    temMei: false
  });
  const [etapa, setEtapa] = useState<'form' | 'codigo'>('form');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';
  const { tipos, getTipoUsuario } = useTiposUsuario();

  const getTipoChave = () => {
    if (queroTrampar && queroContratar) return 'DUAL';
    if (queroContratar) return 'CONTRATANTE';
    return 'FREELA';
  };

  useEffect(() => {
    const tipo = localStorage.getItem('uaifrila_tipo_cadastro');
    if (tipo === 'CONTRATANTE') {
      setQueroTrampar(false);
      setQueroContratar(true);
    }
  }, []);

  // REGRA: FREELA = só trampar, CONTRATANTE = só contratar, OUTROS = DUAL (ambos marcados e bloqueados)
  useEffect(() => {
    if (modoEdicao && usuarioProp) {
      const tipoDB = getTipoUsuario(usuarioProp);
      let t = '';
      if (tipoDB?.chave) {
        t = tipoDB.chave.toUpperCase();
      } else if (usuarioProp.role) {
        const roleUpper = usuarioProp.role.toUpperCase();
        if (['SUPER_ADMIN','ADMIN','FINANCEIRO','DUAL','CONTRATANTE','FREELA'].includes(roleUpper)) {
          t = roleUpper;
        }
      } else if (usuarioProp.tipo_chave) {
        t = usuarioProp.tipo_chave.toUpperCase();
      } else {
        t = 'FREELA';
      }

      setTipoOrigem(t);
      console.log('[CadastroUnificado] Tipo:', t, 'DB:', tipoDB, 'role:', usuarioProp.role);

      // REGRA DUAL para outros tipos
      if (t === 'CONTRATANTE') { 
        setQueroTrampar(false); 
        setQueroContratar(true); 
      }
      else if (t === 'FREELA') { 
        setQueroTrampar(true); 
        setQueroContratar(false); 
      }
      else { 
        // QUALQUER diferente de FREELA e CONTRATANTE = regra DUAL: ambos marcados e bloqueados
        setQueroTrampar(true); 
        setQueroContratar(true); 
      }

      setForm({
        nome: usuarioProp.nome_completo || '',
        cpf: apenasNumeros(usuarioProp.cpf || ''),
        cpfOriginal: usuarioProp.cpf || '',
        email: usuarioProp.email || '',
        cnpj: apenasNumeros(usuarioProp.cnpj || ''),
        nomeFantasia: usuarioProp.nome_fantasia || '',
        funcao: usuarioProp.funcao_principal || 'Garçom',
        valorHora: usuarioProp.valor_hora_base || 20,
        bio: usuarioProp.bio || '',
        bairro: usuarioProp.bairro || 'Centro',
        endereco: usuarioProp.endereco_completo || '',
        endereco_completo: usuarioProp.endereco_completo || '',
        cidade: usuarioProp.cidade_nome || 'Uberlândia',
        cidade_id: usuarioProp.cidade_id || 1,
        cidade_nome: usuarioProp.cidade_nome || 'Uberlândia',
        lat: usuarioProp.endereco_lat,
        lng: usuarioProp.endereco_lng,
        endereco_lat: usuarioProp.endereco_lat,
        endereco_lng: usuarioProp.endereco_lng,
        comoChega: usuarioProp.como_chega || 'Moto',
        ajudaUber: usuarioProp.aja_uber || usuarioProp.ajuda_uber || 10,
        termos: [true, true, true, true, true],
        temMei: usuarioProp.tem_mei || false
      });
    }
  }, [usuarioProp, tipos]);

  const handleSubmit = async () => {
    setErro('');
    setMensagem('');
    if (!form.termos.every(Boolean)) { setErro('Aceite todos os termos'); return; }
    if (!form.nome || !form.email || !form.cpf) { setErro('Preencha nome, e-mail e CPF'); return; }
    setCarregando(true);
    try {
      const payload = {
        nome: form.nome,
        cpf: form.cpf,
        email: form.email.toLowerCase(),
        cnpj: form.cnpj,
        nomeFantasia: form.nomeFantasia,
        funcao: form.funcao,
        valorHora: form.valorHora,
        bio: form.bio,
        bairro: form.bairro,
        endereco: form.endereco_completo,
        endereco_completo: form.endereco_completo,
        cidade: form.cidade_nome,
        cidade_id: form.cidade_id,
        cidade_nome: form.cidade_nome,
        lat: form.endereco_lat,
        lng: form.endereco_lng,
        endereco_lat: form.endereco_lat,
        endereco_lng: form.endereco_lng,
        tipo_chave: modoEdicao ? tipoOrigem : getTipoChave(),
        temMei: form.temMei,
        comoChega: form.comoChega,
        ajudaUber: form.ajudaUber
      };
      const url = modoEdicao ? `${API}/usuarios/atualizar` : `${API}/auth/cadastro`;
      const token = localStorage.getItem('uaifrila_token');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao salvar');
      if (modoEdicao) {
        setMensagem('Perfil atualizado!');
        onAtualizado?.(data.usuario || payload);
        localStorage.setItem('uaifrila_usuario', JSON.stringify(data.usuario || payload));
      } else {
        localStorage.setItem('uaifrila_usuario_temp', JSON.stringify({ email: form.email, nome: form.nome }));
        setEtapa('codigo');
      }
    } catch (e:any) { setErro(e.message); }
    finally { setCarregando(false); }
  };

  if (etapa === 'codigo') {
    return <ValidacaoCodigo email={form.email} tipo={modoEdicao ? 'atualizacao' : 'cadastro'} onValidado={(u) => { onCadastro?.(); onAtualizado?.(u); }} onVoltar={() => setEtapa('form')} />;
  }

  const isEdicao = modoEdicao;
  const isFreela = tipoOrigem === 'FREELA';
  const isContratante = tipoOrigem === 'CONTRATANTE';
  const isOutrosTipos = tipoOrigem && !['FREELA','CONTRATANTE'].includes(tipoOrigem);

  return (
    <div className="w-full">
      <div className={`${styles.card} p-4 md:p-6`}>
        {(() => {
          // REGRA DUAL para outros tipos: ambos bloqueados
          const bloqueiaFreela = isEdicao && (isFreela || isOutrosTipos);
          const bloqueiaContratante = isEdicao && (isContratante || isOutrosTipos);
          return (
            <>
              <h2 className={`${styles.typography.h2} mb-6`}>CADASTRO - {tipoOrigem || getTipoChave()}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  disabled={!!bloqueiaFreela}
                  onClick={() => { if (bloqueiaFreela) return; setQueroTrampar(!queroTrampar); }}
                  className={`${bloqueiaFreela ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} border-2 p-4 flex items-center gap-3 text-left ${queroTrampar ? 'bg-yellow-400 border-black' : 'bg-zinc-900 border-zinc-700'}`}
                >
                  <div className="text-2xl">💪</div>
                  <div>
                    <div className="font-black text-xs">QUERO TRAMPAR {bloqueiaFreela ? '🔒' : ''}</div>
                    <div className="text-[11px] opacity-70">Trabalhar como freela {isFreela ? '(obrigatório)' : ''}</div>
                  </div>
                  <div className={`ml-auto w-6 h-6 border-2 flex items-center justify-center ${queroTrampar ? 'bg-black border-black text-white' : 'border-current'}`}>
                    {queroTrampar && '✓'}
                  </div>
                </button>

                <button
                  disabled={!!bloqueiaContratante}
                  onClick={() => { if (bloqueiaContratante) return; setQueroContratar(!queroContratar); }}
                  className={`${bloqueiaContratante ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} border-2 p-4 flex items-center gap-3 text-left ${queroContratar ? 'bg-blue-500 border-black text-white' : 'bg-zinc-900 border-zinc-700'}`}
                >
                  <div className="text-2xl">🏢</div>
                  <div>
                    <div className="font-black text-xs">QUERO CONTRATAR {bloqueiaContratante ? '🔒' : ''}</div>
                    <div className="text-[11px] opacity-70">Contratar freelas {isContratante ? '(obrigatório)' : ''}</div>
                  </div>
                  <div className={`ml-auto w-6 h-6 border-2 flex items-center justify-center ${queroContratar ? 'bg-black border-black text-white' : 'border-current'}`}>
                    {queroContratar && '✓'}
                  </div>
                </button>
              </div>

              {isEdicao && (
                <div className="mb-6">
                  {isContratante && (
                    <div className={`${styles.badge('danger')} text-[11px] p-2 normal-case border-2 block`}>
                      🔒 Tipo CONTRATANTE - Quero Contratar é obrigatório (🔒)
                    </div>
                  )}
                  {isFreela && (
                    <div className={`${styles.badge('success')} text-[11px] p-2 normal-case border-2 block`}>
                      🔒 Tipo FREELA - Quero Trampar é obrigatório (🔒)
                    </div>
                  )}
                  {/* Para outros tipos (DUAL, SUPER_ADMIN, etc) - sem mensagem debug, só bloqueia ambos seguindo regra DUAL */}
                </div>
              )}
            </>
          );
        })()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className={styles.label}>Nome completo</label>
            <input value={form.nome} onChange={e=>setForm({...form, nome: e.target.value})} className={styles.input} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={styles.label}>CPF 🔒</label>
            {modoEdicao ? (
              <input value={mascararCPF(form.cpfOriginal)} disabled className={styles.input + ' opacity-60'} />
            ) : (
              <input value={formatarCPF(form.cpf)} onChange={e=>setForm({...form, cpf: apenasNumeros(e.target.value).slice(0,11)})} className={styles.input} />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className={styles.label}>E-mail 🔒</label>
            <input type="email" value={form.email} disabled={modoEdicao} className={`${styles.input} ${modoEdicao ? 'opacity-60' : ''}`} />
          </div>
          <div className="md:col-span-2">
            <GoogleEnderecoInput
              endereco={form.endereco_completo}
              cidade={form.cidade_nome}
              cidadeId={form.cidade_id}
              lat={form.endereco_lat}
              lng={form.endereco_lng}
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
        </div>

        <h3 className={styles.typography.h3 + ' mt-8'}>Termos</h3>
        <div className="mt-3 space-y-2">
          {TERMOS.map((t,i)=>(
            <label key={t.id} className={`${styles.cardSmall} flex gap-3 text-xs cursor-pointer`}>
              <input type="checkbox" checked={form.termos[i]} onChange={e=>{ const nt=[...form.termos]; nt[i]=e.target.checked; setForm({...form, termos: nt}); }} />
              <div><span className="font-black">{t.titulo}</span> - {t.desc}</div>
            </label>
          ))}
        </div>

        {erro && <div className={styles.errorBox + ' mt-4'}>❌ {erro}</div>}
        {mensagem && <div className={styles.successBox + ' mt-4'}>{mensagem}</div>}

        <button onClick={handleSubmit} disabled={carregando} className={styles.buttonPrimary(carregando) + ' mt-8'}>
          {carregando ? 'Salvando...' : modoEdicao ? 'Salvar Alterações' : `Cadastrar como ${getTipoChave()}`}
        </button>
      </div>
    </div>
  );
}
