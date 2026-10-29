import React, { useState, useEffect } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import ValidacaoCodigo from './ValidacaoCodigo';
import GoogleEnderecoInput from './GoogleEnderecoInput';

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
  const API = import.meta.env.VITE_API_URL;
  if (!API) throw new Error('VITE_API_URL não definida no .env - configure no arquivo .env');

  const getTipoChave = () => {
    if (queroTrampar && queroContratar) return 'DUAL';
    if (queroContratar) return 'CONTRATANTE';
    return 'FREELA';
  };

  const isFreela = queroTrampar;
  const isContratante = queroContratar;

  useEffect(() => {
    const tipo = localStorage.getItem('uaifrila_tipo_cadastro');
    if (tipo === 'CONTRATANTE') {
      setQueroTrampar(false);
      setQueroContratar(true);
    }
  }, []);

  useEffect(() => {
    if (modoEdicao && usuarioProp) {
      const t = usuarioProp.tipo_chave || 'FREELA';
      if (t === 'DUAL') { setQueroTrampar(true); setQueroContratar(true); }
      else if (t === 'CONTRATANTE') { setQueroTrampar(false); setQueroContratar(true); }
      else { setQueroTrampar(true); setQueroContratar(false); }
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
        ajudaUber: usuarioProp.ajuda_uber || 10,
        termos: [true, true, true, true, true],
        temMei: usuarioProp.tem_mei || false
      });
    }
  }, [modoEdicao, usuarioProp]);

  const handleSubmit = async () => {
    setErro(''); setMensagem('');
    if (!form.nome || !form.cpf || !form.email) { setErro('Preencha nome, CPF e e-mail'); return; }
    if (!queroTrampar && !queroContratar) { setErro('Escolha pelo menos uma opção: Quero Trampar ou Quero Contratar'); return; }
    if (!form.termos.every(Boolean)) { setErro('Aceite todos os termos'); return; }
    setCarregando(true);
    try {
      const res = await fetch(`${API}/auth/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome, cpf: form.cpf, email: form.email,
          cnpj: form.cnpj, nomeFantasia: form.nomeFantasia,
          funcao: form.funcao, valorHora: form.valorHora, bio: form.bio,
          bairro: form.bairro, endereco: form.endereco_completo || form.endereco,
          endereco_completo: form.endereco_completo || form.endereco,
          cidade: form.cidade_nome, cidade_nome: form.cidade_nome, cidade_id: form.cidade_id,
          lat: form.endereco_lat || form.lat, lng: form.endereco_lng || form.lng,
          endereco_lat: form.endereco_lat || form.lat, endereco_lng: form.endereco_lng || form.lng,
          tipo_chave: getTipoChave(),
          temMei: form.temMei
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        await res.text();
        throw new Error(`Falha ao comunicar com o servidor. Tente novamente.`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro no cadastro');
      setEtapa('codigo');
    } catch (e: any) { setErro(e.message); }
    finally { setCarregando(false); }
  };

  if (etapa === 'codigo') {
    return <ValidacaoCodigo email={form.email} tipo="cadastro" onValidado={() => { onCadastro?.(); }} onVoltar={() => setEtapa('form')} />;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <h2 className={styles.typography.h1 + ' text-3xl'}>Cadastro</h2>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setQueroTrampar(!queroTrampar)}
            className={`${queroTrampar ? styles.cardHighlight + ' p-6 flex items-center gap-4 text-left' : styles.cardSmall + ' flex items-center gap-4 text-left opacity-70 hover:opacity-100'} transition-all`}
          >
            <span className="text-4xl">💪</span>
            <div>
              <div className="font-black uppercase text-sm">Quero Trampar</div>
              <div className="text-[11px]">Trabalhar como freela</div>
            </div>
            <div className={`ml-auto w-6 h-6 border-2 flex items-center justify-center ${queroTrampar ? 'bg-black border-black text-[#FFC700]' : 'border-current'}`}>
              {queroTrampar && '✓'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setQueroContratar(!queroContratar)}
            className={`${queroContratar ? 'p-6 border-4 bg-[#E53935] text-white border-black flex items-center gap-4 text-left shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' : styles.cardSmall + ' flex items-center gap-4 text-left opacity-70 hover:opacity-100'} transition-all`}
          >
            <span className="text-4xl">🏢</span>
            <div>
              <div className="font-black uppercase text-sm">Quero Contratar</div>
              <div className="text-[11px]">Contratar freelas</div>
            </div>
            <div className={`ml-auto w-6 h-6 border-2 flex items-center justify-center ${queroContratar ? 'bg-black border-black text-white' : 'border-current'}`}>
              {queroContratar && '✓'}
            </div>
          </button>
        </div>

        {queroTrampar && queroContratar && (
          <div className={styles.badge('success') + ' mt-3 block w-fit text-xs p-3 normal-case border-2'}>
            ✨ Você será cadastrado como DUAL - pode trampar e contratar!
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className={styles.label}>Nome completo</label>
            <input value={form.nome} onChange={e=>setForm({...form, nome: e.target.value})} placeholder="Seu nome" className={styles.input} />
          </div>

          <div className="flex flex-col gap-1">
            <label className={styles.label}>CPF {modoEdicao && <span className="text-[8px]">🔒</span>}</label>
            {modoEdicao ? (
              <input value={mascararCPF(form.cpfOriginal)} disabled className={styles.input + ' opacity-60 cursor-not-allowed'} />
            ) : (
              <input value={formatarCPF(form.cpf)} onChange={e=>setForm({...form, cpf: apenasNumeros(e.target.value).slice(0,11)})} placeholder="000.000.000-00" className={styles.input} />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className={styles.label}>E-mail {modoEdicao && <span className="text-[8px]">🔒</span>}</label>
            <input type="email" value={form.email} disabled={modoEdicao} onChange={e=>setForm({...form, email: e.target.value.toLowerCase()})} placeholder="seu@email.com" className={`${styles.input} ${modoEdicao ? 'opacity-60 cursor-not-allowed' : ''} lowercase`} />
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

          {isFreela && (
            <>
              <div className="flex flex-col gap-1">
                <label className={styles.label}>Função</label>
                <select value={form.funcao} onChange={e=>setForm({...form, funcao: e.target.value})} className={styles.select}>
                  {['Garçom','Bartender','Cozinheiro','Auxiliar de Cozinha','Recepcionista','Segurança','Limpeza','Outros'].map(f=><option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className={styles.label}>Valor Hora (R$)</label>
                <input type="number" value={form.valorHora} onChange={e=>setForm({...form, valorHora: Number(e.target.value)})} className={styles.input} />
              </div>
            </>
          )}

          {isContratante && (
            <>
              <div className="flex flex-col gap-1">
                <label className={styles.label}>CNPJ (opcional)</label>
                <input value={formatarCNPJ(form.cnpj)} onChange={e=>setForm({...form, cnpj: apenasNumeros(e.target.value).slice(0,14)})} placeholder="00.000.000/0000-00" className={styles.input} />
              </div>
              <div className="flex flex-col gap-1">
                <label className={styles.label}>Nome Fantasia</label>
                <input value={form.nomeFantasia} onChange={e=>setForm({...form, nomeFantasia: e.target.value})} placeholder="Nome Fantasia" className={styles.input} />
              </div>
            </>
          )}
        </div>

        <h3 className={styles.typography.h3 + ' mt-8'}>Termos</h3>
        <div className="mt-3 space-y-2">
          {TERMOS.map((t,i)=>(
            <label key={t.id} className={`${styles.cardSmall} flex gap-3 text-xs cursor-pointer`}>
              <input type="checkbox" checked={form.termos[i]} onChange={e=>{ const nt=[...form.termos]; nt[i]=e.target.checked; setForm({...form, termos: nt}); }} />
              <div><span className="font-black">{t.titulo}</span> <span className="opacity-70">- {t.desc}</span></div>
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
