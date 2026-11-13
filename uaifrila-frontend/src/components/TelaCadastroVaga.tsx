import React, { useState, useEffect } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import BlocoEndereco from './BlocoEndereco';
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

  // taxas ANTES do form: o estado inicial do form usa taxas.valor_minimo_vaga.
  // Antes taxas era declarado DEPOIS (linha 73) -> "Cannot access 'taxas' before initialization" e a tela nem abria.
  const [taxas, setTaxas] = useState(TAXAS_DEFAULT);

  const [form, setForm] = useState({
    funcaoId: null as number | null, titulo: '', descricao: '',
    dataHoraInicio: '', dataHoraFim: '',
    valorServicoStr: taxas.valor_minimo_vaga.toFixed(2).replace('.', ','), valorServicoNum: taxas.valor_minimo_vaga,
    valorTransporteStr: '15,00', valorTransporteNum: 15,
    enderecoId: null as number | null,
    enderecoAtivo: null as any,
    meioPagamento: 'pix' as MeioPagamento,
  });

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
  const [carregandoFuncoes, setCarregandoFuncoes] = useState(true);

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

  // Retorna o VALOR_MINIMO_VAGA e, em vaga NOVA, aplica ele como valor inicial
  // do campo Valor Servico. Antes o campo nascia fixo em 75,00, ignorando a variavel.
  const carregarVariaveis = async (isEditandoVaga = false): Promise<number> => {
    try {
      const data = await apiFetch('/api/variaveis');
      const vars = data.variaveis || data.data || data || [];
      const find = (ch: string) => vars.find((x: any) => x.chave === ch);
      const minimo = parseFloat(find('VALOR_MINIMO_VAGA')?.valor_numerico ?? find('VALOR_MINIMO_VAGA')?.valor ?? '75') || 75;
      if (!isEditandoVaga) setForm(f => ({ ...f, valorServicoNum: minimo, valorServicoStr: minimo.toFixed(2).replace('.', ',') }));
      setTaxas({
        valor_minimo_vaga: minimo,
        taxa_pix_percentual: parseFloat(find('TAXA_PIX_PERCENTUAL')?.valor_numerico || '1'),
        taxa_cartao_percentual: parseFloat(find('TAXA_CARTAO_PERCENTUAL')?.valor_numerico || '4'),
        comissao_percentual: parseFloat((find('COMISSAO_APLICATIVO') || find('TAXA_PLATAFORMA_PERCENTUAL'))?.valor_numerico || '10'),
      });
      const ant = find('VAGA_ANTECEDENCIA_MINUTOS');
      if (ant) { const min = parseInt(ant.valor_numerico || ant.valor); if (min > 0) { setAntecedenciaMinutos(min); setMinDateTime(getMinDateTimeLocal(min)); } }
      return minimo;
    } catch { return TAXAS_DEFAULT.valor_minimo_vaga; }
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

  const recalcularNoBackend = async () => {
    if (!form.dataHoraInicio || !form.dataHoraFim || form.valorServicoNum <= 0) {
      setCalculoBackend(null);
      return;
    }
    // Fim <= inicio e erro de validacao do proprio form: nao chama o backend
    // (antes gerava POST /vagas/calcular 500 a cada tecla enquanto o usuario digitava).
    if (new Date(form.dataHoraFim).getTime() <= new Date(form.dataHoraInicio).getTime()) {
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
  }, [form.valorServicoNum, form.valorTransporteNum, form.dataHoraInicio, form.dataHoraFim, form.meioPagamento]);

  useEffect(() => {
    const init = async () => {
    // Edicao e decidida ANTES de carregar as variaveis: em vaga nova o
    // VALOR_MINIMO_VAGA vira o valor inicial do campo; em edicao, o valor da vaga vence.
    let vagaLocal: any = null;
    const vagaStr = localStorage.getItem('uaifrila_vaga_editar');
    if (vagaStr) {
      try { const parsed = JSON.parse(vagaStr); if (parsed?.id) vagaLocal = parsed; } catch {}
    }
    const minimo = await carregarVariaveis(!!vagaLocal);
    // Se não está editando, já busca ativo automaticamente
    if (vagaLocal) {
      try {
        {
          setIsEditando(true); setVagaEdicao(vagaLocal);
          const inicioLocal = utcParaInputLocal(vagaLocal.data_inicio);
          const fimLocal = utcParaInputLocal(vagaLocal.data_fim);
          const valorServ = Number(vagaLocal.valor_servico || minimo);
          const valorTransp = Number(vagaLocal.valor_transporte || 0);
          const listaFuncoes = await carregarFuncoes();
          const funcaoIdEdicao = Number(vagaLocal.funcao_id ?? vagaLocal.funcaoId) || listaFuncoes.find((f: any) => String(f.nome).toLowerCase() === String(vagaLocal.funcao || '').toLowerCase())?.id || listaFuncoes[0]?.id || null;
          // Endereco da vaga em edicao: ANTES o setForm so preenchia enderecoId e
          // enderecoAtivo ficava null, entao o card "Usando:" nunca aparecia.
          // E se a vaga salva nao trouxesse endereco_id, enderecoId ficava null e
          // o botao Atualizar ficava desabilitado. Resolve em 3 passos:
          setCarregandoEnderecoAtivo(true);
          let enderecoIdEdicao = Number(vagaLocal.endereco_id ?? vagaLocal.enderecoId) || null;
          if (!enderecoIdEdicao) {
            try {
              const dv: any = await apiFetch(`/api/enderecos-vaga/vaga/${vagaLocal.id}`);
              const links = dv.enderecos || dv.enderecos_vaga || dv.data || dv || [];
              const primeiro = Array.isArray(links) ? (links.find((l: any) => l.ativo !== false) || links[0]) : null;
              enderecoIdEdicao = Number(primeiro?.endereco_id ?? primeiro?.enderecoId) || null;
            } catch {}
          }
          // Objeto completo do endereco, para o card "Usando:" renderizar.
          let enderecoAtivoEdicao: any = null;
          if (enderecoIdEdicao) {
            try {
              const d: any = await apiFetch(`/api/enderecos/${enderecoIdEdicao}`);
              enderecoAtivoEdicao = d.data || d.endereco || d || null;
            } catch {}
            if (!enderecoAtivoEdicao) {
              try {
                const dm: any = await apiFetch('/api/enderecos/meus');
                const lista = dm.enderecos || dm.data || dm || [];
                enderecoAtivoEdicao = (Array.isArray(lista) ? lista : []).find((e: any) => Number(e.id) === enderecoIdEdicao) || null;
              } catch {}
            }
          }
          // Fallback: usa os campos que a propria vaga ja traz (endereco_completo, logradouro, cep...).
          if (!enderecoAtivoEdicao && vagaLocal.endereco_completo) {
            enderecoAtivoEdicao = { id: enderecoIdEdicao, endereco_completo: vagaLocal.endereco_completo, logradouro: vagaLocal.logradouro, numero: vagaLocal.numero, bairro: vagaLocal.bairro, cep: vagaLocal.cep, cidade_nome: vagaLocal.cidade_nome, cidade_estado: vagaLocal.cidade_estado, estado_sigla: vagaLocal.cidade_estado };
          }
          setForm(f => ({
            ...f,
            funcaoId: funcaoIdEdicao,
            titulo: vagaLocal.titulo || '', descricao: vagaLocal.descricao || '',
            dataHoraInicio: inicioLocal, dataHoraFim: fimLocal,
            valorServicoStr: valorServ.toFixed(2).replace('.', ','), valorServicoNum: valorServ,
            valorTransporteStr: valorTransp.toFixed(2).replace('.', ','), valorTransporteNum: valorTransp,
            meioPagamento: vagaLocal.meio_pagamento || 'pix',
            enderecoId: enderecoIdEdicao,
            enderecoAtivo: enderecoAtivoEdicao,
          }));
          setCarregandoEnderecoAtivo(false);
          return;
        }
      } catch {}
    }
    // Não está editando: carrega funcoes + ativo
    carregarFuncoes();
    carregarEnderecoAtivoAutomatico();
    };
    init();
  }, []);

  const validar = () => {
    if (!form.funcaoId) return 'Selecione a funcao';
    if (!form.titulo || form.titulo.trim().length < 5) return 'Titulo minimo 5 caracteres';
    if (!form.descricao || form.descricao.trim().length < 10) return 'Descricao minima 10 caracteres';
    if (!form.dataHoraInicio) return 'Horario de entrada obrigatorio';
    if (!form.dataHoraFim) return 'Horario de saida obrigatorio';
    const inicio = new Date(form.dataHoraInicio); const fim = new Date(form.dataHoraFim);
    if (!isEditando) { const agora = new Date(); agora.setMinutes(agora.getMinutes() + antecedenciaMinutos); if (inicio < agora) return `Entrada deve ser > agora + ${antecedenciaMinutos}min`; }
    if (fim <= inicio) return 'Saida deve ser maior que entrada';
    const diffH = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60); if (diffH < 0.5) return 'Minimo 30 minutos'; if (diffH > 24) return 'Maximo 24 horas';
    if (calculoBackend && !calculoBackend.valor_minimo_valido) return calculoBackend.mensagem_validacao || `Valor mínimo R$ ${taxas.valor_minimo_vaga.toFixed(2)}`;
    // Sem calculo do backend (ainda carregando): trava pelo valor do servico mesmo.
    // O backend revalida pelo liquido (servico + transporte - taxas) e rejeita com 400 de qualquer forma.
    if (!calculoBackend && form.valorServicoNum < taxas.valor_minimo_vaga) return `Valor do serviço abaixo do mínimo R$ ${taxas.valor_minimo_vaga.toFixed(2)}`;
    if (!form.enderecoId) return 'Selecione um endereço ativo - cadastre um endereço em Perfil se não tiver';
    return null;
  };

  // Sai do modo edicao e volta para vaga nova (limpa a chave e o form).
  // Existe porque o Navbar NAO apaga mais a chave (ver Navbar.tsx): sem este
  // botao, uma edicao abandonada reabriria toda vez que abrisse Publicar.
  const cancelarEdicao = () => {
    localStorage.removeItem('uaifrila_vaga_editar');
    setIsEditando(false); setVagaEdicao(null);
    setForm({ funcaoId: funcoes[0]?.id ?? null, titulo: '', descricao: '', dataHoraInicio: '', dataHoraFim: '', valorServicoStr: taxas.valor_minimo_vaga.toFixed(2).replace('.', ','), valorServicoNum: taxas.valor_minimo_vaga, valorTransporteStr: '15,00', valorTransporteNum: 15, enderecoId: null, enderecoAtivo: null, meioPagamento: 'pix' });
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
        valor_servico: form.valorServicoNum, 
        valor_transporte: form.valorTransporteNum,
        data_inicio_local: form.dataHoraInicio,
        data_fim_local: form.dataHoraFim,
        timezone,
        meio_pagamento: form.meioPagamento,
        endereco_id: form.enderecoId,
      };
      
      const url = isEditando && vagaEdicao?.id ? `/api/vagas/${vagaEdicao.id}` : `/api/vagas`;
      const method = isEditando ? 'PUT' : 'POST';
      
      const data = await apiFetch(url, { method, body: JSON.stringify(payload) });
      
      setSucesso(isEditando ? `Vaga #${vagaEdicao.id} atualizada!` : `Vaga publicada! ${data.calculo ? `Freela recebe R$ ${data.calculo.freela_recebe_liquido.toFixed(2)}` : ''}`);
      localStorage.removeItem('uaifrila_vaga_editar');
      setTimeout(() => { if (propsSetTelaAtiva) propsSetTelaAtiva('trampos'); }, 1500);
    } catch (e: any) { setErro(e.message || 'Erro ao publicar vaga'); } finally { setCarregando(false); }
  };

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
              <label className={styles.label}>Valor Serviço R$ *</label>
              <input value={form.valorServicoStr} onChange={e => { const f = formatarMoedaInput(e.target.value); setForm({ ...form, valorServicoStr: f, valorServicoNum: parseMoedaParaNumero(f) }); }} className={styles.input} />
            </div>
            <div>
              <label className={styles.label}>Ajuda Transporte R$</label>
              <input value={form.valorTransporteStr} onChange={e => { const f = formatarMoedaInput(e.target.value); setForm({ ...form, valorTransporteStr: f, valorTransporteNum: parseMoedaParaNumero(f) }); }} className={styles.input} />
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
