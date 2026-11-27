import React, { useState, useEffect } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import { WizardIndicador, WizardNavegacao } from './WizardEtapas';
import { apiFetch, apiGetPublic } from '../utils/Api';
import EtapaVagaDados from './vaga/EtapaVagaDados';
import EtapaVagaAgenda from './vaga/EtapaVagaAgenda';
import EtapaVagaEnderecoValores from './vaga/EtapaVagaEnderecoValores';
import EtapaVagaRevisao from './vaga/EtapaVagaRevisao';
import type { VagaForm, CalculoBackend } from './vaga/Types';
import type { Turno } from './TelaAgendaVaga';

// ORQUESTRADOR da vaga: guarda TODO o estado, valida cada etapa e so
// salva na ultima (POST / PUT /api/vagas). As etapas sao arquivos
// separados em ./vaga/ e so recebem props - nenhuma etapa salva sozinha.
// Etapa 2 e a propria TelaAgendaVaga (ver vaga/EtapaVagaAgenda.tsx).
const TAXAS_DEFAULT = { valor_minimo_vaga: 75.00, comissao_percentual: 10.00 };
function getMinDateTimeLocal(minutos: number): string {
  const agora = new Date(); agora.setMinutes(agora.getMinutes() + minutos);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}T${pad(agora.getHours())}:${pad(agora.getMinutes())}`;
}
function utcParaInputLocal(utc: string): string {
  if (!utc) return '';
  try { const d = new Date(utc); const pad = (n: number) => n.toString().padStart(2, '0'); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; } catch { return ''; }
}

export default function TelaCadastroVaga(props: any) {
  const styles = useUaiFrilaStyles();
  const propsSetTelaAtiva = props.setTelaAtiva;
  const [form, setForm] = useState<VagaForm>({
    funcaoId: null, titulo: '', descricao: '', dataHoraInicio: '', dataHoraFim: '',
    valorServicoStr: '75,00', valorServicoNum: 75.00, valorTransporteStr: '15,00', valorTransporteNum: 15,
    enderecoId: null, enderecoAtivo: null, quantidadeVagas: 1, dataLimiteCandidatura: '',
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
  const [etapa, setEtapa] = useState(0);
  const ETAPAS_VAGA = ['O que é a vaga', 'Dias e turnos', 'Endereço e valores', 'Revisão'];
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [carregandoFuncoes, setCarregandoFuncoes] = useState(true);
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
  const carregarFuncoes = async (): Promise<any[]> => {
    setCarregandoFuncoes(true);
    try {
      const data = await apiGetPublic('/api/funcoes');
      const lista = (data.funcoes || data.data || data || []).filter((f: any) => f.ativa !== false && f.ativo !== false);
      setFuncoes(lista);
      if (lista.length && !form.funcaoId) setForm(f => ({ ...f, funcaoId: f.funcaoId ?? lista[0].id }));
      return lista;
    } catch (e: any) { setErro('Nao foi possivel carregar as funcoes. Tente recarregar a pagina.'); return []; } finally { setCarregandoFuncoes(false); }
  };
  const carregarVariaveis = async () => {
    try {
      const data = await apiFetch('/api/variaveis');
      const vars = data.variaveis || data.data || data || [];
      const find = (ch: string) => vars.find((x: any) => x.chave === ch);
      setTaxas({
        valor_minimo_vaga: parseFloat(find('VALOR_MINIMO_VAGA')?.valor_numerico || '75'),
        comissao_percentual: parseFloat((find('COMISSAO_PLATAFORMA_PERCENTUAL') || find('COMISSAO_APLICATIVO') || find('TAXA_PLATAFORMA_PERCENTUAL'))?.valor_numerico || '10'),
      });
      const ant = find('VAGA_ANTECEDENCIA_MINUTOS');
      if (ant) { const min = parseInt(ant.valor_numerico || ant.valor); if (min > 0) { setAntecedenciaMinutos(min); setMinDateTime(getMinDateTimeLocal(min)); } }
    } catch {}
  };
  // EDICAO: o objeto do mural / detalhe NEM SEMPRE traz endereco_id
  // (buscarPorId devolve so v.*, sem o vinculo). Por isso a edicao resolve
  // o endereco pela fonte certa, nesta ordem:
  // 1) GET /api/enderecos-vaga/vaga/:id -> vinculo ativo -> endereco_id
  // 2) endereco_id que veio no objeto do mural (se houver)
  // 3) GET /api/enderecos/:id -> objeto completo do endereco DA VAGA
  // 4) fallback: GET /api/enderecos/meus -> ativo do usuario (para nao
  //    travar a edicao de uma vaga cujo vinculo foi perdido)
  // Enquanto isso nao termina, carregandoEnderecoAtivo fica true, para a
  // etapa 3 nao mostrar "Nenhum endereço ativo encontrado" antes da hora.
  const carregarDadosEdicaoDaApi = async (vagaId: number, enderecoIdMural: number | null) => {
    setCarregandoEnderecoAtivo(true);
    try {
      const dTurnos: any = await apiFetch(`/api/vagas/${vagaId}/turnos`);
      const lista = dTurnos?.turnos || dTurnos?.data || dTurnos || [];
      if (Array.isArray(lista) && lista.length) {
        setTurnos(lista.map((x: any) => ({ data: String(x.data).slice(0, 10), hora_inicio: String(x.hora_inicio).slice(0, 5), hora_fim: String(x.hora_fim).slice(0, 5), valor_servico: Number(x.valor_servico || 0), valor_transporte: Number(x.valor_transporte || 0) })));
      }
    } catch {}
    let enderecoId = enderecoIdMural;
    if (!enderecoId) {
      try {
        const dVinc: any = await apiFetch(`/api/enderecos-vaga/vaga/${vagaId}`);
        const vinc = dVinc?.data || dVinc?.enderecos || dVinc?.enderecos_vaga || dVinc || [];
        const primeiro = Array.isArray(vinc) ? vinc[0] : vinc;
        enderecoId = Number(primeiro?.endereco_id ?? primeiro?.enderecoId) || null;
      } catch {}
    }
    if (enderecoId) {
      try {
        const dEnd: any = await apiFetch(`/api/enderecos/${enderecoId}`);
        const end = dEnd?.data || dEnd?.endereco || dEnd || null;
        if (end?.id) { setForm((f) => ({ ...f, enderecoId: end.id, enderecoAtivo: end })); return; }
      } catch {}
    }
    // Fallback: nenhum vinculo encontrado - usa o ativo do usuario.
    try {
      let data: any = null;
      try { data = await apiFetch('/api/enderecos/ativo'); } catch { data = await apiFetch('/api/enderecos/meus'); }
      let end: any = null;
      if (data) {
        if (data.data) end = Array.isArray(data.data) ? data.data[0] : data.data;
        else if (data.endereco) end = data.endereco;
        else if (Array.isArray(data)) end = data[0] || null;
        else end = data;
        if (Array.isArray(end)) end = end.find((e: any) => e.ativo) || end[0] || null;
        else if (data.enderecos && Array.isArray(data.enderecos)) end = data.enderecos.find((e: any) => e.ativo) || data.enderecos[0] || null;
      }
      if (end?.id) setForm((f) => ({ ...f, enderecoId: end.id, enderecoAtivo: end }));
    } catch {}
    finally { setCarregandoEnderecoAtivo(false); }
  };
  const carregarEnderecoAtivoAutomatico = async () => {
    setCarregandoEnderecoAtivo(true);
    try {
      let data: any = null;
      try { data = await apiFetch('/api/enderecos/ativo'); } catch { try { data = await apiFetch('/api/enderecos/meus'); } catch { data = null; } }
      let end: any = null;
      if (data) {
        if (data.data) end = Array.isArray(data.data) ? data.data[0] : data.data;
        else if (data.endereco) end = data.endereco;
        else if (Array.isArray(data)) end = data[0] || null;
        else end = data;
        if (Array.isArray(end)) end = end.find((e: any) => e.ativo) || end[0] || null;
        else if (data.enderecos && Array.isArray(data.enderecos)) end = data.enderecos.find((e: any) => e.ativo) || data.enderecos[0] || null;
      }
      if (end?.id) setForm(f => ({ ...f, enderecoId: end.id, enderecoAtivo: end }));
    } catch (e: any) { console.warn('[TelaCadastroVaga] Sem endereco ativo', e.message); } finally { setCarregandoEnderecoAtivo(false); }
  };
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
    if (!inicioWall || !fimWall || valorTotalTurnos <= 0) { setCalculoBackend(null); return; }
    setCalculando(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
      const data = await apiFetch('/api/vagas/calcular', { method: 'POST', body: JSON.stringify({ valor_servico: valorTotalTurnos, valor_transporte: turnos.reduce((s: number, x: any) => s + Number(x.valor_transporte || 0), 0), data_inicio_local: inicioWall, data_fim_local: fimWall, timezone }) });
      if (data.calculo) setCalculoBackend(data.calculo);
    } catch (e) { console.error('Erro ao calcular', e); setCalculoBackend(null); } finally { setCalculando(false); }
  };
  useEffect(() => { const timer = setTimeout(() => recalcularNoBackend(), 500); return () => clearTimeout(timer); }, [valorTotalTurnos, form.valorTransporteNum, inicioWall, fimWall]);
  useEffect(() => {
    const init = async () => {
      carregarVariaveis();
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
            const enderecoIdMural = Number(vagaLocal.endereco_id) || null;
            const enderecoMural = enderecoIdMural ? { id: enderecoIdMural, logradouro: vagaLocal.logradouro || '', numero: vagaLocal.numero || '', bairro: (vagaLocal.endereco_completo || '').split(',')[1]?.trim() || '', cep: vagaLocal.cep || '', cidade_nome: vagaLocal.cidade_nome || '', estado_sigla: vagaLocal.cidade_estado || '', endereco_completo: vagaLocal.endereco_completo || '', latitude: vagaLocal.endereco_latitude ?? null, longitude: vagaLocal.endereco_longitude ?? null } : null;
            setForm(f => ({
              ...f, funcaoId: funcaoIdEdicao, titulo: vagaLocal.titulo || '', descricao: vagaLocal.descricao || '',
              dataHoraInicio: inicioLocal, dataHoraFim: fimLocal,
              valorServicoStr: valorServ.toFixed(2).replace('.', ','), valorServicoNum: valorServ,
              valorTransporteStr: valorTransp.toFixed(2).replace('.', ','), valorTransporteNum: valorTransp,
              enderecoId: enderecoIdMural,
              enderecoAtivo: enderecoMural,
              quantidadeVagas: Number(vagaLocal.quantidade_vagas ?? vagaLocal.quantidadeVagas ?? 1) || 1,
              dataLimiteCandidatura: vagaLocal.data_limite_candidatura ? (() => { const d = new Date(vagaLocal.data_limite_candidatura); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; })() : '',
            }));
            if (Array.isArray(vagaLocal.turnos) && vagaLocal.turnos.length) {
              setTurnos(vagaLocal.turnos.map((x: any) => ({ data: String(x.data).slice(0, 10), hora_inicio: String(x.hora_inicio).slice(0, 5), hora_fim: String(x.hora_fim).slice(0, 5), valor_servico: Number(x.valor_servico || 0) })));
            } else if (vagaLocal.data_inicio && vagaLocal.data_fim) {
              setTurnos([{ data: inicioLocal.slice(0, 10), hora_inicio: inicioLocal.slice(11, 16), hora_fim: fimLocal.slice(11, 16), valor_servico: valorServ }]);
            }
            await carregarDadosEdicaoDaApi(Number(vagaLocal.id), enderecoIdMural);
            return;
          }
        } catch {}
      }
      carregarFuncoes(); carregarTemplates(); carregarEnderecoAtivoAutomatico();
    };
    init();
  }, []);
  const validar = () => {
    if (!form.funcaoId) return 'Selecione a funcao';
    if (!form.titulo || form.titulo.trim().length < 5) return 'Titulo minimo 5 caracteres';
    if (!form.descricao || form.descricao.trim().length < 10) return 'Descricao minima 10 caracteres';
    if (!turnos.length) return 'Defina os dias e turnos da vaga';
    if (!isEditando && inicioWall) { const agora = new Date(); agora.setMinutes(agora.getMinutes() + antecedenciaMinutos); if (new Date(inicioWall) < agora) return `Entrada deve ser > agora + ${antecedenciaMinutos}min`; }
    if (calculoBackend && !calculoBackend.valor_minimo_valido) return calculoBackend.mensagem_validacao || `Valor mínimo R$ ${taxas.valor_minimo_vaga.toFixed(2)}`;
    if (!Number(form.quantidadeVagas) || Number(form.quantidadeVagas) < 1 || Number(form.quantidadeVagas) > 20) return 'Quantidade de vagas deve ser entre 1 e 20';
    if (form.dataLimiteCandidatura && new Date(form.dataLimiteCandidatura).getTime() < Date.now()) return 'Data limite para candidatar deve ser no futuro';
    if (!form.enderecoId) return 'Selecione um endereço ativo - cadastre um endereço em Perfil se não tiver';
    return null;
  };
  const cancelarEdicao = () => {
    localStorage.removeItem('uaifrila_vaga_editar');
    setIsEditando(false); setVagaEdicao(null); setTurnos([]); setEtapa(0);
    setForm({ funcaoId: funcoes[0]?.id ?? null, titulo: '', descricao: '', dataHoraInicio: '', dataHoraFim: '', valorServicoStr: '75,00', valorServicoNum: 75.00, valorTransporteStr: '15,00', valorTransporteNum: 15, enderecoId: null, enderecoAtivo: null, quantidadeVagas: 1, dataLimiteCandidatura: '' });
    setErro(''); setSucesso(''); carregarEnderecoAtivoAutomatico();
  };
  const validarEtapa = (n: number): string | null => {
    if (n === 0) {
      if (!form.funcaoId) return 'Selecione a funcao';
      if (!form.titulo || form.titulo.trim().length < 5) return 'Titulo minimo 5 caracteres';
      if (!form.descricao || form.descricao.trim().length < 10) return 'Descricao minima 10 caracteres';
      if (!Number(form.quantidadeVagas) || Number(form.quantidadeVagas) < 1 || Number(form.quantidadeVagas) > 20) return 'Quantidade de vagas deve ser entre 1 e 20';
      if (form.dataLimiteCandidatura && new Date(form.dataLimiteCandidatura).getTime() < Date.now()) return 'Data limite para candidatar deve ser no futuro';
      return null;
    }
    if (n === 1) {
      if (!turnos.length) return 'Defina os dias e turnos da vaga';
      if (turnos.some((x: any) => !(Number(x.valor_servico) > 0))) return 'Todo turno precisa de valor do serviço maior que R$ 0';
      if (turnos.some((x: any) => !x.data || !x.hora_inicio || !x.hora_fim)) return 'Todo turno precisa de data, início e fim';
      if (!isEditando && inicioWall) { const agora = new Date(); agora.setMinutes(agora.getMinutes() + antecedenciaMinutos); if (new Date(inicioWall) < agora) return `Entrada deve ser > agora + ${antecedenciaMinutos}min`; }
      if (calculoBackend && !calculoBackend.valor_minimo_valido) return calculoBackend.mensagem_validacao || `Valor mínimo R$ ${taxas.valor_minimo_vaga.toFixed(2)}`;
      return null;
    }
    if (n === 2) {
      if (!form.enderecoId) return 'Selecione um endereço ativo - cadastre um endereço em Perfil se não tiver';
      if (valorTotalTurnos <= 0) return 'Valor do serviço deve ser maior que R$ 0 - volte e defina os dias e turnos';
      if (calculoBackend && !calculoBackend.valor_minimo_valido) return calculoBackend.mensagem_validacao || `Valor mínimo R$ ${taxas.valor_minimo_vaga.toFixed(2)}`;
      return null;
    }
    return validar();
  };
  const avancarEtapa = () => { const e = validarEtapa(etapa); if (e) { setErro(e); return; } setErro(''); setEtapa((s) => Math.min(s + 1, 3)); };
  const voltarEtapa = () => { setErro(''); setEtapa((s) => Math.max(s - 1, 0)); };
  const publicar = async () => {
    const msgErro = validar(); if (msgErro) { setErro(msgErro); return; }
    setCarregando(true); setErro(''); setSucesso('');
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
      const payload = {
        titulo: form.titulo, descricao: form.descricao, funcaoId: Number(form.funcaoId),
        valor_servico: valorTotalTurnos,
        valor_transporte: turnos.reduce((s: number, x: any) => s + Number(x.valor_transporte || 0), 0),
        data_inicio_local: inicioWall, data_fim_local: fimWall, timezone,
        quantidade_vagas: Number(form.quantidadeVagas) || 1,
        data_limite_candidatura: form.dataLimiteCandidatura ? new Date(form.dataLimiteCandidatura).toISOString() : null,
        endereco_id: form.enderecoId, turnos: turnosOrdenados,
      };
      const url = isEditando && vagaEdicao?.id ? `/api/vagas/${vagaEdicao.id}` : `/api/vagas`;
      const method = isEditando ? 'PUT' : 'POST';
      const data = await apiFetch(url, { method, body: JSON.stringify(payload) });
      setSucesso(isEditando ? `Vaga #${vagaEdicao.id} atualizada!` : `Vaga publicada! ${data.calculo ? `Freela recebe R$ ${data.calculo.freela_recebe_liquido.toFixed(2)}` : ''}`);
      localStorage.removeItem('uaifrila_vaga_editar');
      setTimeout(() => { if (propsSetTelaAtiva) propsSetTelaAtiva('trampos'); }, 1500);
    } catch (e: any) { setErro(e.message || 'Erro ao publicar vaga'); } finally { setCarregando(false); }
  };
  // Etapa 1 (Dias e turnos) NAO tem early-return em tela cheia: ela renderiza
  // dentro do mesmo card / indicador das outras etapas, e o rodape dela
  // (WizardNavegacao dentro da TelaAgendaVaga) e o UNICO conjunto de botoes.
  return (
    <div className={styles.pageContainer + ' ' + styles.gridMainSide}>
      <div className={styles.card}>
        <h1 className={styles.typography.h1}>⚡ {isEditando ? `Editando Vaga #${vagaEdicao?.id}` : 'Nova Vaga'} {calculando ? '(calculando...)' : ''}</h1>
        {isEditando && (<div className="mt-2"><button onClick={cancelarEdicao} className={styles.buttonSecondary}>✕ Cancelar edição / Nova vaga</button></div>)}
        <p className={styles.typography.caption + ' mt-1'}>Endereço ativo do usuário já vem marcado • Só troca se precisar</p>
        {erro && <div className={`${styles.errorBox} mt-4`}>{erro}</div>}
        {sucesso && <div className={`${styles.successBox} mt-4`}>{sucesso}</div>}
        <WizardIndicador etapas={ETAPAS_VAGA} etapa={etapa} />
        <div className="space-y-5 mt-6">
          {etapa === 0 && <EtapaVagaDados form={form} setForm={setForm} funcoes={funcoes} carregandoFuncoes={carregandoFuncoes} templates={templates} aplicarTemplate={aplicarTemplate} />}
          {etapa === 1 && <EtapaVagaAgenda turnos={turnos} onConfirmar={(novos: Turno[]) => { setTurnos(novos); setErro(''); setEtapa(2); }} onCancelar={() => { setErro(''); setEtapa(0); }} etapas={ETAPAS_VAGA} etapa={etapa} antecedenciaMinutos={antecedenciaMinutos} />}
          {etapa === 2 && <EtapaVagaEnderecoValores form={form} setForm={setForm} carregandoEnderecoAtivo={carregandoEnderecoAtivo} turnos={turnos} turnosOrdenados={turnosOrdenados} valorTotalTurnos={valorTotalTurnos} calculoBackend={calculoBackend} />}
          {etapa === 3 && <EtapaVagaRevisao form={form} turnos={turnos} turnosOrdenados={turnosOrdenados} valorTotalTurnos={valorTotalTurnos} calculoBackend={calculoBackend} />}
          {etapa !== 1 && <WizardNavegacao etapas={ETAPAS_VAGA} etapa={etapa} onVoltar={voltarEtapa} onAvancar={avancarEtapa} onFinalizar={publicar} finalizarLabel={carregando ? 'Publicando...' : isEditando ? 'Atualizar Vaga' : 'Publicar Vaga'} carregando={carregando} podeFinalizar={!!form.enderecoId && !!form.funcaoId} />}
        </div>
      </div>
    </div>
  );
}
