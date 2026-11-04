import React, { useState, useEffect } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import BlocoEndereco from './BlocoEndereco';

type MeioPagamento = 'pix' | 'cartao';

interface CalculoBackend {
  valor_servico: number;
  valor_transporte: number;
  base_calculo: number;
  horas_estimadas: number;
  valor_hora_bruto: number;
  taxa_pix_percentual: number;
  taxa_cartao_percentual: number;
  comissao_percentual: number;
  taxa_pagamento: number;
  comissao_app: number;
  total_contratante: number;
  freela_recebe_bruto: number;
  freela_recebe_liquido: number;
  valor_hora_liquido: number;
  valor_hora_final: number;
  valor_minimo_valido: boolean;
  mensagem_validacao?: string;
}

const TAXAS_DEFAULT = {
  valor_minimo_vaga: 75.00,
  taxa_pix_percentual: 1.00,
  taxa_cartao_percentual: 4.00,
  comissao_percentual: 10.00,
};

function formatarMoedaInput(valor: string): string {
  const apenasNumeros = valor.replace(/\D/g, '');
  if (!apenasNumeros) return '';
  const num = parseInt(apenasNumeros) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function parseMoedaParaNumero(valor: string): number {
  if (!valor) return 0;
  const limpo = valor.replace(/\./g, '').replace(',', '.');
  return parseFloat(limpo) || 0;
}
function getMinDateTimeLocal(minutos: number): string {
  const agora = new Date(); agora.setMinutes(agora.getMinutes() + minutos);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${agora.getFullYear()}-${pad(agora.getMonth()+1)}-${pad(agora.getDate())}T${pad(agora.getHours())}:${pad(agora.getMinutes())}`;
}
function utcParaInputLocal(utc: string): string {
  if (!utc) return '';
  try {
    const d = new Date(utc); const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ''; }
}

export default function TelaCadastroVaga(props: any) {
  const styles = useUaiFrilaStyles();
  const propsSetTelaAtiva = props.setTelaAtiva;
  const API = (import.meta as any).env?.VITE_API_URL || 'http://192.168.24.11:3000/api';

  const [form, setForm] = useState({
    funcao: 'Garçom', titulo: '', descricao: '',
    dataHoraInicio: '', dataHoraFim: '',
    valorServicoStr: '75,00', valorServicoNum: 75.00,
    valorTransporteStr: '15,00', valorTransporteNum: 15,
    cidade: 'Uberlândia', cidade_id: 1, bairro: 'Centro', enderecoCompleto: '', numero: '', estado: 'MG', cep: '', complemento: '', lat: null as any, lng: null as any,
    meioPagamento: 'pix' as MeioPagamento,
  });

  const [taxas, setTaxas] = useState(TAXAS_DEFAULT);
  const [antecedenciaMinutos, setAntecedenciaMinutos] = useState(30);
  const [minDateTime, setMinDateTime] = useState(getMinDateTimeLocal(30));
  const [isEditando, setIsEditando] = useState(false);
  const [vagaEdicao, setVagaEdicao] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [cidades, setCidades] = useState<any[]>([]);
  const [calculoBackend, setCalculoBackend] = useState<CalculoBackend | null>(null);
  const [calculando, setCalculando] = useState(false);

  const carregarVariaveis = async () => {
    try {
      const token = localStorage.getItem('uaifrila_token');
      const res = await fetch(`${API}/variaveis`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json(); const vars = data.variaveis || data || [];
        const find = (ch: string) => vars.find((x: any) => x.chave === ch);
        setTaxas({
          valor_minimo_vaga: parseFloat(find('VALOR_MINIMO_VAGA')?.valor_numerico || '75'),
          taxa_pix_percentual: parseFloat(find('TAXA_PIX_PERCENTUAL')?.valor_numerico || '1'),
          taxa_cartao_percentual: parseFloat(find('TAXA_CARTAO_PERCENTUAL')?.valor_numerico || '4'),
          comissao_percentual: parseFloat((find('COMISSAO_APLICATIVO') || find('TAXA_PLATAFORMA_PERCENTUAL'))?.valor_numerico || '10'),
        });
        const ant = find('VAGA_ANTECEDENCIA_MINUTOS');
        if (ant) { const min = parseInt(ant.valor_numerico || ant.valor); if (min > 0) { setAntecedenciaMinutos(min); setMinDateTime(getMinDateTimeLocal(min)); } }
      }
    } catch {}
  };
  const carregarCidades = async () => {
    try { const res = await fetch(`${API}/cidades`); if (res.ok) { const data = await res.json(); setCidades(data.cidades || data.data || data || []); } } catch {}
  };

  // NOVO: Calculo 100% backend - chama /api/vagas/calcular
  const recalcularNoBackend = async () => {
    if (!form.dataHoraInicio || !form.dataHoraFim || form.valorServicoNum <= 0) {
      setCalculoBackend(null);
      return;
    }
    setCalculando(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
      const payload = {
        valor_servico: form.valorServicoNum,
        valor_transporte: form.valorTransporteNum,
        data_inicio_local: form.dataHoraInicio,
        data_fim_local: form.dataHoraFim,
        timezone,
        meio_pagamento: form.meioPagamento
      };
      const res = await fetch(`${API}/vagas/calcular`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.calculo) {
        setCalculoBackend(data.calculo);
      } else {
        console.warn('Erro calculo backend', data.erro);
        setCalculoBackend(null);
      }
    } catch (e) {
      console.error('Erro ao calcular', e);
      setCalculoBackend(null);
    } finally {
      setCalculando(false);
    }
  };

  // Recalcula sempre que mudar valores, datas ou meio pagamento
  useEffect(() => {
    const timer = setTimeout(() => recalcularNoBackend(), 500);
    return () => clearTimeout(timer);
  }, [form.valorServicoNum, form.valorTransporteNum, form.dataHoraInicio, form.dataHoraFim, form.meioPagamento]);

  useEffect(() => {
    carregarVariaveis(); carregarCidades();
    const vagaStr = localStorage.getItem('uaifrila_vaga_editar');
    if (vagaStr) {
      try {
        const vagaLocal = JSON.parse(vagaStr);
        if (vagaLocal?.id) {
          setIsEditando(true); setVagaEdicao(vagaLocal);
          const inicioLocal = utcParaInputLocal(vagaLocal.data_inicio);
          const fimLocal = utcParaInputLocal(vagaLocal.data_fim);
          const valorServ = Number(vagaLocal.valor_servico || 75);
          const valorTransp = Number(vagaLocal.valor_transporte || 0);
          let enderecoSemNumero = vagaLocal.endereco || vagaLocal.endereco_completo || '';
          let numeroExtraido = vagaLocal.numero || '';
          setForm(f => ({
            ...f,
            funcao: vagaLocal.funcao || 'Garçom',
            titulo: vagaLocal.titulo || '', descricao: vagaLocal.descricao || '',
            dataHoraInicio: inicioLocal, dataHoraFim: fimLocal,
            valorServicoStr: valorServ.toFixed(2).replace('.', ','), valorServicoNum: valorServ,
            valorTransporteStr: valorTransp.toFixed(2).replace('.', ','), valorTransporteNum: valorTransp,
            meioPagamento: vagaLocal.meio_pagamento || 'pix',
            enderecoCompleto: enderecoSemNumero, 
            bairro: vagaLocal.bairro || 'Centro',
            cidade: vagaLocal.cidade_nome || 'Uberlândia', 
            cidade_id: vagaLocal.cidade_id || 1,
            estado: vagaLocal.estado || 'MG', 
            cep: vagaLocal.cep || '', 
            complemento: vagaLocal.complemento || '',
            numero: numeroExtraido || '', 
            lat: vagaLocal.lat || null, lng: vagaLocal.lng || null,
          }));
        }
      } catch {}
    }
  }, []);

  const validar = () => {
    if (!form.titulo || form.titulo.trim().length < 5) return 'Titulo minimo 5 caracteres';
    if (!form.descricao || form.descricao.trim().length < 10) return 'Descricao minima 10 caracteres';
    if (!form.dataHoraInicio) return 'Horario de entrada obrigatorio';
    if (!form.dataHoraFim) return 'Horario de saida obrigatorio';
    const inicio = new Date(form.dataHoraInicio); const fim = new Date(form.dataHoraFim);
    if (!isEditando) { const agora = new Date(); agora.setMinutes(agora.getMinutes() + antecedenciaMinutos); if (inicio < agora) return `Entrada deve ser > agora + ${antecedenciaMinutos}min`; }
    if (fim <= inicio) return 'Saida deve ser maior que entrada';
    const diffH = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60); if (diffH < 0.5) return 'Minimo 30 minutos'; if (diffH > 24) return 'Maximo 24 horas';
    if (calculoBackend && !calculoBackend.valor_minimo_valido) return calculoBackend.mensagem_validacao || `Valor mínimo R$ ${taxas.valor_minimo_vaga.toFixed(2)}`;
    if (!form.enderecoCompleto || form.enderecoCompleto.trim().length < 3) return 'Rua/Avenida obrigatória';
    if (!form.bairro || form.bairro.trim().length < 2) return 'Bairro obrigatório';
    if (!form.cidade || !form.cidade_id) return 'Cidade obrigatória';
    if (!form.cep || form.cep.replace(/\D/g,'').length !== 8) return 'CEP obrigatório com 8 dígitos';
    return null;
  };

  const publicar = async () => {
    const msgErro = validar(); if (msgErro) { setErro(msgErro); return; }
    setCarregando(true); setErro(''); setSucesso('');
    try {
      const token = localStorage.getItem('uaifrila_token');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
      
      // Payload novo: envia LOCAL + timezone, backend calcula tudo e salva campos existentes no banco
      const payload = {
        titulo: form.titulo, descricao: form.descricao, funcao: form.funcao,
        valor_servico: form.valorServicoNum, 
        valor_transporte: form.valorTransporteNum,
        data_inicio_local: form.dataHoraInicio,
        data_fim_local: form.dataHoraFim,
        timezone,
        meio_pagamento: form.meioPagamento,
        endereco: form.enderecoCompleto,
        bairro: form.bairro,
        cidade_id: form.cidade_id,
        cep: form.cep,
        numero: form.numero,
        complemento: form.complemento,
        lat: form.lat, lng: form.lng,
      };
      
      const url = isEditando && vagaEdicao?.id ? `${API}/vagas/${vagaEdicao.id}` : `${API}/vagas/criar`;
      const method = isEditando ? 'PUT' : 'POST';
      
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await res.json(); if (!res.ok) throw new Error(data.erro || 'Erro ao publicar');
      
      setSucesso(isEditando ? `Vaga #${vagaEdicao.id} atualizada!` : `Vaga publicada! ${data.calculo ? `Freela recebe R$ ${data.calculo.freela_recebe_liquido.toFixed(2)} (R$ ${data.calculo.valor_hora_final.toFixed(2)}/h)` : ''}`);
      localStorage.removeItem('uaifrila_vaga_editar');
      setTimeout(() => { if (propsSetTelaAtiva) propsSetTelaAtiva('trampos'); }, 1500);
    } catch (e: any) { setErro(e.message || 'Erro ao publicar vaga'); } finally { setCarregando(false); }
  };

  return (
    <div className={styles.pageContainer + ' ' + styles.gridMainSide}>
      <div className={styles.card}>
        <h1 className={styles.typography.h1}>⚡ {isEditando ? `Editando Vaga #${vagaEdicao?.id}` : 'Nova Vaga'} {calculando ? '(calculando...)' : ''}</h1>
        <p className={styles.typography.caption + ' mt-1'}>Cálculo feito no backend - taxas sempre atualizadas</p>

        <div className="space-y-5 mt-6">
          <div>
            <label className={styles.label}>Titulo *</label>
            <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value.slice(0,100) })} placeholder="Ex: Garçom sábado - Evento no Centro" className={styles.input} />
          </div>
          <div>
            <label className={styles.label}>Descricao *</label>
            <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value.slice(0,500) })} rows={4} placeholder="Descreva o trabalho, uniforme, horário de chegada..." className={styles.textarea} />
          </div>
          <div className={styles.grid2Cols}>
            <div>
              <label className={styles.label}>Funcao</label>
              <select value={form.funcao} onChange={e => setForm({ ...form, funcao: e.target.value })} className={styles.select}><option>Garçom</option><option>Cozinheiro</option><option>Diarista</option><option>Segurança</option><option>Recepcionista</option><option>Barman</option><option>Cumim</option><option>Copeira</option></select>
            </div>
            <div>
              <label className={styles.label}>Meio Pagamento *</label>
              <select value={form.meioPagamento} onChange={e => setForm({ ...form, meioPagamento: e.target.value as MeioPagamento })} className={styles.select}><option value="pix">PIX (taxa {taxas.taxa_pix_percentual}%)</option><option value="cartao">Cartão (taxa {taxas.taxa_cartao_percentual}%)</option></select>
            </div>
          </div>
          <div className={styles.grid2Cols}>
            <div>
              <label className={styles.label}>Entrada *</label>
              <input type="datetime-local" value={form.dataHoraInicio} min={minDateTime} onChange={e => setForm({ ...form, dataHoraInicio: e.target.value })} className={styles.input} />
            </div>
            <div>
              <label className={styles.label}>Saida *</label>
              <input type="datetime-local" value={form.dataHoraFim} onChange={e => setForm({ ...form, dataHoraFim: e.target.value })} className={styles.input} />
            </div>
          </div>

          <BlocoEndereco form={form} setForm={setForm} cidades={cidades} buscandoCep={buscandoCep} setBuscandoCep={setBuscandoCep} titulo="📍 Endereço da Vaga" subtitulo="Preencha o CEP para autocompletar o endereço" />

          <div className={styles.grid2Cols}>
            <div>
              <label className={styles.label}>Valor Serviço R$ *</label>
              <input value={form.valorServicoStr} onChange={e => { const f = formatarMoedaInput(e.target.value); setForm({ ...form, valorServicoStr: f, valorServicoNum: parseMoedaParaNumero(f) }); }} className={styles.input} />
            </div>
            <div>
              <label className={styles.label}>Ajuda Transporte R$</label>
              <input value={form.valorTransporteStr} onChange={e => { const f = formatarMoedaInput(e.target.value); setForm({ ...form, valorTransporteStr: f, valorTransporteNum: parseMoedaParaNumero(f) }); }} className={styles.input} />
            </div>
          </div>

          {/* BLOCO DE CALCULO VINDO DO BACKEND */}
          {calculoBackend && (
            <div className="bg-yellow-50 border-4 border-black p-4 mt-4">
              <h3 className="font-black text-sm uppercase">💰 Cálculo Backend (fonte da verdade)</h3>
              <div className="grid grid-cols-2 gap-2 text-xs mt-2 font-bold">
                <div>Base: R$ {calculoBackend.base_calculo.toFixed(2)}</div>
                <div>Horas: {calculoBackend.horas_estimadas}h</div>
                <div>Taxa {form.meioPagamento}: R$ {calculoBackend.taxa_pagamento.toFixed(2)} ({form.meioPagamento === 'pix' ? taxas.taxa_pix_percentual : taxas.taxa_cartao_percentual}%)</div>
                <div>Comissão {taxas.comissao_percentual}%: R$ {calculoBackend.comissao_app.toFixed(2)}</div>
                <div className="col-span-2 bg-black text-white p-2 mt-1">Freela recebe BRUTO: R$ {calculoBackend.freela_recebe_bruto.toFixed(2)} | LÍQUIDO: R$ {calculoBackend.freela_recebe_liquido.toFixed(2)} | R$ {calculoBackend.valor_hora_final.toFixed(2)}/h líquido</div>
                <div className="col-span-2">Total contratante paga: R$ {calculoBackend.total_contratante.toFixed(2)}</div>
              </div>
              {!calculoBackend.valor_minimo_valido && <div className="bg-red-500 text-white p-2 text-xs font-black mt-2">{calculoBackend.mensagem_validacao}</div>}
            </div>
          )}

          {erro && <div className="bg-red-100 border-2 border-red-500 p-3 text-xs font-bold text-red-800">{erro}</div>}
          {sucesso && <div className="bg-green-100 border-2 border-green-500 p-3 text-xs font-bold text-green-800">{sucesso}</div>}

          <button onClick={publicar} disabled={carregando} className={styles.buttonPrimary + ' w-full ' + (carregando ? 'opacity-50' : '')}>
            {carregando ? 'Publicando...' : isEditando ? 'Atualizar Vaga' : 'Publicar Vaga - Cálculo Backend'}
          </button>
        </div>
      </div>
    </div>
  );
}
