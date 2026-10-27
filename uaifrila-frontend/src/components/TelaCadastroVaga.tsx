import React, { useState, useEffect } from 'react';
import { useTheme, getInputClass, getLabelClass, getCardClass } from '../context/ThemeContext';
import { api } from '../services/api';
import GoogleEnderecoInput from './GoogleEnderecoInput';

type Props = {
  usuario: any;
  onAtualizado?: (u: any) => void;
};

const FUNCOES = ['Garçom','Barman','Cumim','Recepcionista','Cozinheiro','Limpeza','Segurança','Outros'];

export default function TelaCadastroVaga({ usuario }: Props) {
  const { isDark } = useTheme();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enderecoAtivo, setEnderecoAtivo] = useState<any>(null);

  const [form, setForm] = useState({
    funcao: 'Garçom',
    titulo: '',
    descricao: '',
    dataHora: '',
    horas: 8,
    valorHora: 20,
    uber: 15,
    endereco: '',
    bairro: '',
    cidade: 'Uberlândia',
    cidade_id: 1,
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
  });

  useEffect(() => {
    carregarEnderecoAtivo();
  }, []);

  const carregarEnderecoAtivo = async () => {
    try {
      const data = await api.get('/enderecos');
      const lista = data.enderecos || data || [];
      const ativo = lista.find((e: any) => e.is_ativo) || lista[0];
      if (ativo) {
        setEnderecoAtivo(ativo);
        setForm(f => ({
          ...f,
          endereco: ativo.endereco_completo || '',
          bairro: ativo.bairro || 'Centro',
          cidade: ativo.cidade_nome || 'Uberlândia',
          cidade_id: ativo.cidade_id || 1,
          lat: ativo.lat,
          lng: ativo.lng,
        }));
      }
    } catch (e) {
      console.warn('Sem endereco ativo', e);
    }
  };

  const subtotal = form.horas * form.valorHora + form.uber;
  const totalPix = subtotal * 1.10;
  const totalCartao = subtotal * 1.14;

  const validar = () => {
    if (!form.titulo || form.titulo.trim().length < 5) return 'Título mínimo 5 caracteres';
    if (!form.descricao || form.descricao.trim().length < 10) return 'Descrição mínima 10 caracteres';
    if (!form.dataHora) return 'Data e hora obrigatória - só Qui a Dom';
    const data = new Date(form.dataHora);
    const dia = data.getDay();
    if (![0,4,5,6].includes(dia)) return 'Vagas só podem ser Quinta a Domingo';
    if (form.horas < 1 || form.horas > 24) return 'Horas entre 1 e 24';
    if (form.valorHora < 5) return 'Valor hora mínimo R$5';
    if (!form.endereco) return 'Endereço obrigatório';
    return null;
  };

  const publicar = async () => {
    const msgErro = validar();
    if (msgErro) { setErro(msgErro); return; }
    setCarregando(true); setErro(''); setSucesso('');
    try {
      const dataFim = new Date(new Date(form.dataHora).getTime() + form.horas * 3600 * 1000);
      
      const payload = {
        titulo: form.titulo,
        descricao: form.descricao,
        funcao: form.funcao,
        valor_hora: form.valorHora,
        valor: form.valorHora,
        data_inicio: new Date(form.dataHora).toISOString(),
        data_fim: dataFim.toISOString(),
        horas_estimadas: form.horas,
        ajuda_custo_transporte: form.uber,
        ajuda_custo: form.uber,
        endereco_completo: form.endereco,
        bairro: form.bairro || enderecoAtivo?.bairro || 'Centro',
        cidade_nome: form.cidade || 'Uberlândia',
        cidade_id: form.cidade_id || enderecoAtivo?.cidade_id || null,
        endereco_id: enderecoAtivo?.id || null,
        valor_base: form.horas * form.valorHora,
        lat: form.lat,
        lng: form.lng,
      };

      const res = await api.post('/vagas/criar', payload);
      setSucesso(`Vaga #${res.vaga?.id || ''} publicada! Pix R$${totalPix.toFixed(2)} | Cartão R$${totalCartao.toFixed(2)}`);
      setForm(f => ({ ...f, titulo: '', descricao: '', dataHora: '' }));
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  };

  const inputClass = getInputClass(isDark);
  const labelClass = getLabelClass(isDark);
  const cardClass = getCardClass(isDark);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className={cardClass}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Publicar Vaga</h2>
            <p className="text-[10px] font-mono mt-1 opacity-60">Função • Data Qui-Dom • Horas*Valor + Uber + Taxa (10% Pix / 14% Cartão)</p>
          </div>
          <span className="bg-[#FFC700] border-2 border-black px-3 py-1 text-[10px] font-black uppercase shadow-[3px_3px_0px_0px_black]">Uberlândia • MG</span>
        </div>

        {erro && <div className="mb-4 p-3 bg-[#E53935] text-white border-2 border-black text-xs font-bold">❌ {erro}</div>}
        {sucesso && <div className="mb-4 p-3 bg-[#00C853] text-white border-2 border-black text-xs font-bold">✅ {sucesso}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Função *</label>
            <select value={form.funcao} onChange={e => setForm({ ...form, funcao: e.target.value })} className={inputClass}>
              {FUNCOES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Título da vaga *</label>
            <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Garçom sábado noite - Evento formatura" className={inputClass} maxLength={150} />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Data/Hora Início * (Qui-Dom)</label>
            <input type="datetime-local" value={form.dataHora} onChange={e => setForm({ ...form, dataHora: e.target.value })} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Horas estimadas *</label>
            <input type="number" min={1} max={24} value={form.horas} onChange={e => setForm({ ...form, horas: Number(e.target.value) })} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Valor hora líquido freela (R$) *</label>
            <input type="number" min={5} step={1} value={form.valorHora} onChange={e => setForm({ ...form, valorHora: Number(e.target.value) })} className={inputClass} />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Ajuda Uber (R$)</label>
            <select value={form.uber} onChange={e => setForm({ ...form, uber: Number(e.target.value) })} className={inputClass}>
              <option value={10}>R$ 10</option>
              <option value={15}>R$ 15 (padrão)</option>
              <option value={20}>R$ 20</option>
              <option value={30}>R$ 30</option>
              <option value={50}>R$ 50</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Descrição *</label>
            <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Detalhe: local exato, uniforme, o que levar, etc" rows={3} className={`${inputClass} h-auto min-h-[90px]`} maxLength={500} />
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Endereço completo (Google Maps) *</label>
            {/* CORRETO: usa props do seu componente original */}
            <GoogleEnderecoInput
              endereco={form.endereco}
              cidade={form.cidade}
              cidadeId={form.cidade_id}
              lat={form.lat}
              lng={form.lng}
              onChange={(data: any) => {
                // data vem como { endereco, cidade, cidade_id, lat, lng, bairro }
                setForm(f => ({
                  ...f,
                  endereco: data.endereco || f.endereco,
                  cidade: data.cidade || f.cidade,
                  cidade_id: data.cidade_id || data.cidadeId || f.cidade_id,
                  bairro: data.bairro || f.bairro,
                  lat: data.lat ?? f.lat,
                  lng: data.lng ?? f.lng,
                }));
              }}
            />
            {enderecoAtivo && <span className="text-[10px] font-mono opacity-60 mt-1">Endereço ativo: {enderecoAtivo.endereco_completo} • {enderecoAtivo.bairro}</span>}
          </div>
        </div>

        <div className="mt-6 p-4 bg-[#FFC700] border-2 border-black text-black shadow-[4px_4px_0px_0px_black]">
          <p className="text-xs font-black uppercase">Preview financeiro - Cálculo automático</p>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-[12px] font-mono">
            <div>Base: {form.horas}h × R${form.valorHora} = R${(form.horas * form.valorHora).toFixed(2)}</div>
            <div>Uber: R${form.uber.toFixed(2)}</div>
            <div className="font-black">Subtotal: R${subtotal.toFixed(2)}</div>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="bg-white border-2 border-black p-2"><span className="font-black">Freela recebe:</span><br/>R${subtotal.toFixed(2)} líquido</div>
            <div className="bg-black text-white border-2 border-black p-2"><span className="font-black">Contratante Pix (10%):</span><br/>R${totalPix.toFixed(2)} total</div>
            <div className="bg-[#0066FF] text-white border-2 border-black p-2"><span className="font-black">Contratante Cartão (14%):</span><br/>R${totalCartao.toFixed(2)} total</div>
          </div>
          {form.endereco && (
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.endereco + ' Uberlândia MG Brasil')}`} target="_blank" className="text-[#0066FF] font-black underline text-xs mt-3 block">
              📍 {form.endereco} - Ver no mapa
            </a>
          )}
        </div>

        <button onClick={publicar} disabled={carregando} className={`mt-6 w-full py-4 font-black uppercase text-sm border-2 border-black ${isDark ? 'bg-[#0066FF] text-white hover:bg-[#0055DD]' : 'bg-black text-white hover:bg-zinc-800'} ${carregando ? 'opacity-50' : 'shadow-[6px_6px_0px_0px_black] active:translate-x-[2px] active:translate-y-[2px]'}`}>
          {carregando ? 'Publicando...' : `Publicar vaga - Total Pix R$${totalPix.toFixed(2)}`}
        </button>

        <p className="text-[10px] font-mono mt-3 opacity-60">Status: PENDENTE • Mural só PENDENTE • Dual não vê própria vaga • Código início/fim ao aceitar</p>
      </div>
    </div>
  );
}
