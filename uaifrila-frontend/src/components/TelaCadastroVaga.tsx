import React, { useState, useEffect, useRef } from 'react';
// import { Zap } removido - sem lucide-react

// Utils DateUtil para UTC0 - exige que todas as consultas da API ao banco o timestamp vem com UTC0
const DateUtil = {
  // Converte data local (device) + timezone para UTC0 com Z
  paraUTC0: (dataLocal: string, timezone: string): string => {
    if (!dataLocal) throw new Error('Data local obrigatória');
    // Se já tem Z, retorna
    if (dataLocal.endsWith('Z')) return dataLocal;
    
    try {
      // Parse "2026-10-27T15:00" como wall time na timezone
      const [datePart, timePart] = dataLocal.split('T');
      const [y, m, d] = datePart.split('-').map(Number);
      const [h, min, sec] = (timePart || '00:00').split(':').map(v => parseInt(v) || 0);
      
      const desiredWallUTC = Date.UTC(y, m-1, d, h, min, sec || 0);
      let utcGuess = desiredWallUTC;
      
      for (let i = 0; i < 10; i++) {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: false,
          hourCycle: 'h23'
        });
        const parts = formatter.formatToParts(new Date(utcGuess));
        const map: any = {};
        for (const p of parts) map[p.type] = p.value;
        const tzWallUTC = Date.UTC(
          Number(map.year), Number(map.month)-1, Number(map.day),
          Number(map.hour), Number(map.minute), Number(map.second)
        );
        const diff = desiredWallUTC - tzWallUTC;
        if (diff === 0) break;
        utcGuess += diff;
      }
      
      const result = new Date(utcGuess).toISOString();
      console.log(`[DateUtil] ${dataLocal} (${timezone}) => ${result} UTC0`);
      return result;
    } catch (e) {
      console.error('[DateUtil] Erro:', e);
      return new Date(dataLocal).toISOString();
    }
  }
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
  return diff / (1000 * 60 * 60);
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

function formatarLocal(utc: string): string {
  if (!utc) return '';
  try {
    const d = new Date(utc);
    return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  } catch { return utc; }
}

export default function TelaCadastroVaga(props: any) {
  const propsSetTelaAtiva = props.setTelaAtiva;
  
  const [form, setForm] = useState({
    funcao: 'Garçom',
    titulo: '',
    descricao: '',
    dataHoraInicio: '',
    dataHoraFim: '',
    valorHoraStr: '20,00',
    valorHoraNum: 20,
    ajudaTransporteStr: '15,00',
    ajudaTransporteNum: 15,
    bairro: 'Centro',
    cidade: 'Uberlândia',
    cidade_id: 1,
    endereco: '',
    lat: null as any,
    lng: null as any,
  });

  const [antecedenciaMinutos, setAntecedenciaMinutos] = useState(30);
  const [minDateTime, setMinDateTime] = useState(getMinDateTimeLocal(30));
  const [isEditando, setIsEditando] = useState(false);
  const [vagaEdicao, setVagaEdicao] = useState<any>(null);
  const [carregandoEdicao, setCarregandoEdicao] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [enderecoAtivo, setEnderecoAtivo] = useState<any>(null);
  const originalUTCRef = useRef<any>(null);

  // Carrega variáveis do sistema - FIX 403: usa fallback se der 403
  const carregarVariaveisSistema = async () => {
    try {
      const token = localStorage.getItem('uaifrila_token');
      const API = (import.meta as any).env?.VITE_API_URL || 'http://192.168.24.11:3000/api';
      
      console.log('[TelaCadastro] Carregando variaveis sistema...');
      
      const res = await fetch(`${API}/transacoes/variaveis`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log('[TelaCadastro] Variaveis carregadas:', data);
        const vars = data.variaveis || data || [];
        for (const chave of ['VAGA_ANTECEDENCIA_MINUTOS', 'PAGAMENTO_ANTECEDENCIA_MINUTOS']) {
          const v = vars.find((x: any) => x.chave === chave);
          if (v) {
            const minutos = parseInt(v.valor_numerico || v.valor || '30');
            if (minutos > 0) {
              setAntecedenciaMinutos(minutos);
              setMinDateTime(getMinDateTimeLocal(minutos));
              return;
            }
          }
        }
      } else if (res.status === 403) {
        console.warn('[TelaCadastro] 403 em /transacoes/variaveis - usando fallback 30min, mas quadro continua visível');
        // Não esconde quadro, usa default
        setAntecedenciaMinutos(30);
        setMinDateTime(getMinDateTimeLocal(30));
      } else {
        console.warn(`[TelaCadastro] Erro ${res.status} em /transacoes/variaveis, usando fallback`);
        setAntecedenciaMinutos(30);
        setMinDateTime(getMinDateTimeLocal(30));
      }
    } catch (e) {
      console.warn('[TelaCadastro] Erro carregar variaveis, usando fallback 30min:', e);
      setAntecedenciaMinutos(30);
      setMinDateTime(getMinDateTimeLocal(30));
    }
  };

  const carregarEnderecoAtivo = async () => {
    try {
      const token = localStorage.getItem('uaifrila_token');
      const API = (import.meta as any).env?.VITE_API_URL || 'http://192.168.24.11:3000/api';
      const res = await fetch(`${API}/enderecos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
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
            lng: ativo.lng
          }));
        }
      }
    } catch {}
  };

  const limparEdicao = () => {
    localStorage.removeItem('uaifrila_vaga_editar');
    originalUTCRef.current = null;
    setVagaEdicao(null);
    setIsEditando(false);
    setForm({
      funcao: 'Garçom',
      titulo: '',
      descricao: '',
      dataHoraInicio: '',
      dataHoraFim: '',
      valorHoraStr: '20,00',
      valorHoraNum: 20,
      ajudaTransporteStr: '15,00',
      ajudaTransporteNum: 15,
      bairro: 'Centro',
      cidade: 'Uberlândia',
      cidade_id: 1,
      endereco: '',
      lat: null as any,
      lng: null as any,
    });
    setErro('');
    setSucesso('Formulário limpo para nova vaga!');
    setTimeout(() => setSucesso(''), 2000);
  };

  useEffect(() => {
    carregarVariaveisSistema();
    carregarEnderecoAtivo();
    
    // FIX: Se props.modo === 'nova' ou props.limparEdicao, limpa localStorage
    if (props.modo === 'nova' || props.limparEdicao) {
      localStorage.removeItem('uaifrila_vaga_editar');
    }
    
    // Verifica se está editando
    const vagaStr = localStorage.getItem('uaifrila_vaga_editar');
    if (vagaStr) {
      try {
        const vagaLocal = JSON.parse(vagaStr);
        if (vagaLocal?.id) {
          setIsEditando(true);
          setVagaEdicao(vagaLocal);
          const inicioLocal = utcParaInputLocal(vagaLocal.data_inicio);
          const fimLocal = utcParaInputLocal(vagaLocal.data_fim);
          originalUTCRef.current = { inicio: vagaLocal.data_inicio, fim: vagaLocal.data_fim, inicioLocal, fimLocal };
          setForm(f => ({
            ...f,
            funcao: vagaLocal.funcao || 'Garçom',
            titulo: vagaLocal.titulo || '',
            descricao: vagaLocal.descricao || '',
            dataHoraInicio: inicioLocal,
            dataHoraFim: fimLocal,
            valorHoraStr: Number(vagaLocal.valor_hora || 20).toFixed(2).replace('.', ','),
            valorHoraNum: Number(vagaLocal.valor_hora || 20),
            ajudaTransporteStr: Number(vagaLocal.ajuda_custo_transporte || 15).toFixed(2).replace('.', ','),
            ajudaTransporteNum: Number(vagaLocal.ajuda_custo_transporte || 15),
            bairro: vagaLocal.bairro || f.bairro,
            cidade: vagaLocal.cidade_nome || f.cidade,
            cidade_id: vagaLocal.cidade_id || f.cidade_id,
          }));
        }
      } catch {}
    }
  }, []);

  const horasCalculadas = calcularHoras(form.dataHoraInicio, form.dataHoraFim);
  const valorTotalHoras = horasCalculadas * form.valorHoraNum;
  const valorTotalPagar = valorTotalHoras + form.ajudaTransporteNum;
  const taxaPlataforma = valorTotalPagar * 0.1; // 10%
  const valorFinal = valorTotalPagar + taxaPlataforma;

  const validar = () => {
    if (!form.titulo || form.titulo.trim().length < 5) return 'Título mínimo 5 caracteres';
    if (!form.descricao || form.descricao.trim().length < 10) return 'Descrição mínima 10 caracteres';
    if (!form.dataHoraInicio) return 'Horário de entrada obrigatório';
    if (!form.dataHoraFim) return 'Horário de saída obrigatório';
    const inicio = new Date(form.dataHoraInicio);
    const fim = new Date(form.dataHoraFim);
    if (!isEditando) {
      const agora = new Date();
      agora.setMinutes(agora.getMinutes() + antecedenciaMinutos);
      if (inicio < agora) return `Entrada deve ser > agora + ${antecedenciaMinutos}min`;
    }
    if (fim <= inicio) return 'Saída deve ser maior que entrada';
    const diffH = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60);
    if (diffH < 0.5) return 'Mínimo 30 minutos';
    if (diffH > 24) return 'Máximo 24 horas';
    if (form.valorHoraNum < 5) return 'Valor hora mínimo R$5,00';
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
      
      // CONVERTE PARA UTC0 - exige que todas as consultas da API ao banco o timestamp vem com UTC0
      const dataInicioUTC0 = DateUtil.paraUTC0(form.dataHoraInicio, timezone);
      const dataFimUTC0 = DateUtil.paraUTC0(form.dataHoraFim, timezone);
      
      console.log(`[Publicar] Local: ${form.dataHoraInicio} (${timezone}) => UTC0: ${dataInicioUTC0}`);
      
      const payload = {
        titulo: form.titulo,
        descricao: form.descricao,
        funcao: form.funcao,
        valor_hora: form.valorHoraNum,
        valor: form.valorHoraNum,
        ajuda_transporte: form.ajudaTransporteNum,
        data_inicio: dataInicioUTC0, // UTC0 com Z
        data_fim: dataFimUTC0, // UTC0 com Z
        timezone: timezone,
        cidade_nome: form.cidade,
        cidade_id: form.cidade_id,
        bairro: form.bairro,
        endereco_id: enderecoAtivo?.id || null,
        endereco: form.endereco,
      };
      
      const url = isEditando && vagaEdicao?.id ? `${API}/vagas/${vagaEdicao.id}` : `${API}/vagas/criar`;
      const method = isEditando ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.erro || data.message || 'Erro ao publicar');
      
      setSucesso(isEditando ? `Vaga #${vagaEdicao.id} atualizada! UTC0: ${dataInicioUTC0}` : `Vaga criada! UTC0: ${dataInicioUTC0}`);
      localStorage.removeItem('uaifrila_vaga_editar');
      setTimeout(() => {
        if (propsSetTelaAtiva) propsSetTelaAtiva('minhas-publicadas');
      }, 1500);
      
    } catch (e: any) {
      console.error('[Publicar] Erro:', e);
      setErro(e.message || 'Erro ao publicar vaga');
    } finally {
      setCarregando(false);
    }
  };

  const cancelarEdicao = () => {
    localStorage.removeItem('uaifrila_vaga_editar');
    originalUTCRef.current = null;
    setVagaEdicao(null);
    setIsEditando(false);
    setForm(f => ({ ...f, titulo: '', descricao: '', dataHoraInicio: '', dataHoraFim: '' }));
    if (propsSetTelaAtiva) propsSetTelaAtiva('trampos');
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
      {/* FORM */}
      <div className="bg-white border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black uppercase flex items-center gap-2">⚡ {isEditando ? `Editando Vaga #${vagaEdicao?.id}` : 'Nova Vaga'}</h1>
          
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-black uppercase">Título *</label>
            <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value.slice(0,100) })} placeholder="Ex: Garçom sábado - 2 quartos" className="w-full border-2 border-black p-3 font-bold" />
          </div>

          <div>
            <label className="text-xs font-black uppercase">Descrição *</label>
            <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value.slice(0,500) })} rows={4} placeholder="Detalhe serviço, horário, materiais..." className="w-full border-2 border-black p-3 font-bold" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase">Função</label>
              <select value={form.funcao} onChange={e => setForm({ ...form, funcao: e.target.value })} className="w-full border-2 border-black p-3 font-bold">
                <option>Garçom</option><option>Cozinheiro</option><option>Diarista</option><option>Segurança</option><option>Recepcionista</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-black uppercase">Cidade</label>
              <input value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} className="w-full border-2 border-black p-3 font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase">Entrada *</label>
              <input type="datetime-local" value={form.dataHoraInicio} min={minDateTime} onChange={e => setForm({ ...form, dataHoraInicio: e.target.value })} className="w-full border-2 border-black p-3 font-bold" />
              <span className="text-[10px] opacity-60">Mínimo: agora + {antecedenciaMinutos}min | Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
            </div>
            <div>
              <label className="text-xs font-black uppercase">Saída *</label>
              <input type="datetime-local" value={form.dataHoraFim} onChange={e => setForm({ ...form, dataHoraFim: e.target.value })} className="w-full border-2 border-black p-3 font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase">Valor Hora R$ *</label>
              <input value={form.valorHoraStr} onChange={e => {
                const formatted = formatarMoedaInput(e.target.value);
                const num = parseMoedaParaNumero(formatted);
                setForm(f => ({ ...f, valorHoraStr: formatted, valorHoraNum: num }));
              }} className="w-full border-2 border-black p-3 font-bold" />
            </div>
            <div>
              <label className="text-xs font-black uppercase">Ajuda Transporte R$</label>
              <input value={form.ajudaTransporteStr} onChange={e => {
                const formatted = formatarMoedaInput(e.target.value);
                const num = parseMoedaParaNumero(formatted);
                setForm(f => ({ ...f, ajudaTransporteStr: formatted, ajudaTransporteNum: num }));
              }} className="w-full border-2 border-black p-3 font-bold" />
            </div>
          </div>

          {erro && <div className="bg-red-100 border-2 border-red-500 p-3 font-bold text-red-700">{erro}</div>}
          {sucesso && <div className="bg-green-100 border-2 border-green-500 p-3 font-bold text-green-700">{sucesso}</div>}

          <div className="flex gap-3">
            <button onClick={publicar} disabled={carregando} className="flex-1 bg-black text-white border-2 border-black p-3 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50">
              {carregando ? 'Publicando...' : isEditando ? 'Atualizar Vaga' : 'Publicar Vaga'}
            </button>
            {isEditando && (
              <button onClick={cancelarEdicao} className="bg-white text-black border-2 border-black p-3 font-black uppercase">Cancelar</button>
            )}
          </div>
        </div>
      </div>

      {/* QUADRO VALOR A PAGAR - SEMPRE VISÍVEL, mesmo com 403 */}
      <div className="space-y-6">
        <div className="bg-[#FFC700] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl font-black uppercase mb-4">💰 Valor a Pagar</h2>
          
          <div className="space-y-3 font-bold">
            <div className="flex justify-between">
              <span>Horas:</span>
              <span>{horasCalculadas.toFixed(2)}h</span>
            </div>
            <div className="flex justify-between">
              <span>Valor hora:</span>
              <span>R$ {form.valorHoraNum.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal horas:</span>
              <span>R$ {valorTotalHoras.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between">
              <span>Ajuda transporte:</span>
              <span>R$ {form.ajudaTransporteNum.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="border-t-2 border-black pt-2 flex justify-between">
              <span>Subtotal:</span>
              <span>R$ {valorTotalPagar.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between text-sm opacity-70">
              <span>Taxa plataforma (10%):</span>
              <span>R$ {taxaPlataforma.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="border-t-4 border-black pt-3 flex justify-between text-xl">
              <span>TOTAL:</span>
              <span>R$ {valorFinal.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>


        </div>

        <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="font-black uppercase mb-2">📍 Endereço</h3>
          <div className="font-bold text-sm">
            {enderecoAtivo ? (
              <>
                <div>{enderecoAtivo.endereco_completo}</div>
                <div>{form.bairro} - {form.cidade}</div>
              </>
            ) : (
              <div className="opacity-60">Nenhum endereço ativo. Cadastre em Endereços.</div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
}
