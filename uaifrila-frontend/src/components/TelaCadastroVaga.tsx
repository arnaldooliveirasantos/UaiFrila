import React, { useState, useEffect } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

type MeioPagamento = 'pix' | 'cartao';

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
function calcularHoras(inicio: string, fim: string): number {
  if (!inicio || !fim) return 0;
  const d1 = new Date(inicio); const d2 = new Date(fim);
  const diff = d2.getTime() - d1.getTime();
  if (diff <= 0) return 0;
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
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
        const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, hourCycle: 'h23' });
        const parts = formatter.formatToParts(new Date(utcGuess));
        const map: any = {}; for (const p of parts) map[p.type] = p.value;
        const tzWallUTC = Date.UTC(Number(map.year), Number(map.month)-1, Number(map.day), Number(map.hour), Number(map.minute), Number(map.second));
        const diff = desiredWallUTC - tzWallUTC; if (diff === 0) break; utcGuess += diff;
      }
      return new Date(utcGuess).toISOString();
    } catch { return new Date(dataLocal).toISOString(); }
  }
};

// ========================================================
// Componente Endereço - Bloco reutilizável
// ========================================================
function BlocoEndereco({ form, setForm, cidades, buscandoCep, setBuscandoCep }: any) {
  const styles = useUaiFrilaStyles();

  const buscarCep = async (cepRaw: string) => {
    const cep = cepRaw.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) throw new Error('CEP não encontrado');
      
      let cidadeId = form.cidade_id;
      const cidadeEncontrada = cidades.find((c: any) => 
        (c.nome?.toLowerCase() === data.localidade.toLowerCase() || 
         c.cidade_nome?.toLowerCase() === data.localidade.toLowerCase()) &&
        (c.estado === data.uf || c.uf === data.uf)
      );
      if (cidadeEncontrada) cidadeId = cidadeEncontrada.id;

      setForm((f: any) => ({
        ...f,
        cep: data.cep || cepRaw,
        enderecoCompleto: data.logradouro || f.enderecoCompleto,
        bairro: data.bairro || f.bairro,
        cidade: data.localidade || f.cidade,
        cidade_id: cidadeId || f.cidade_id,
        estado: data.uf || f.estado,
        complemento: data.complemento || f.complemento,
      }));
    } catch (e: any) {
      console.error('Erro buscar CEP:', e.message);
    } finally {
      setBuscandoCep(false);
    }
  };

  return (
    <div className={styles.cardSmall}>
      <h3 className={styles.typography.h3 + ' mb-1'}>📍 Endereço da Vaga</h3>
      <p className={styles.typography.caption + ' mb-3'}>Preencha o CEP para autocompletar o endereço</p>
      
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
        <div>
          <label className={styles.label}>CEP *</label>
          <input 
            value={form.cep} 
            onChange={e => setForm({ ...form, cep: e.target.value })} 
            onBlur={e => buscarCep(e.target.value)}
            placeholder="38400-000" 
            className={styles.input} 
          />
        </div>
        <div className="flex items-end">
          <button 
            type="button" 
            onClick={() => buscarCep(form.cep)} 
            disabled={buscandoCep}
            className={buscandoCep ? styles.buttonPrimary(true) : styles.buttonWarning}
            style={{ height: '48px' }}
          >
            {buscandoCep ? 'Buscando...' : 'Buscar CEP'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3 mt-3">
        <div>
          <label className={styles.label}>Rua / Avenida *</label>
          <input value={form.enderecoCompleto} onChange={e => setForm({ ...form, enderecoCompleto: e.target.value })} placeholder="Av. Floriano Peixoto" className={styles.input} />
        </div>
        <div>
          <label className={styles.label}>Número</label>
          <input value={form.numero || ''} onChange={e => setForm({ ...form, numero: e.target.value })} placeholder="1000" className={styles.input} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <div>
          <label className={styles.label}>Bairro *</label>
          <input value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })} placeholder="Centro" className={styles.input} />
        </div>
        <div>
          <label className={styles.label}>Complemento</label>
          <input value={form.complemento} onChange={e => setForm({ ...form, complemento: e.target.value })} placeholder="Bloco A, Sala 2" className={styles.input} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3 mt-3">
        <div>
          <label className={styles.label}>Cidade *</label>
          <select value={form.cidade_id} onChange={e => {
            const cidadeId = Number(e.target.value);
            const cidade = cidades.find((c: any) => c.id === cidadeId);
            setForm({ ...form, cidade_id: cidadeId, cidade: cidade?.nome || cidade?.cidade_nome || '', estado: cidade?.estado || cidade?.uf || form.estado });
          }} className={styles.select}>
            {cidades.length > 0 ? cidades.map((c: any) => (
              <option key={c.id} value={c.id}>{c.nome || c.cidade_nome} - {c.estado || c.uf}</option>
            )) : (
              <><option value={1}>Uberlândia - MG</option><option value={2}>Anápolis - GO</option></>
            )}
          </select>
        </div>
        <div>
          <label className={styles.label}>Estado *</label>
          <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className={styles.select}>
            <option value="MG">MG</option><option value="GO">GO</option><option value="SP">SP</option><option value="RJ">RJ</option><option value="DF">DF</option><option value="BA">BA</option><option value="PR">PR</option><option value="RS">RS</option><option value="SC">SC</option><option value="ES">ES</option><option value="MT">MT</option><option value="MS">MS</option>
          </select>
        </div>
      </div>

      <div className="mt-3">
        <div className={styles.badge('default')}>Preview: {form.enderecoCompleto} {form.numero ? `, ${form.numero}` : ''} - {form.bairro}, {form.cidade} - {form.estado} | CEP {form.cep}</div>
      </div>
    </div>
  );
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
    try { const res = await fetch(`${API}/cidades/ativas`); if (res.ok) { const data = await res.json(); setCidades(data.cidades || data || []); } } catch {}
  };

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
          setForm(f => ({
            ...f,
            funcao: vagaLocal.funcao || 'Garçom',
            titulo: vagaLocal.titulo || '', descricao: vagaLocal.descricao || '',
            dataHoraInicio: inicioLocal, dataHoraFim: fimLocal,
            valorServicoStr: valorServ.toFixed(2).replace('.', ','), valorServicoNum: valorServ,
            valorTransporteStr: valorTransp.toFixed(2).replace('.', ','), valorTransporteNum: valorTransp,
            meioPagamento: vagaLocal.meio_pagamento || 'pix',
            enderecoCompleto: vagaLocal.endereco_completo || '', bairro: vagaLocal.bairro || vagaLocal.endereco_bairro || 'Centro',
            cidade: vagaLocal.cidade_nome || vagaLocal.endereco_cidade || 'Uberlândia', cidade_id: vagaLocal.cidade_id || 1,
            estado: vagaLocal.estado || 'MG', cep: vagaLocal.cep || '', complemento: vagaLocal.complemento || '',
            numero: vagaLocal.numero || '', lat: vagaLocal.lat || null, lng: vagaLocal.lng || null,
          }));
        }
      } catch {}
    }
  }, []);

  const horasCalculadas = calcularHoras(form.dataHoraInicio, form.dataHoraFim);
  const baseCalculo = form.valorServicoNum + form.valorTransporteNum;
  const taxaPercent = form.meioPagamento === 'pix' ? taxas.taxa_pix_percentual : taxas.taxa_cartao_percentual;
  const taxaPagamento = baseCalculo * taxaPercent / 100;
  const comissaoApp = baseCalculo * taxas.comissao_percentual / 100;
  const totalContratantePaga = baseCalculo;
  const freelaRecebe = baseCalculo - taxaPagamento - comissaoApp;
  const valorHoraBruto = horasCalculadas > 0 ? freelaRecebe / horasCalculadas : 0;

  const validar = () => {
    if (!form.titulo || form.titulo.trim().length < 5) return 'Titulo minimo 5 caracteres';
    if (!form.descricao || form.descricao.trim().length < 10) return 'Descricao minima 10 caracteres';
    if (!form.dataHoraInicio) return 'Horario de entrada obrigatorio';
    if (!form.dataHoraFim) return 'Horario de saida obrigatorio';
    const inicio = new Date(form.dataHoraInicio); const fim = new Date(form.dataHoraFim);
    if (!isEditando) { const agora = new Date(); agora.setMinutes(agora.getMinutes() + antecedenciaMinutos); if (inicio < agora) return `Entrada deve ser > agora + ${antecedenciaMinutos}min`; }
    if (fim <= inicio) return 'Saida deve ser maior que entrada';
    const diffH = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60); if (diffH < 0.5) return 'Minimo 30 minutos'; if (diffH > 24) return 'Maximo 24 horas';
    if (form.valorServicoNum < taxas.valor_minimo_vaga) return `Valor do Servico minimo R$ ${taxas.valor_minimo_vaga.toFixed(2).replace('.', ',')}`;
    if (!form.enderecoCompleto || form.enderecoCompleto.trim().length < 3) return 'Rua/Avenida obrigatória';
    if (!form.bairro || form.bairro.trim().length < 2) return 'Bairro obrigatório';
    if (!form.cidade || !form.cidade_id) return 'Cidade obrigatória';
    if (!form.cep || form.cep.replace(/\D/g,'').length !== 8) return 'CEP obrigatório com 8 dígitos (ex: 38400-000)';
    return null;
  };

  const publicar = async () => {
    const msgErro = validar(); if (msgErro) { setErro(msgErro); return; }
    setCarregando(true); setErro(''); setSucesso('');
    try {
      const token = localStorage.getItem('uaifrila_token');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
      const dataInicioUTC0 = DateUtil.paraUTC0(form.dataHoraInicio, timezone);
      const dataFimUTC0 = DateUtil.paraUTC0(form.dataHoraFim, timezone);
      
      const enderecoCompletoFinal = `${form.enderecoCompleto}${form.numero ? `, ${form.numero}` : ''}`.trim();
      
      const payload = {
        titulo: form.titulo, descricao: form.descricao, funcao: form.funcao,
        valor_servico: form.valorServicoNum, valor_transporte: form.valorTransporteNum,
        valor_hora: valorHoraBruto,
        data_inicio: dataInicioUTC0, data_fim: dataFimUTC0,
        endereco_completo: enderecoCompletoFinal,
        bairro: form.bairro,
        cidade_id: form.cidade_id, cidade_nome: form.cidade, estado: form.estado,
        cep: form.cep, complemento: form.complemento, numero: form.numero,
        lat: form.lat, lng: form.lng, meio_pagamento: form.meioPagamento,
      };
      
      const url = isEditando && vagaEdicao?.id ? `${API}/vagas/${vagaEdicao.id}` : `${API}/vagas/criar`;
      const method = isEditando ? 'PUT' : 'POST';
      
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data = await res.json(); if (!res.ok) throw new Error(data.erro || 'Erro ao publicar');
      
      setSucesso(isEditando ? `Vaga #${vagaEdicao.id} atualizada com sucesso!` : `Vaga publicada! Valor por hora R$ ${valorHoraBruto.toFixed(2)}`);
      localStorage.removeItem('uaifrila_vaga_editar');
      setTimeout(() => { if (propsSetTelaAtiva) propsSetTelaAtiva('trampos'); }, 1200);
    } catch (e: any) { setErro(e.message || 'Erro ao publicar vaga'); } finally { setCarregando(false); }
  };

  return (
    <div className={styles.pageContainer + ' ' + styles.gridMainSide}>
      <div className={styles.card}>
        <h1 className={styles.typography.h1}>⚡ {isEditando ? `Editando Vaga #${vagaEdicao?.id}` : 'Nova Vaga'}</h1>
        <p className={styles.typography.caption + ' mt-1'}>Preencha os detalhes da vaga e o local de trabalho</p>

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

          {/* BLOCO ENDEREÇO */}
          <BlocoEndereco form={form} setForm={setForm} cidades={cidades} buscandoCep={buscandoCep} setBuscandoCep={setBuscandoCep} />

          <div className={styles.grid2Cols}>
            <div>
              <label className={styles.label}>Valor do Serviço R$ * (min R$ {taxas.valor_minimo_vaga.toFixed(2).replace('.', ',')})</label>
              <input value={form.valorServicoStr} onChange={e => { const formatted = formatarMoedaInput(e.target.value); const num = parseMoedaParaNumero(formatted); setForm(f => ({ ...f, valorServicoStr: formatted, valorServicoNum: num })); }} className={styles.input} />
            </div>
            <div>
              <label className={styles.label}>Valor Transporte R$ *</label>
              <input value={form.valorTransporteStr} onChange={e => { const formatted = formatarMoedaInput(e.target.value); const num = parseMoedaParaNumero(formatted); setForm(f => ({ ...f, valorTransporteStr: formatted, valorTransporteNum: num })); }} className={styles.input} />
              <p className={styles.typography.caption + ' mt-1'}>Base = Serviço + Transporte | Hora = Freela / Horas</p>
            </div>
          </div>

          {erro && <div className={styles.errorBox}>{erro}</div>}
          {sucesso && <div className={styles.successBox}>{sucesso}</div>}

          <button onClick={publicar} disabled={carregando} className={styles.buttonPrimary(carregando)}>
            {carregando ? 'Publicando...' : isEditando ? 'Atualizar Vaga' : `Publicar - Hora R$ ${valorHoraBruto.toFixed(2).replace('.', ',')} | Total R$ ${totalContratantePaga.toFixed(2).replace('.', ',')} | Freela R$ ${freelaRecebe.toFixed(2).replace('.', ',')}`}
          </button>
          <button onClick={() => propsSetTelaAtiva && propsSetTelaAtiva('trampos')} className={styles.buttonGhost}>Cancelar</button>
        </div>
      </div>

      <div className="space-y-6">
        <div className={styles.cardHighlight}>
          <h2 className={styles.typography.h2 + ' mb-4'}>💰 Resumo Financeiro</h2>
          <div className="space-y-2 font-bold text-sm">
            <div className="flex justify-between"><span>Horas:</span><span>{horasCalculadas.toFixed(2)}h</span></div>
            <div className="flex justify-between"><span>Valor do Serviço:</span><span>R$ {form.valorServicoNum.toFixed(2).replace('.', ',')}</span></div>
            <div className="flex justify-between"><span>+ Transporte:</span><span>R$ {form.valorTransporteNum.toFixed(2).replace('.', ',')}</span></div>
            <div className="flex justify-between font-black border-t-2 border-black pt-2"><span>Base:</span><span>R$ {baseCalculo.toFixed(2).replace('.', ',')}</span></div>
            <div className="flex justify-between text-[12px] opacity-80"><span>Taxa {form.meioPagamento.toUpperCase()} ({taxaPercent}%):</span><span>R$ {taxaPagamento.toFixed(2).replace('.', ',')}</span></div>
            <div className="flex justify-between text-[12px] opacity-80"><span>Comissão ({taxas.comissao_percentual}%):</span><span>R$ {comissaoApp.toFixed(2).replace('.', ',')}</span></div>
            <div className="border-t-4 border-black pt-3 flex justify-between text-lg bg-black text-white p-2"><span>TOTAL:</span><span>R$ {totalContratantePaga.toFixed(2).replace('.', ',')}</span></div>
            <div className="flex justify-between items-center">
              <span>Freela:</span>
              <span className={styles.badge('success')}>R$ {freelaRecebe.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between bg-black text-white p-2"><span>Valor/hora:</span><span>R$ {valorHoraBruto.toFixed(2).replace('.', ',')}/h</span></div>
            <div className="mt-3">
              <div className={styles.typography.h3 + ' mb-1'}>Endereço:</div>
              <div className={styles.typography.bodySmall}>{form.enderecoCompleto} {form.numero && `, ${form.numero}`} - {form.bairro}</div>
              <div className={styles.typography.bodySmall}>{form.cidade} - {form.estado} | CEP {form.cep}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
