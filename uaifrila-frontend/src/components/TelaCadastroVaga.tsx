import React, { useState, useEffect, useRef } from 'react';
import { useTheme, getInputClass, getLabelClass, getCardClass } from '../context/ThemeContext';
import { api } from '../services/api';
import GoogleEnderecoInput from './GoogleEnderecoInput';

type Props = { usuario: any; onAtualizado?: (u: any) => void; setTelaAtiva?: (tela: string, params?: any) => void; };

function apenasNumeros(v: string) { return (v || '').replace(/\D/g, ''); }
function formatarMoedaInput(v: string): string {
  const nums = apenasNumeros(v); if (!nums) return '';
  const valorCentavos = parseInt(nums, 10); if (isNaN(valorCentavos)) return '';
  const reais = Math.floor(valorCentavos / 100); const centavos = valorCentavos % 100;
  return `${reais.toLocaleString('pt-BR')},${centavos.toString().padStart(2,'0')}`;
}
function parseMoedaParaNumero(formatted: string): number {
  if (!formatted) return 0; const limpo = formatted.replace(/\./g, '').replace(',', '.'); const n = parseFloat(limpo); return isNaN(n) ? 0 : n;
}
function calcularHoras(inicio: string, fim: string): number {
  if (!inicio || !fim) return 0; const d1 = new Date(inicio); const d2 = new Date(fim);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0; const diffMs = d2.getTime() - d1.getTime(); if (diffMs <= 0) return 0;
  return Math.round((diffMs / (1000*60*60))*100)/100;
}

const getDeviceTimezone = (): string => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'; } catch { return 'America/Sao_Paulo'; }
};

const utcParaInputLocal = (utcStr: string | Date | null | undefined): string => {
  if (!utcStr) return '';
  try {
    const d = utcStr instanceof Date ? utcStr : new Date(String(utcStr));
    if (isNaN(d.getTime())) { const s = String(utcStr); if (s.includes('T')) return s.slice(0,16); return ''; }
    const ano = d.getFullYear(); const mes = String(d.getMonth()+1).padStart(2,'0');
    const dia = String(d.getDate()).padStart(2,'0'); const hora = String(d.getHours()).padStart(2,'0');
    const min = String(d.getMinutes()).padStart(2,'0');
    return `${ano}-${mes}-${dia}T${hora}:${min}`;
  } catch { return ''; }
};

const formatarLocal = (utcStr: string | Date | null | undefined): string => {
  if (!utcStr) return '';
  try { const d = utcStr instanceof Date ? utcStr : new Date(String(utcStr)); if (isNaN(d.getTime())) return String(utcStr); return d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', timeZoneName:'short' }); } catch { return String(utcStr); }
};

const getMinDateTimeLocal = (minutos: number) => {
  const agora = new Date(); agora.setMinutes(agora.getMinutes()+minutos);
  const ano = agora.getFullYear(); const mes = String(agora.getMonth()+1).padStart(2,'0');
  const dia = String(agora.getDate()).padStart(2,'0'); const hora = String(agora.getHours()).padStart(2,'0');
  const min = String(agora.getMinutes()).padStart(2,'0');
  return `${ano}-${mes}-${dia}T${hora}:${min}`;
};
const FUNCOES = ['Garçom','Barman','Cumim','Recepcionista','Cozinheiro','Limpeza','Segurança','Outros'];

export default function TelaCadastroVaga({ usuario, setTelaAtiva: propsSetTelaAtiva }: Props) {
  const { isDark } = useTheme();
  const [carregando, setCarregando] = useState(false); const [erro, setErro] = useState(''); const [sucesso, setSucesso] = useState(''); const [carregandoEdicao, setCarregandoEdicao] = useState(false);
  const [enderecoAtivo, setEnderecoAtivo] = useState<any>(null); const [antecedenciaMinutos, setAntecedenciaMinutos] = useState(30);
  const [vagaEdicao, setVagaEdicao] = useState<any>(null); const [isEditando, setIsEditando] = useState(false);
  const [minDateTime, setMinDateTime] = useState(()=>getMinDateTimeLocal(30));
  const [deviceTimezone] = useState(()=>getDeviceTimezone());

  const [form, setForm] = useState({
    funcao:'Garçom', titulo:'', descricao:'', dataHoraInicio:'', dataHoraFim:'',
    valorHoraStr:'20,00', valorHoraNum:20, ajudaTransporteStr:'15,00', ajudaTransporteNum:15,
    endereco:'', bairro:'', cidade:'Uberlândia', cidade_id:1, lat:undefined as number|undefined, lng:undefined as number|undefined,
  });

  useEffect(()=>{
    carregarEnderecoAtivo(); carregarVariaveisSistema();
    carregarVagaParaEdicao();
    const interval = setInterval(()=>{ setMinDateTime(getMinDateTimeLocal(antecedenciaMinutos)); },60000);
    return ()=>clearInterval(interval);
  },[antecedenciaMinutos]);

  const carregarVagaParaEdicao = async () => {
    const vagaStr = localStorage.getItem('uaifrila_vaga_editar');
    if (!vagaStr) return;
    let vagaLocal: any = null;
    try { vagaLocal = JSON.parse(vagaStr); } catch {}
    if (!vagaLocal?.id) return;
    setIsEditando(true); setCarregandoEdicao(true);
    try {
      let vagaBanco: any = null;
      try { const res = await api.get(`/vagas/${vagaLocal.id}`); vagaBanco = res.vaga || res.data || res; } catch { const res = await api.get('/vagas/minhas-publicadas'); const lista = res.vagas || res || []; vagaBanco = lista.find((v:any) => v.id === vagaLocal.id); }
      const vagaFinal = (vagaBanco && vagaBanco.data_inicio) ? vagaBanco : vagaLocal;
      if (!vagaFinal.data_inicio) throw new Error('Vaga sem data');
      const utcInicio = vagaFinal.data_inicio; const utcFim = vagaFinal.data_fim;
      const localInicio = utcParaInputLocal(utcInicio); const localFim = utcParaInputLocal(utcFim);
      const valorHora = Number(vagaFinal.valor_hora || vagaFinal.valor || 20);
      const ajuda = Number(vagaFinal.ajuda_custo_transporte || vagaFinal.ajuda_transporte || 15);
      setForm(f=>({ ...f, funcao: vagaFinal.funcao || 'Garçom', titulo: vagaFinal.titulo || '', descricao: vagaFinal.descricao || '', dataHoraInicio: localInicio, dataHoraFim: localFim, valorHoraStr: valorHora.toFixed(2).replace('.',','), valorHoraNum: valorHora, ajudaTransporteStr: ajuda.toFixed(2).replace('.',','), ajudaTransporteNum: ajuda, bairro: vagaFinal.bairro || f.bairro, cidade: vagaFinal.cidade_nome || f.cidade, cidade_id: vagaFinal.cidade_id || f.cidade_id, }));
      setVagaEdicao(vagaFinal);
      setSucesso('Vaga ' + vagaFinal.id + ' carregada - ' + deviceTimezone);
    } catch (e:any) { setErro(e.message); } finally { setCarregandoEdicao(false); }
  };

  const carregarVariaveisSistema = async ()=>{ try { const token = localStorage.getItem('uaifrila_token'); const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'; const res = await fetch(`${API}/transacoes/variaveis`, { headers:{ 'Authorization':`Bearer ${token}` } }); if (res.ok) { const data = await res.json(); const vars = data.variaveis || data || []; for (const chave of ['VAGA_ANTECEDENCIA_MINUTOS']) { const v = vars.find((x:any)=>x.chave===chave); if (v) { const minutos = parseInt(v.valor_numerico || v.valor || '30'); if (minutos>0) { setAntecedenciaMinutos(minutos); setMinDateTime(getMinDateTimeLocal(minutos)); return; } } } } } catch {} };
  const carregarEnderecoAtivo = async ()=>{ try { const data = await api.get('/enderecos'); const lista = data.enderecos || data || []; const ativo = lista.find((e:any)=>e.is_ativo) || lista[0]; if (ativo) { setEnderecoAtivo(ativo); setForm(f=>({...f, endereco:ativo.endereco_completo||'', bairro:ativo.bairro||'Centro', cidade:ativo.cidade_nome||'Uberlândia', cidade_id:ativo.cidade_id||1, lat:ativo.lat, lng:ativo.lng})); } } catch {} };

  const handleValorHoraChange = (e:React.ChangeEvent<HTMLInputElement>)=>{ const formatted = formatarMoedaInput(e.target.value); const num = parseMoedaParaNumero(formatted); setForm(f=>({...f, valorHoraStr:formatted, valorHoraNum:num})); };
  const handleAjudaTransporteChange = (e:React.ChangeEvent<HTMLInputElement>)=>{ const formatted = formatarMoedaInput(e.target.value); const num = parseMoedaParaNumero(formatted); setForm(f=>({...f, ajudaTransporteStr:formatted, ajudaTransporteNum:num})); };
  const handleInicioChange = (e:React.ChangeEvent<HTMLInputElement>)=>{ const valor = e.target.value; setErro(''); setForm(f=>({...f, dataHoraInicio:valor})); };
  const handleFimChange = (e:React.ChangeEvent<HTMLInputElement>)=>{ const valor = e.target.value; if (form.dataHoraInicio && valor <= form.dataHoraInicio) { setErro('Saída deve ser maior que entrada'); return; } setErro(''); setForm(f=>({...f, dataHoraFim:valor})); };
  const cancelarEdicao = ()=>{ localStorage.removeItem('uaifrila_vaga_editar'); setVagaEdicao(null); setIsEditando(false); setForm(f=>({...f, titulo:'', descricao:'', dataHoraInicio:'', dataHoraFim:''})); if (propsSetTelaAtiva) propsSetTelaAtiva('trampos'); };

  const horasCalculadas = calcularHoras(form.dataHoraInicio, form.dataHoraFim);
  const validar = ()=>{
    if (!form.titulo || form.titulo.trim().length < 5) return 'Título mínimo 5 caracteres';
    if (!form.descricao || form.descricao.trim().length < 10) return 'Descrição mínima 10 caracteres';
    if (!form.dataHoraInicio) return 'Horário de entrada obrigatório';
    if (!form.dataHoraFim) return 'Horário de saída obrigatório';
    const inicio = new Date(form.dataHoraInicio); const fim = new Date(form.dataHoraFim);
    if (!isEditando) { const agora = new Date(); agora.setMinutes(agora.getMinutes()+antecedenciaMinutos); if (inicio < agora) return 'Entrada deve ser maior que agora + ' + antecedenciaMinutos + 'min'; }
    if (fim <= inicio) return 'Saída deve ser maior que entrada';
    const diffH = (fim.getTime()-inicio.getTime())/(1000*60*60); if (diffH < 0.5) return 'Mínimo 30 minutos'; if (diffH > 24) return 'Máximo 24 horas';
    if (form.valorHoraNum < 5) return 'Valor hora mínimo R$5,00'; if (!form.endereco) return 'Endereço obrigatório'; return null;
  };

  const publicar = async ()=>{
    const msgErro = validar(); if (msgErro) { setErro(msgErro); return; }
    setCarregando(true); setErro(''); setSucesso('');
    try {
      const tz = getDeviceTimezone();
      const payload = { 
        titulo: form.titulo, 
        descricao: form.descricao, 
        funcao: form.funcao, 
        valor_hora: form.valorHoraNum, 
        data_inicio: form.dataHoraInicio,
        data_fim: form.dataHoraFim,
        timezone: tz,
        cidade_nome: form.cidade||'Uberlândia', 
        cidade_id: form.cidade_id||enderecoAtivo?.cidade_id||null, 
        endereco_id: enderecoAtivo?.id||null, 
        bairro: form.bairro||enderecoAtivo?.bairro||'Centro' 
      };
      
      console.log('Enviando', payload);
      
      if (isEditando && vagaEdicao) {
        const res = await api.put('/vagas/' + vagaEdicao.id, payload);
        const novoUTC = res.vaga?.data_inicio || '';
        setSucesso('Atualizada - ' + tz + ' para UTC 0: ' + novoUTC);
        localStorage.removeItem('uaifrila_vaga_editar');
        setTimeout(()=>{ if (propsSetTelaAtiva) propsSetTelaAtiva('trampos'); },1500);
      } else {
        const res = await api.post('/vagas/criar', payload);
        const novoUTC = res.vaga?.data_inicio || '';
        setSucesso('Criada - ' + tz + ' para UTC 0: ' + novoUTC);
        setForm(f=>({...f, titulo:'', descricao:'', dataHoraInicio:'', dataHoraFim:''}));
      }
    } catch (e:any) { setErro(e.message); console.error(e); } finally { setCarregando(false); }
  };

  const inputClass = getInputClass(isDark); const labelClass = getLabelClass(isDark); const cardClass = getCardClass(isDark);
  const buttonPrimaryClass = isDark ? 'w-full h-[52px] bg-[#0066FF] text-white border-2 border-[#0066FF] font-black uppercase text-sm hover:bg-[#0055DD] transition-all' : 'w-full h-[52px] bg-black text-white border-2 border-black font-black uppercase text-sm hover:bg-zinc-800 transition-all';

  return (
    <div className="min-h-screen w-full flex justify-center px-4 py-6">
      <div className="w-full max-w-4xl">
        <div className={cardClass}>
          <div className={'mb-6 border-b-2 pb-4 ' + (isDark?'border-white':'border-black')}>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
                  {isEditando ? 'Editar ' + vagaEdicao?.id + ' - ' + deviceTimezone : 'Publicar - ' + deviceTimezone}
                </h1>
                <p className="text-[11px] font-mono mt-2 opacity-60 uppercase">
                  data inicio e timezone para DateUtil paraUTC0 igual UTC 0
                </p>
              </div>
              {isEditando && (
                <button onClick={cancelarEdicao} className="px-3 py-1 bg-white text-black border-2 border-black text-[10px] font-black uppercase">
                  Cancelar
                </button>
              )}
            </div>
          </div>
          {carregandoEdicao && <div className="mb-6 p-3 bg-[#0066FF] text-white border-2 border-black font-bold text-xs">Buscando UTC 0</div>}
          {erro && <div className="mb-6 p-3 bg-[#E53935] text-white border-2 border-black font-bold text-xs">{erro}</div>}
          {sucesso && <div className="mb-6 p-3 bg-[#00C853] text-white border-2 border-black font-bold text-xs">{sucesso}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2"><label className={labelClass}>Função</label><select value={form.funcao} onChange={e=>setForm({...form, funcao:e.target.value})} className={inputClass}>{FUNCOES.map(f=><option key={f} value={f}>{f}</option>)}</select></div>
            <div className="flex flex-col gap-2"><label className={labelClass}>Título</label><input value={form.titulo} onChange={e=>setForm({...form, titulo:e.target.value})} placeholder="Ex: Garçom para evento" className={inputClass} maxLength={150} /></div>
            <div className="flex flex-col gap-2"><label className={labelClass}>Horário entrada - {deviceTimezone}</label><input type="datetime-local" value={form.dataHoraInicio} onChange={handleInicioChange} className={inputClass} disabled={carregandoEdicao} /><span className="text-[10px] font-mono opacity-50">Envio data inicio mais timezone para paraUTC0</span></div>
            <div className="flex flex-col gap-2"><label className={labelClass}>Horário saída - {deviceTimezone}</label><input type="datetime-local" value={form.dataHoraFim} min={form.dataHoraInicio} onChange={handleFimChange} className={inputClass} disabled={carregandoEdicao} />{horasCalculadas>0&&<span className={'text-[11px] font-black px-2 py-1 border ' + (isDark?'bg-[#0066FF] text-white border-white':'bg-black text-white border-black')}> {horasCalculadas}h </span>}</div>
            <div className="flex flex-col gap-2"><label className={labelClass}>Valor hora R$</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold opacity-60 pointer-events-none">R$</span><input type="text" inputMode="numeric" value={form.valorHoraStr} onChange={handleValorHoraChange} placeholder="20,00" className={inputClass + ' pl-10'} /></div></div>
            <div className="flex flex-col gap-2"><label className={labelClass}>Ajuda transporte R$</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold opacity-60 pointer-events-none">R$</span><input type="text" inputMode="numeric" value={form.ajudaTransporteStr} onChange={handleAjudaTransporteChange} placeholder="15,00" className={inputClass + ' pl-10'} /></div></div>
            <div className="md:col-span-2 flex flex-col gap-2"><label className={labelClass}>Descrição</label><textarea value={form.descricao} onChange={e=>setForm({...form, descricao:e.target.value})} placeholder="Detalhe uniforme, local..." rows={4} className={inputClass + ' min-h-[100px] resize-none py-3'} maxLength={500} /></div>
            <div className="md:col-span-2 flex flex-col gap-2"><label className={labelClass}>Endereço</label><GoogleEnderecoInput endereco={form.endereco} cidade={form.cidade} cidadeId={form.cidade_id} lat={form.lat} lng={form.lng} onChange={(data:any)=>{ setForm(f=>({...f, endereco:data.endereco||f.endereco, cidade:data.cidade||f.cidade, cidade_id:data.cidade_id||data.cidadeId||f.cidade_id, bairro:data.bairro||f.bairro, lat:data.lat??f.lat, lng:data.lng??f.lng})); }} /></div>
          </div>
          <button onClick={publicar} disabled={carregando||carregandoEdicao||horasCalculadas===0} className={'mt-8 ' + buttonPrimaryClass + ' ' + ((carregando||carregandoEdicao||horasCalculadas===0)?'opacity-50':'')}>{carregandoEdicao?'Buscando':carregando?'Convertendo':horasCalculadas===0?'Selecione horarios':isEditando?'Atualizar ' + vagaEdicao?.id:'Publicar - ' + deviceTimezone + ' para UTC0'}</button>
          {isEditando&&(<button onClick={cancelarEdicao} className="mt-3 w-full h-[48px] bg-white text-black border-2 border-black font-black uppercase text-xs">Voltar</button>)}
        </div>
      </div>
    </div>
  );
}
