import React, { useState, useEffect, useRef } from 'react';

type MeioPagamento = 'pix' | 'cartao';

interface TaxasSistema {
  valor_minimo_vaga: number;
  taxa_pix_percentual: number;
  taxa_cartao_percentual: number;
  comissao_percentual: number;
}

const TAXAS_DEFAULT: TaxasSistema = {
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

function calcularHoras(inicio: string, fim: string): number {
  if (!inicio || !fim) return 0;
  const d1 = new Date(inicio);
  const d2 = new Date(fim);
  const diff = d2.getTime() - d1.getTime();
  if (diff <= 0) return 0;
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
}

function getMinDateTimeLocal(minutos: number): string {
  const agora = new Date();
  agora.setMinutes(agora.getMinutes() + minutos);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${agora.getFullYear()}-${pad(agora.getMonth()+1)}-${pad(agora.getDate())}T${pad(agora.getHours())}:${pad(agora.getMinutes())}`;
}

function utcParaInputLocal(utc: string): string {
  if (!utc) return '';
  try {
    const d = new Date(utc);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ''; }
}

const DateUtil = {
  paraUTC0: (dataLocal: string, timezone: string): string => {
    if (!dataLocal) throw new Error('Data local obrigatoria');
    if (dataLocal.endsWith('Z')) return dataLocal;
    try {
      const [datePart, timePart] = dataLocal.split('T');
      const [y, m, d] = datePart.split('-').map(Number);
      const [h, min] = (timePart || '00:00').split(':').map(v => parseInt(v) || 0);
      const desiredWallUTC = Date.UTC(y, m-1, d, h, min, 0);
      let utcGuess = desiredWallUTC;
      for (let i = 0; i < 10; i++) {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, hourCycle: 'h23'
        });
        const parts = formatter.formatToParts(new Date(utcGuess));
        const map: any = {};
        for (const p of parts) map[p.type] = p.value;
        const tzWallUTC = Date.UTC(Number(map.year), Number(map.month)-1, Number(map.day), Number(map.hour), Number(map.minute), Number(map.second));
        const diff = desiredWallUTC - tzWallUTC;
        if (diff === 0) break;
        utcGuess += diff;
      }
      return new Date(utcGuess).toISOString();
    } catch { return new Date(dataLocal).toISOString(); }
  }
};

export default function TelaCadastroVaga(props: any) {
  const propsSetTelaAtiva = props.setTelaAtiva;
  
  const [form, setForm] = useState({
    funcao: 'Garçom',
    titulo: '',
    descricao: '',
    dataHoraInicio: '',
    dataHoraFim: '',
    valorServicoStr: '75,00',
    valorServicoNum: 75.00,
    ajudaTransporteStr: '15,00',
    ajudaTransporteNum: 15,
    bairro: 'Centro',
    cidade: 'Uberlandia',
    cidade_id: 1,
    endereco: '',
    meioPagamento: 'pix' as MeioPagamento,
    lat: null as any,
    lng: null as any,
  });

  const [taxas, setTaxas] = useState<TaxasSistema>(TAXAS_DEFAULT);
  const [antecedenciaMinutos, setAntecedenciaMinutos] = useState(30);
  const [minDateTime, setMinDateTime] = useState(getMinDateTimeLocal(30));
  const [isEditando, setIsEditando] = useState(false);
  const [vagaEdicao, setVagaEdicao] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enderecoAtivo, setEnderecoAtivo] = useState<any>(null);

  const carregarVariaveisSistema = async () => {
    try {
      const token = localStorage.getItem('uaifrila_token');
      const API = (import.meta as any).env?.VITE_API_URL || 'http://192.168.24.11:3000/api';
      const res = await fetch(`${API}/variaveis`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const vars = data.variaveis || data || [];
        const find = (ch: string) => vars.find((x: any) => x.chave === ch);
        setTaxas({
          valor_minimo_vaga: parseFloat(find('VALOR_MINIMO_VAGA')?.valor_numerico || '75'),
          taxa_pix_percentual: parseFloat(find('TAXA_PIX_PERCENTUAL')?.valor_numerico || '1'),
          taxa_cartao_percentual: parseFloat(find('TAXA_CARTAO_PERCENTUAL')?.valor_numerico || '4'),
          comissao_percentual: parseFloat((find('COMISSAO_APLICATIVO') || find('TAXA_PLATAFORMA_PERCENTUAL'))?.valor_numerico || '10'),
        });
        const ant = find('VAGA_ANTECEDENCIA_MINUTOS');
        if (ant) {
          const min = parseInt(ant.valor_numerico || ant.valor);
          if (min > 0) { setAntecedenciaMinutos(min); setMinDateTime(getMinDateTimeLocal(min)); }
        }
      }
    } catch {}
  };

  const carregarEnderecoAtivo = async () => {
    try {
      const token = localStorage.getItem('uaifrila_token');
      const API = (import.meta as any).env?.VITE_API_URL || 'http://192.168.24.11:3000/api';
      const res = await fetch(`${API}/enderecos`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const lista = data.enderecos || data || [];
        const ativo = lista.find((e: any) => e.is_ativo) || lista[0];
        if (ativo) {
          setEnderecoAtivo(ativo);
          setForm(f => ({ ...f, endereco: ativo.endereco_completo || '', bairro: ativo.bairro || 'Centro', cidade: ativo.cidade_nome || 'Uberlandia', cidade_id: ativo.cidade_id || 1 }));
        }
      }
    } catch {}
  };

  useEffect(() => {
    carregarVariaveisSistema();
    carregarEnderecoAtivo();
    const vagaStr = localStorage.getItem('uaifrila_vaga_editar');
    if (vagaStr) {
      try {
        const vagaLocal = JSON.parse(vagaStr);
        if (vagaLocal?.id) {
          setIsEditando(true);
          setVagaEdicao(vagaLocal);
          const inicioLocal = utcParaInputLocal(vagaLocal.data_inicio);
          const fimLocal = utcParaInputLocal(vagaLocal.data_fim);
          const valorServ = Number(vagaLocal.valor_servico || vagaLocal.valor_hora || 75);
          setForm(f => ({
            ...f,
            funcao: vagaLocal.funcao || 'Garcom',
            titulo: vagaLocal.titulo || '',
            descricao: vagaLocal.descricao || '',
            dataHoraInicio: inicioLocal,
            dataHoraFim: fimLocal,
            valorServicoStr: valorServ.toFixed(2).replace('.', ','),
            valorServicoNum: valorServ,
            ajudaTransporteStr: Number(vagaLocal.ajuda_custo_transporte || 15).toFixed(2).replace('.', ','),
            ajudaTransporteNum: Number(vagaLocal.ajuda_custo_transporte || 15),
            meioPagamento: vagaLocal.meio_pagamento || 'pix',
          }));
        }
      } catch {}
    }
  }, []);

  // CALCULO EXATO CONFORME DEFINICAO DO USUARIO:
  // Valor Servico R$75 + Transporte R$15 = Base R$90
  // Taxa PIX 1% sobre base R$90 = R$0,90 | Comissao 10% sobre base = R$9,00
  // Total contratante paga: R$90,00 (Base)
  // Freela recebe: R$80,10 (Base - taxas)
  const horasCalculadas = calcularHoras(form.dataHoraInicio, form.dataHoraFim);
  const baseCalculo = form.valorServicoNum + form.ajudaTransporteNum; // Base = Servico + Transporte = 90
  const taxaPercent = form.meioPagamento === 'pix' ? taxas.taxa_pix_percentual : taxas.taxa_cartao_percentual;
  const taxaPagamento = baseCalculo * taxaPercent / 100; // 90 * 1% = 0,90
  const comissaoApp = baseCalculo * taxas.comissao_percentual / 100; // 90 * 10% = 9,00
  const totalContratantePaga = baseCalculo; // Total que contratante paga = Base = R$90,00
  const freelaRecebe = baseCalculo - taxaPagamento - comissaoApp; // Freela recebe = Base - taxas = 90 - 0,90 - 9 = 80,10
  const freelaRecebeLiquido = freelaRecebe;
  // CORRIGIDO FINAL: Valor hora = Valor freela / Horas (80,10 / 3h = 26,70)
  const valorHoraBruto = horasCalculadas > 0 ? freelaRecebe / horasCalculadas : 0;

  const validar = () => {
    if (!form.titulo || form.titulo.trim().length < 5) return 'Titulo minimo 5 caracteres';
    if (!form.descricao || form.descricao.trim().length < 10) return 'Descricao minima 10 caracteres';
    if (!form.dataHoraInicio) return 'Horario de entrada obrigatorio';
    if (!form.dataHoraFim) return 'Horario de saida obrigatorio';
    const inicio = new Date(form.dataHoraInicio);
    const fim = new Date(form.dataHoraFim);
    if (!isEditando) {
      const agora = new Date();
      agora.setMinutes(agora.getMinutes() + antecedenciaMinutos);
      if (inicio < agora) return `Entrada deve ser > agora + ${antecedenciaMinutos}min`;
    }
    if (fim <= inicio) return 'Saida deve ser maior que entrada';
    const diffH = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60);
    if (diffH < 0.5) return 'Minimo 30 minutos';
    if (diffH > 24) return 'Maximo 24 horas';
    if (form.valorServicoNum < taxas.valor_minimo_vaga) return `Valor do Servico minimo R$ ${taxas.valor_minimo_vaga.toFixed(2).replace('.', ',')}`;
    return null;
  };

  const publicar = async () => {
    const msgErro = validar();
    if (msgErro) { setErro(msgErro); return; }
    setCarregando(true); setErro(''); setSucesso('');
    try {
      const token = localStorage.getItem('uaifrila_token');
      const API = (import.meta as any).env?.VITE_API_URL || 'http://192.168.24.11:3000/api';
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
      const dataInicioUTC0 = DateUtil.paraUTC0(form.dataHoraInicio, timezone);
      const dataFimUTC0 = DateUtil.paraUTC0(form.dataHoraFim, timezone);
      
      const payload = {
        titulo: form.titulo,
        descricao: form.descricao,
        funcao: form.funcao,
        valor_servico: form.valorServicoNum,
        valor_hora: valorHoraBruto,
        ajuda_custo_transporte: form.ajudaTransporteNum,
        data_inicio: dataInicioUTC0,
        data_fim: dataFimUTC0,
        cidade_nome: form.cidade,
        cidade_id: form.cidade_id,
        bairro: form.bairro,
        endereco_id: enderecoAtivo?.id || null,
        meio_pagamento: form.meioPagamento,
        horas_estimadas: horasCalculadas,
        base_calculo: baseCalculo,
        taxa_pagamento: taxaPagamento,
        comissao_app: comissaoApp,
        total_contratante: totalContratantePaga,
        freela_recebe: freelaRecebe,
      };
      
      const url = isEditando && vagaEdicao?.id ? `${API}/vagas/${vagaEdicao.id}` : `${API}/vagas/criar`;
      const method = isEditando ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao publicar');
      
      setSucesso(isEditando ? `Vaga #${vagaEdicao.id} atualizada!` : `Vaga criada! Total R$ ${totalContratantePaga.toFixed(2)}`);
      localStorage.removeItem('uaifrila_vaga_editar');
      setTimeout(() => { if (propsSetTelaAtiva) propsSetTelaAtiva('trampos'); }, 1200);
    } catch (e: any) {
      setErro(e.message || 'Erro ao publicar vaga');
    } finally { setCarregando(false); }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
      <div className="bg-white border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-2xl font-black uppercase">⚡ {isEditando ? `Editando Vaga #${vagaEdicao?.id}` : 'Nova Vaga'}</h1>

        <div className="space-y-5 mt-6">
          <div>
            <label className="text-xs font-black uppercase">Titulo *</label>
            <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value.slice(0,100) })} placeholder="Ex: Garcom sabado" className="w-full border-2 border-black p-3 font-bold" />
          </div>
          <div>
            <label className="text-xs font-black uppercase">Descricao *</label>
            <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value.slice(0,500) })} rows={4} className="w-full border-2 border-black p-3 font-bold" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase">Funcao</label>
              <select value={form.funcao} onChange={e => setForm({ ...form, funcao: e.target.value })} className="w-full border-2 border-black p-3 font-bold">
                <option>Garcom</option><option>Cozinheiro</option><option>Diarista</option><option>Seguranca</option><option>Recepcionista</option><option>Barman</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-black uppercase">Meio Pagamento *</label>
              <select value={form.meioPagamento} onChange={e => setForm({ ...form, meioPagamento: e.target.value as MeioPagamento })} className="w-full border-2 border-black p-3 font-bold">
                <option value="pix">PIX (taxa {taxas.taxa_pix_percentual}%)</option>
                <option value="cartao">Cartao (taxa {taxas.taxa_cartao_percentual}%)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase">Entrada *</label>
              <input type="datetime-local" value={form.dataHoraInicio} min={minDateTime} onChange={e => setForm({ ...form, dataHoraInicio: e.target.value })} className="w-full border-2 border-black p-3 font-bold" />
            </div>
            <div>
              <label className="text-xs font-black uppercase">Saida *</label>
              <input type="datetime-local" value={form.dataHoraFim} onChange={e => setForm({ ...form, dataHoraFim: e.target.value })} className="w-full border-2 border-black p-3 font-bold" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase">Valor do Servico R$ * (min R$ {taxas.valor_minimo_vaga.toFixed(2).replace('.', ',')})</label>
              <input value={form.valorServicoStr} onChange={e => {
                const formatted = formatarMoedaInput(e.target.value);
                const num = parseMoedaParaNumero(formatted);
                setForm(f => ({ ...f, valorServicoStr: formatted, valorServicoNum: num }));
              }} className="w-full border-2 border-black p-3 font-bold text-lg" />
              <p className="text-[10px] opacity-60 mt-1">Valor pelo servico (min R$ {taxas.valor_minimo_vaga.toFixed(2)})</p>
            </div>
            <div>
              <label className="text-xs font-black uppercase">Ajuda Transporte R$</label>
              <input value={form.ajudaTransporteStr} onChange={e => {
                const formatted = formatarMoedaInput(e.target.value);
                const num = parseMoedaParaNumero(formatted);
                setForm(f => ({ ...f, ajudaTransporteStr: formatted, ajudaTransporteNum: num }));
              }} className="w-full border-2 border-black p-3 font-bold" />
              <p className="text-[10px] opacity-60 mt-1">Taxa calculada sobre: Servico + Transporte</p>
            </div>
          </div>

          {erro && <div className="bg-red-100 border-2 border-red-500 p-3 font-bold text-red-700">{erro}</div>}
          {sucesso && <div className="bg-green-100 border-2 border-green-500 p-3 font-bold text-green-700">{sucesso}</div>}

          <button onClick={publicar} disabled={carregando} className="w-full bg-black text-white border-2 border-black p-3 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50">
            {carregando ? 'Publicando...' : isEditando ? 'Atualizar Vaga' : `Publicar Vaga - Total R$ ${totalContratantePaga.toFixed(2).replace('.', ',')} | Freela R$ ${freelaRecebe.toFixed(2).replace('.', ',')}`}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-[#FFC700] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black uppercase mb-4">💰 Total que Contratante paga</h2>
          <div className="space-y-2 font-bold text-sm">
            <div className="flex justify-between"><span>Horas:</span><span>{horasCalculadas.toFixed(2)}h</span></div>
            <div className="flex justify-between"><span>Valor do Servico:</span><span>R$ {form.valorServicoNum.toFixed(2).replace('.', ',')}</span></div>
            <div className="flex justify-between"><span>+ Ajuda Transporte:</span><span>R$ {form.ajudaTransporteNum.toFixed(2).replace('.', ',')}</span></div>
            <div className="flex justify-between font-black border-t-2 border-black pt-2"><span>Base (Servico + Transporte):</span><span>R$ {baseCalculo.toFixed(2).replace('.', ',')}</span></div>
            <div className="flex justify-between text-[12px] opacity-80"><span>Taxa {form.meioPagamento.toUpperCase()} ({taxaPercent}% sobre base):</span><span>R$ {taxaPagamento.toFixed(2).replace('.', ',')}</span></div>
            <div className="flex justify-between text-[12px] opacity-80"><span>Comissao app ({taxas.comissao_percentual}% sobre base):</span><span>R$ {comissaoApp.toFixed(2).replace('.', ',')}</span></div>
            <div className="border-t-4 border-black pt-3 flex justify-between text-lg bg-black text-white p-2"><span>TOTAL CONTRATANTE PAGA:</span><span>R$ {totalContratantePaga.toFixed(2).replace('.', ',')}</span></div>
            <div className="text-[10px] mt-2 opacity-60">Ex: Servico R$75 + Transporte R$15 = Base R$90 | Taxa PIX 1% R$0,90 + Comissao 10% R$9,00 | Freela recebe R$80,10 | Base = R$ {baseCalculo.toFixed(2)}</div>
          </div>
        </div>

        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black uppercase mb-4">👷 Freela vai receber</h2>
          <div className="space-y-2 font-bold text-sm">
            <div className="flex justify-between bg-black text-white p-2"><span>Valor hora (mural):</span><span>R$ {valorHoraBruto.toFixed(2).replace('.', ',')}/h</span></div>
            <div className="flex justify-between"><span>Valor Servico:</span><span>R$ {form.valorServicoNum.toFixed(2).replace('.', ',')}</span></div>
            <div className="flex justify-between"><span>+ Transporte:</span><span>R$ {form.ajudaTransporteNum.toFixed(2).replace('.', ',')}</span></div>
            <div className="flex justify-between"><span>Base:</span><span>R$ {baseCalculo.toFixed(2).replace('.', ',')}</span></div>
            <div className="border-t-4 border-black pt-3 flex justify-between text-green-700 text-lg"><span>Freela recebe (Base - taxas):</span><span>R$ {freelaRecebe.toFixed(2).replace('.', ',')}</span></div>
            <div className="text-[10px] opacity-60">No mural: valor hora R$ {valorHoraBruto.toFixed(2)} | Base para taxas: Servico + Transporte = R$ {baseCalculo.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
