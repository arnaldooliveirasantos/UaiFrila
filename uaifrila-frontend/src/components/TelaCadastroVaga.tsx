import React, { useState, useEffect } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import BlocoEndereco from './BlocoEndereco';
import TelaAgendaVaga, { Turno } from './TelaAgendaVaga';
import { apiFetch, apiGetPublic } from '../utils/Api';

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

  const [form, setForm] = useState({
    funcaoId: null as number | null, titulo: '', descricao: '',
    dataHoraInicio: '', dataHoraFim: '',
    valorServicoStr: '75,00', valorServicoNum: 75.00,
    valorTransporteStr: '15,00', valorTransporteNum: 15,
    enderecoId: null as number | null,
    enderecoAtivo: null as any,
    meioPagamento: 'pix' as MeioPagamento,
    // Fases 1 e 3: quantas pessoas a vaga precisa + até quando dá para se candidatar.
    quantidadeVagas: 1,
    dataLimiteCandidatura: '',
  });

  const [taxas, setTaxas] = useState(TAXAS_DEFAULT);
  const [antecedenciaMinutos, setAntecedenciaMinutos] = useState(30);
  const [minDateTime, setMinDateTime] = useState(getMinDateTimeLocal(30));
  const [isEditando, setIsEditando] = useState(false);
  const [vagaEdicao, setVagaEdicao] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [calculoBackend, setCalculoBackend] = useState<CalculoBackend | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [carregandoEnderecoAtivo, setCarregandoEnderecoAtivo] = useState(true);
  const [funcoes, setFuncoes] = useState<any[]>([]);
  const [mostrarAgenda, setMostrarAgenda] = useState(false);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [carregandoFuncoes, setCarregandoFuncoes] = useState(true);
  // Fase 3: templates de vaga (GET /api/vaga-templates, seeds na migration 05).
  const [templates, setTemplates] = useState<any[]>([]);
  const carregarTemplates = async () => {
    try { const d: any = await apiFetch('/api/vaga-templates'); const lista = d?.data || d || []; setTemplates(Array.isArray(lista) ? lista : []); } catch {}
  };
  const aplicarTemplate = (id: string) => {
    const tpl = templates.find((x: any) => String(x.id) === String(id));
    if (!tpl) return;
    setForm((f) => ({ ...f, funcaoId: Number(tpl.funcao_id) || f.funcaoId, titulo: tpl.titulo || f.titulo, descricao: tpl.descricao || f.descricao }));
    setSucesso(`Template "${tpl.nome}" aplicado. Defina os dias e turnos e publique.`);
  };

  // Funcoes: fonte unica GET /api/funcoes (publica). Sem lista fixa no front.
  // Retorna a lista para o modo edicao resolver funcao_id a partir do nome antigo.
  const carregarFuncoes = async (): Promise<any[]> => {
    setCarregandoFuncoes(true);
    try {
      const data = await apiGetPublic('/api/funcoes');
      const lista = (data.funcoes || data.data || data || []).filter((f: any) => f.ativa !== false && f.ativo !== false);
      setFuncoes(lista);
      if (lista.length && !form.funcaoId) setForm(f => ({ ...f, funcaoId: f.funcaoId ?? lista[0].id }));
      return lista;
    } catch (e: any) {
      setErro('Nao foi possivel carregar as funcoes. Tente recarregar a pagina.');
      return [];
    } finally { setCarregandoFuncoes(false); }
  };

  const carregarVariaveis = async () => {
    try {
      const data = await apiFetch('/api/variaveis');
      const vars = data.variaveis || data.data || data || [];
      const find = (ch: string) => vars.find((x: any) => x.chave === ch);
      setTaxas({
        valor_minimo_vaga: parseFloat(find('VALOR_MINIMO_VAGA')?.valor_numerico || '75'),
        taxa_pix_percentual: parseFloat(find('TAXA_PIX_PERCENTUAL')?.valor_numerico || '1'),
        taxa_cartao_percentual: parseFloat(find('TAXA_CARTAO_PERCENTUAL')?.valor_numerico || '4'),
        comissao_percentual: parseFloat((find('COMISSAO_APLICATIVO') || find('TAXA_PLATAFORMA_PERCENTUAL'))?.valor_numerico || '10'),
      });
      const ant = find('VAGA_ANTECEDENCIA_MINUTOS');
      if (ant) { const min = parseInt(ant.valor_numerico || ant.valor); if (min > 0) { setAntecedenciaMinutos(min); setMinDateTime(getMinDateTimeLocal(min)); } }
    } catch {}
  };

  const carregarEnderecoAtivoAutomatico = async () => {
    setCarregandoEnderecoAtivo(true);
    try {
      // Tenta buscar ativo - o backend já retorna o primeiro ativo ou primeiro da lista
      let data: any = null;
      try {
        data = await apiFetch('/api/enderecos/ativo');
      } catch {
        try {
          data = await apiFetch('/api/enderecos/meus');
        } catch {
          data = null;
        }
      }

      let end: any = null;
      if (data) {
        if (data.data) {
          end = Array.isArray(data.data) ? data.data[0] : data.data;
        } else if (data.endereco) {
          end = data.endereco;
        } else if (Array.isArray(data)) {
          end = data[0] || null;
        } else {
          end = data;
        }
        // Se veio array de enderecos/meus, pega ativo ou primeiro
        if (Array.isArray(end)) {
          end = end.find((e: any) => e.ativo) || end[0] || null;
        } else if (data.enderecos && Array.isArray(data.enderecos)) {
          end = data.enderecos.find((e: any) => e.ativo) || data.enderecos[0] || null;
        }
      }

      if (end?.id) {
        console.log('[TelaCadastroVaga] Endereço ativo auto-selecionado:', end);
        setForm(f => ({ ...f, enderecoId: end.id, enderecoAtivo: end }));
      }
    } catch (e: any) {
      console.warn('[TelaCadastroVaga] Sem endereco ativo', e.message);
    } finally {
      setCarregandoEnderecoAtivo(false);
    }
  };

  // Agenda e a fonte unica de dias/turnos/valor: Valor do Servico = soma dos turnos,
  // Entrada = inicio do 1o turno, Saida = fim do ultimo turno (+1 dia se atravessa meia-noite).
  const turnosOrdenados = [...turnos].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : a.hora_inicio < b.hora_inicio ? -1 : 1));
  const valorTotalTurnos = turnosOrdenados.reduce((s, x) => s + (Number(x.valor_servico) || 0), 0);
  const inicioWall = turnosOrdenados.length ? `${turnosOrdenados[0].data}T${turnosOrdenados[0].hora_inicio}` : '';
  const fimWall = (() => {
    if (!turnosOrdenados.length) return '';
    const u = turnosOrdenados[turnosOrdenados.length - 1];
    let d = u.data;
    if (u.hora_fim <= u.hora_inicio) { const dt = new Date(`${d}T00:00:00Z`); dt.setUTCDate(dt.getUTCDate() + 1); d = dt.toISOString().slice(0, 10); }
    return `${d}T${u.hora_fim}`;
  })();

  const recalcularNoBackend = async () => {
    if (!inicioWall || !fimWall || valorTotalTurnos <= 0) {
      setCalculoBackend(null);
      return;
    }
    setCalculando(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
      const payload = {
        valor_servico: valorTotalTurnos,
        valor_transporte: turnos.reduce((s: number, x: any) => s + Number(x.valor_transporte || 0), 0),
        data_inicio_local: inicioWall,
        data_fim_local: fimWall,
        timezone,
        meio_pagamento: form.meioPagamento
      };
      const data = await apiFetch('/api/vagas/calcular', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (data.calculo) {
        setCalculoBackend(data.calculo);
      }
    } catch (e) {
      console.error('Erro ao calcular', e);
      setCalculoBackend(null);
    } finally {
      setCalculando(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => recalcularNoBackend(), 500);
    return () => clearTimeout(timer);
  }, [valorTotalTurnos, form.valorTransporteNum, inicioWall, fimWall, form.meioPagamento]);

  useEffect(() => {
    const init = async () => {
    carregarVariaveis();
    // Se não está editando, já busca ativo automaticamente
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
          const listaFuncoes = await carregarFuncoes();
          const funcaoIdEdicao = Number(vagaLocal.funcao_id ?? vagaLocal.funcaoId) || listaFuncoes.find((f: any) => String(f.nome).toLowerCase() === String(vagaLocal.funcao || '').toLowerCase())?.id || listaFuncoes[0]?.id || null;
          setForm(f => ({
            ...f,
            funcaoId: funcaoIdEdicao,
            titulo: vagaLocal.titulo || '', descricao: vagaLocal.descricao || '',
            dataHoraInicio: inicioLocal, dataHoraFim: fimLocal,
            valorServicoStr: valorServ.toFixed(2).replace('.', ','), valorServicoNum: valorServ,
            valorTransporteStr: valorTransp.toFixed(2).replace('.', ','), valorTransporteNum: valorTransp,
            meioPagamento: vagaLocal.meio_pagamento || 'pix',
            enderecoId: vagaLocal.endereco_id || null,
            quantidadeVagas: Number(vagaLocal.quantidade_vagas ?? vagaLocal.quantidadeVagas ?? 1) || 1,
            dataLimiteCandidatura: vagaLocal.data_limite_candidatura ? (() => { const d = new Date(vagaLocal.data_limite_candidatura); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; })() : '',
          }));
          // Agenda da edicao: turnos salvos, ou o intervalo unico convertido em 1 turno.
          if (Array.isArray(vagaLocal.turnos) && vagaLocal.turnos.length) {
            setTurnos(vagaLocal.turnos.map((x: any) => ({ data: String(x.data).slice(0, 10), hora_inicio: String(x.hora_inicio).slice(0, 5), hora_fim: String(x.hora_fim).slice(0, 5), valor_servico: Number(x.valor_servico || 0), valor_transporte: Number(x.valor_transporte ?? x.valorTransporte ?? 0) })));
          } else if (vagaLocal.data_inicio && vagaLocal.data_fim) {
            setTurnos([{ data: inicioLocal.slice(0, 10), hora_inicio: inicioLocal.slice(11, 16), hora_fim: fimLocal.slice(11, 16), valor_servico: valorServ, valor_transporte: Number(vagaLocal.valor_transporte || 0) }]);
          }
          setCarregandoEnderecoAtivo(false);
          return;
        }
      } catch {}
    }
    // Não está editando: carrega funcoes + ativo + templates
    carregarFuncoes();
    carregarTemplates();
    carregarEnderecoAtivoAutomatico();
    };
    init();
  }, []);

  const validar = () => {
    if (!form.funcaoId) return 'Selecione a funcao';
    if (!form.titulo || form.titulo.trim().length < 5) return 'Titulo minimo 5 caracteres';
    if (!form.descricao || form.descricao.trim().length < 10) return 'Descricao minima 10 caracteres';
    if (!turnos.length) return 'Defina os dias e turnos da vaga';
    // Antecedencia: 1o turno tem que comecar depois de agora + antecedencia (só na criacao).
    if (!isEditando && inicioWall) { const agora = new Date(); agora.setMinutes(agora.getMinutes() + antecedenciaMinutos); if (new Date(inicioWall) < agora) return `Entrada deve ser > agora + ${antecedenciaMinutos}min`; }
    if (calculoBackend && !calculoBackend.valor_minimo_valido) return calculoBackend.mensagem_validacao || `Valor mínimo R$ ${taxas.valor_minimo_vaga.toFixed(2)}`;
    if (!Number(form.quantidadeVagas) || Number(form.quantidadeVagas) < 1 || Number(form.quantidadeVagas) > 20) return 'Quantidade de vagas deve ser entre 1 e 20';
    if (form.dataLimiteCandidatura && new Date(form.dataLimiteCandidatura).getTime() < Date.now()) return 'Data limite para candidatar deve ser no futuro';
    if (!form.enderecoId) return 'Selecione um endereço ativo - cadastre um endereço em Perfil se não tiver';
    return null;
  };

  // Sai do modo edicao e volta para vaga nova (limpa a chave e o form).
  // Existe porque o Navbar NAO apaga mais a chave (ver Navbar.tsx): sem este
  // botao, uma edicao abandonada reabriria toda vez que abrisse Publicar.
  const cancelarEdicao = () => {
    localStorage.removeItem('uaifrila_vaga_editar');
    setIsEditando(false); setVagaEdicao(null);
    setTurnos([]); setMostrarAgenda(false);
    setForm({ funcaoId: funcoes[0]?.id ?? null, titulo: '', descricao: '', dataHoraInicio: '', dataHoraFim: '', valorServicoStr: '75,00', valorServicoNum: 75.00, valorTransporteStr: '15,00', valorTransporteNum: 15, enderecoId: null, enderecoAtivo: null, meioPagamento: 'pix', quantidadeVagas: 1, dataLimiteCandidatura: '' });
    setErro(''); setSucesso('');
    carregarEnderecoAtivoAutomatico();
  };

  const publicar = async () => {
    const msgErro = validar(); if (msgErro) { setErro(msgErro); return; }
    setCarregando(true); setErro(''); setSucesso('');
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
      
      const payload = {
        titulo: form.titulo, descricao: form.descricao, funcaoId: Number(form.funcaoId),
        valor_servico: valorTotalTurnos,
        valor_transporte: turnos.reduce((s: number, x: any) => s + Number(x.valor_transporte || 0), 0),
        data_inicio_local: inicioWall,
        data_fim_local: fimWall,
        timezone,
        meio_pagamento: form.meioPagamento,
        quantidade_vagas: Number(form.quantidadeVagas) || 1,
        data_limite_candidatura: form.dataLimiteCandidatura ? new Date(form.dataLimiteCandidatura).toISOString() : null,
        endereco_id: form.enderecoId,
        turnos: turnosOrdenados,
      };
      
      const url = isEditando && vagaEdicao?.id ? `/api/vagas/${vagaEdicao.id}` : `/api/vagas`;
      const method = isEditando ? 'PUT' : 'POST';
      
      const data = await apiFetch(url, { method, body: JSON.stringify(payload) });
      
      setSucesso(isEditando ? `Vaga #${vagaEdicao.id} atualizada!` : `Vaga publicada! ${data.calculo ? `Freela recebe R$ ${data.calculo.freela_recebe_liquido.toFixed(2)}` : ''}`);
      localStorage.removeItem('uaifrila_vaga_editar');
      setTimeout(() => { if (propsSetTelaAtiva) propsSetTelaAtiva('trampos'); }, 1500);
    } catch (e: any) { setErro(e.message || 'Erro ao publicar vaga'); } finally { setCarregando(false); }
  };

  // Tela SEPARADA de agenda: abre no lugar do formulario e volta com os turnos.
  if (mostrarAgenda) {
    return (<TelaAgendaVaga turnosIniciais={turnos} onConfirmar={(novos: Turno[]) => { setTurnos(novos); setMostrarAgenda(false); }} onCancelar={() => setMostrarAgenda(false)} />);
  }

  return (
    <div className={styles.pageContainer + ' ' + styles.gridMainSide}>
      <div className={styles.card}>
        <h1 className={styles.typography.h1}>⚡ {isEditando ? `Editando Vaga #${vagaEdicao?.id}` : 'Nova Vaga'} {calculando ? '(calculando...)' : ''}</h1>
        {isEditando && (<div className="mt-2"><button onClick={cancelarEdicao} className={styles.buttonSecondary}>✕ Cancelar edição / Nova vaga</button></div>)}
        <p className={styles.typography.caption + ' mt-1'}>Endereço ativo do usuário já vem marcado • Só troca se precisar</p>

        {erro && <div className={`${styles.errorBox} mt-4`}>{erro}</div>}
        {sucesso && <div className={`${styles.successBox} mt-4`}>{sucesso}</div>}

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
              <label className={styles.label}>Funcao *</label>
              <select value={form.funcaoId ?? ''} onChange={e => setForm({ ...form, funcaoId: Number(e.target.value) || null })} disabled={carregandoFuncoes} className={styles.select}>
                <option value="">{carregandoFuncoes ? 'Carregando funcoes...' : 'Selecione a funcao'}</option>
                {funcoes.map((f: any) => (<option key={f.id} value={f.id}>{f.nome}</option>))}
              </select>
            </div>
            <div>
              <label className={styles.label}>Meio Pagamento *</label>
              <select value={form.meioPagamento} onChange={e => setForm({ ...form, meioPagamento: e.target.value as MeioPagamento })} className={styles.select}><option value="pix">PIX (taxa {taxas.taxa_pix_percentual}%)</option><option value="cartao">Cartão (taxa {taxas.taxa_cartao_percentual}%)</option></select>
            </div>
          </div>
          <div>
            <label className={styles.label}>Template de vaga (opcional)</label>
            <select value="" onChange={(e) => aplicarTemplate(e.target.value)} className={styles.select}>
              <option value="">Sem template — preencher do zero</option>
              {templates.map((tpl: any) => (<option key={tpl.id} value={tpl.id}>{tpl.nome} ({tpl.funcao_nome || 'função'})</option>))}
            </select>
            <p className={styles.typography.caption + ' mt-1'}>O template preenche função, título e descrição. Os dias e turnos você define abaixo.</p>
          </div>
          <div className={styles.grid2Cols}>
            <div>
              <label className={styles.label}>Quantas pessoas a vaga precisa? *</label>
              <input type="number" min={1} max={20} value={form.quantidadeVagas} onChange={(e) => setForm({ ...form, quantidadeVagas: Number(e.target.value) })} className={styles.input} />
              <p className={styles.typography.caption + ' mt-1'}>1 = fluxo normal. Mais de 1 = seleção em lote + lista de espera.</p>
            </div>
            <div>
              <label className={styles.label}>Candidaturas até (opcional)</label>
              <input type="datetime-local" value={form.dataLimiteCandidatura} onChange={(e) => setForm({ ...form, dataLimiteCandidatura: e.target.value })} className={styles.input} />
              <p className={styles.typography.caption + ' mt-1'}>Vazio = até o início do primeiro turno.</p>
            </div>
          </div>
          <div>
            <label className={styles.label}>Dias e turnos *</label>
            <div className={styles.cardSmall}>
              {turnos.length ? (
                <>
                  <p className={styles.typography.body + ' font-black'}>{new Set(turnos.map(x => x.data)).size} dia(s) • {turnos.length} turno(s) • Total R$ {valorTotalTurnos.toFixed(2).replace('.', ',')}</p>
                  <p className={styles.typography.caption + ' mt-1'}>{turnosOrdenados.map(x => `${x.data.split('-').reverse().join('/')} ${x.hora_inicio}–${x.hora_fim} (R$ ${Number(x.valor_servico).toFixed(2)})`).join(' • ')}</p>
                </>
              ) : (<p className={styles.typography.bodySmall}>Nenhum dia definido ainda.</p>)}
              <button onClick={() => setMostrarAgenda(true)} className={styles.buttonSecondary + ' mt-2'}>📅 Definir dias e turnos</button>
            </div>
            <p className={styles.typography.caption + ' mt-1'}>A candidatura vale para todos os dias. O valor por turno só é usado no acerto em caso de imprevisto.</p>
          </div>

          <div>
            <label className={styles.label}>Endereço da Vaga * (já vem com seu ativo marcado)</label>
            {carregandoEnderecoAtivo ? (
              <div className={`${styles.cardSmall} animate-pulse`}>
                <p className={styles.typography.bodySmall}>Carregando endereço ativo...</p>
              </div>
            ) : (
              <BlocoEndereco 
                onEnderecoSelecionado={(id: number, end: any) => {
                  setForm(f => ({ ...f, enderecoId: id, enderecoAtivo: end }));
                }}
                modoVaga={true}
              />
            )}
            {form.enderecoAtivo && (
              <div className={`${styles.cardSmall} mt-2 border-green-600 ${styles.isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                <div className="flex justify-between items-center">
                  <p className={styles.typography.body}>✓ Usando: {form.enderecoAtivo.endereco_completo || `${form.enderecoAtivo.logradouro} ${form.enderecoAtivo.numero || ''}`} - {form.enderecoAtivo.bairro}</p>
                  <span className={styles.badge('success')}>Ativo</span>
                </div>
                <p className={styles.typography.caption}>ID: {form.enderecoId} • {form.enderecoAtivo.cidade_nome} / {form.enderecoAtivo.estado_sigla} • CEP {form.enderecoAtivo.cep} • Só troca se clicar em Trocar</p>
              </div>
            )}
            {!form.enderecoId && !carregandoEnderecoAtivo && (
              <div className={`${styles.errorBox} mt-2`}>
                Nenhum endereço ativo encontrado. Vá em Perfil e cadastre um endereço, ou selecione abaixo em Trocar.
              </div>
            )}
          </div>

          <div className={styles.grid2Cols}>
            <div>
              <label className={styles.label}>Valor Serviço R$ * (soma dos turnos)</label>
              <input value={turnos.length ? valorTotalTurnos.toFixed(2).replace('.', ',') : ''} readOnly placeholder="Defina os dias e turnos" className={styles.input} />
            </div>
            <div>
              <label className={styles.label}>Ajuda Transporte R$</label>
                            <p className={styles.typography.bodySmall}>Transporte é por turno — defina em cada turno na agenda. Total: R$ {turnos.reduce((s: number, x: any) => s + Number(x.valor_transporte || 0), 0).toFixed(2)}</p>
            </div>
          </div>

          {calculoBackend && (
            <div className={styles.valorBox}>
              <span>Serviço: R$ {calculoBackend.valor_servico.toFixed(2)}</span>
              <span>Transporte: R$ {calculoBackend.valor_transporte.toFixed(2)}</span>
              <span>Taxa: R$ {calculoBackend.taxa_pagamento.toFixed(2)}</span>
              <span>Freela recebe: R$ {calculoBackend.freela_recebe_liquido.toFixed(2)}</span>
            </div>
          )}

          <button onClick={publicar} disabled={carregando || !form.enderecoId || !form.funcaoId} className={styles.buttonPrimary(carregando || !form.enderecoId)}>
            {carregando ? 'Publicando...' : isEditando ? 'Atualizar Vaga' : form.enderecoId ? `Publicar Vaga em ${form.enderecoAtivo?.bairro || form.enderecoAtivo?.cidade_nome || 'endereço ativo'}` : 'Selecione um endereço para publicar'}
          </button>
        </div>
      </div>
    </div>
  );
}
