import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

// OOP: Service para expansão de cidades
class ExpansaoService {
  private API: string;
  private token: string;

  constructor(apiUrl: string, token: string) {
    this.API = apiUrl;
    this.token = token;
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  async listarExpansao(filtros: any) {
    const params = new URLSearchParams(filtros).toString();
    const res = await fetch(`${this.API}/expansao?${params}`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return res.json();
  }

  async hierarquia() {
    const res = await fetch(`${this.API}/expansao/hierarquia`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return res.json();
  }

  async solicitar(dados: any) {
    const res = await fetch(`${this.API}/expansao`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(dados)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ erro: 'Erro ao solicitar' }));
      throw new Error(err.erro);
    }
    return res.json();
  }

  async atualizarStatus(id: number, status: string, motivo?: string) {
    const res = await fetch(`${this.API}/expansao/${id}/status`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify({ status, motivo })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ erro: 'Erro' }));
      throw new Error(err.erro);
    }
    return res.json();
  }

  prioridadeCor(p: number) {
    if (p >= 3) return 'bg-[#E53935] text-white border-black';
    if (p === 2) return 'bg-[#FFC700] text-black border-black';
    if (p === 1) return 'bg-[#0066FF] text-white border-[#0066FF]';
    return 'bg-zinc-200 text-black border-black/20';
  }

  statusCor(status: string) {
    const map: any = {
      'SOLICITADA': 'bg-zinc-200 text-black border-black/20',
      'EM_ANALISE': 'bg-[#FFC700] text-black border-black',
      'APROVADA': 'bg-[#0066FF] text-white border-[#0066FF]',
      'ATIVA': 'bg-[#00C851] text-white border-black',
      'REJEITADA': 'bg-[#E53935] text-white border-black'
    };
    return map[status] || map['SOLICITADA'];
  }
}

interface Props {
  usuario?: any;
}

export default function PainelExpansao({ usuario: usuarioProp }: Props) {
  const { isDark } = useTheme();
  const [usuario, setUsuario] = useState<any>(usuarioProp);
  const [expansoes, setExpansoes] = useState<any[]>([]);
  const [hierarquia, setHierarquia] = useState<any[]>([]);
  const [estatisticas, setEstatisticas] = useState<any>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [filtros, setFiltros] = useState({ status: 'todos', search: '' });
  const [novaSolicitacao, setNovaSolicitacao] = useState({ cidade_nome: '', estado_sigla: 'MG', populacao: '', motivo: '' });
  const [mostrarForm, setMostrarForm] = useState(false);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    if (usuarioProp) setUsuario(usuarioProp);
    else {
      const u = localStorage.getItem('uaifrila_usuario');
      if (u) { try { setUsuario(JSON.parse(u)); } catch {} }
    }
  }, [usuarioProp]);

  const carregar = async () => {
    const token = localStorage.getItem('uaifrila_token');
    if (!token) { setErro('SEM_TOKEN'); setCarregando(false); return; }

    if (!usuario?.is_admin && !usuario?.is_super_admin) {
      setErro('ACESSO_NEGADO'); setCarregando(false); return;
    }

    const service = new ExpansaoService(API, token);
    setCarregando(true);
    try {
      const [dadosExp, dadosHier] = await Promise.all([
        service.listarExpansao(filtros).catch(() => ({ expansoes: [], estatisticas: {} })),
        service.hierarquia().catch(() => ({ hierarquia: [] }))
      ]);
      setExpansoes(dadosExp.expansoes || []);
      setEstatisticas(dadosExp.estatisticas || {});
      setHierarquia(dadosHier.hierarquia || []);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, [usuario, filtros.status]);

  const handleSolicitar = async () => {
    const token = localStorage.getItem('uaifrila_token');
    if (!token) return;
    if (!novaSolicitacao.cidade_nome || !novaSolicitacao.estado_sigla) {
      alert('Cidade e Estado obrigatórios');
      return;
    }
    const service = new ExpansaoService(API, token);
    try {
      await service.solicitar({
        cidade_nome: novaSolicitacao.cidade_nome,
        estado_sigla: novaSolicitacao.estado_sigla,
        populacao: novaSolicitacao.populacao ? parseInt(novaSolicitacao.populacao) : undefined,
        motivo: novaSolicitacao.motivo
      });
      alert('Solicitação criada!');
      setNovaSolicitacao({ cidade_nome: '', estado_sigla: 'MG', populacao: '', motivo: '' });
      setMostrarForm(false);
      carregar();
    } catch (e: any) {
      alert('Erro: ' + e.message);
    }
  };

  const handleStatus = async (id: number, status: string) => {
    const token = localStorage.getItem('uaifrila_token');
    if (!token) return;
    const motivo = status === 'REJEITADA' ? prompt('Motivo da rejeição:') || undefined : undefined;
    const service = new ExpansaoService(API, token);
    try {
      await service.atualizarStatus(id, status, motivo);
      carregar();
    } catch (e: any) {
      alert('Erro: ' + e.message);
    }
  };

  const service = new ExpansaoService(API, '');

  if (erro === 'ACESSO_NEGADO') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className={`p-8 border-2 ${isDark ? 'bg-red-900/20 border-red-600 text-red-100' : 'bg-red-100 border-black text-black'}`}>
          <h2 className="text-xl font-black uppercase">Acesso Negado</h2>
          <p className="mt-2 text-xs">Apenas super admin pode gerenciar expansão de cidades</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className={`text-2xl md:text-3xl font-black uppercase ${isDark ? 'text-white' : 'text-black'}`}>
            🌎 Expansão Cidades
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Hierarquia País &gt; Estado &gt; Cidade &gt; Bairro • Solicitações de novas cidades
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setMostrarForm(!mostrarForm)} className={`px-4 py-2 border-2 font-black uppercase text-xs ${isDark ? 'bg-[#FFC700] text-black border-black' : 'bg-[#FFC700] text-black border-black'}`}>
            {mostrarForm ? 'Cancelar' : '+ Nova Cidade'}
          </button>
          <button onClick={carregar} className={`px-4 py-2 border-2 font-black uppercase text-xs ${isDark ? 'bg-[#0066FF] text-white border-[#0066FF]' : 'bg-black text-white border-black'}`}>
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
          <div className="text-[10px] font-black uppercase opacity-60">Total Cidades Ativas</div>
          <div className="text-xl font-black mt-1">{estatisticas.cidades?.ativas || hierarquia.length || 0}</div>
          <div className="text-[10px] mt-1">{estatisticas.cidades?.total_cidades || 0} cadastradas</div>
        </div>
        <div className={`p-4 border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
          <div className="text-[10px] font-black uppercase opacity-60">Solicitações</div>
          <div className="text-xl font-black mt-1">{estatisticas.expansao?.total_solicitacoes || expansoes.length || 0}</div>
          <div className="text-[10px] mt-1">{estatisticas.expansao?.solicitadas || 0} pendentes</div>
        </div>
        <div className={`p-4 border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
          <div className="text-[10px] font-black uppercase opacity-60">Em Análise</div>
          <div className="text-xl font-black mt-1">{estatisticas.expansao?.em_analise || 0}</div>
          <div className="text-[10px] mt-1">{estatisticas.expansao?.aprovadas || 0} aprovadas</div>
        </div>
        <div className={`p-4 border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
          <div className="text-[10px] font-black uppercase opacity-60">Demanda Total</div>
          <div className="text-xl font-black mt-1">{estatisticas.expansao?.total_demanda || 0}</div>
          <div className="text-[10px] mt-1">solicitações</div>
        </div>
      </div>

      {/* Form nova solicitação */}
      {mostrarForm && (
        <div className={`p-6 border-2 mb-6 ${isDark ? 'bg-black border-white' : 'bg-white border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'}`}>
          <h3 className={`font-black uppercase text-sm mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Nova Solicitação de Expansão</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase">Cidade *</label>
              <input value={novaSolicitacao.cidade_nome} onChange={e=>setNovaSolicitacao({...novaSolicitacao, cidade_nome: e.target.value})} placeholder="Ex: Uberaba" className={`w-full h-[44px] px-3 text-sm border-2 outline-none ${isDark ? 'bg-black !text-white border-white placeholder:text-zinc-400' : 'bg-white !text-black border-black placeholder:text-zinc-500'}`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase">Estado *</label>
              <select value={novaSolicitacao.estado_sigla} onChange={e=>setNovaSolicitacao({...novaSolicitacao, estado_sigla: e.target.value})} className={`w-full h-[44px] px-3 text-sm border-2 outline-none ${isDark ? 'bg-black !text-white border-white' : 'bg-white !text-black border-black'}`}>
                <option value="MG">MG</option><option value="SP">SP</option><option value="GO">GO</option><option value="DF">DF</option><option value="RJ">RJ</option><option value="BA">BA</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase">População</label>
              <input type="number" value={novaSolicitacao.populacao} onChange={e=>setNovaSolicitacao({...novaSolicitacao, populacao: e.target.value})} placeholder="120000" className={`w-full h-[44px] px-3 text-sm border-2 outline-none ${isDark ? 'bg-black !text-white border-white placeholder:text-zinc-400' : 'bg-white !text-black border-black placeholder:text-zinc-500'}`} />
            </div>
            <div className="flex flex-col gap-1 justify-end">
              <button onClick={handleSolicitar} className="h-[44px] px-4 bg-[#00C851] text-white border-2 border-black font-black uppercase text-xs">Criar Solicitação</button>
            </div>
            <div className="md:col-span-4 flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase">Motivo / Demanda</label>
              <input value={novaSolicitacao.motivo} onChange={e=>setNovaSolicitacao({...novaSolicitacao, motivo: e.target.value})} placeholder="Alta demanda de garçons, muitos eventos..." className={`w-full h-[44px] px-3 text-sm border-2 outline-none ${isDark ? 'bg-black !text-white border-white placeholder:text-zinc-400' : 'bg-white !text-black border-black placeholder:text-zinc-500'}`} />
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className={`p-4 border-2 mb-6 flex flex-col md:flex-row gap-3 ${isDark ? 'bg-black border-white/20' : 'bg-gray-50 border-black/10'}`}>
        <select value={filtros.status} onChange={e=>setFiltros({...filtros, status: e.target.value})} className={`h-[40px] px-3 text-xs border-2 outline-none ${isDark ? 'bg-black !text-white border-white' : 'bg-white !text-black border-black'}`}>
          <option value="todos">Todos Status</option>
          <option value="SOLICITADA">Solicitada</option>
          <option value="EM_ANALISE">Em Análise</option>
          <option value="APROVADA">Aprovada</option>
          <option value="ATIVA">Ativa</option>
          <option value="REJEITADA">Rejeitada</option>
        </select>
        <input value={filtros.search} onChange={e=>setFiltros({...filtros, search: e.target.value})} placeholder="Buscar cidade..." className={`flex-1 h-[40px] px-3 text-xs border-2 outline-none ${isDark ? 'bg-black !text-white border-white placeholder:text-zinc-400' : 'bg-white !text-black border-black placeholder:text-zinc-500'}`} />
        <button onClick={carregar} className="h-[40px] px-4 bg-[#FFC700] text-black border-2 border-black font-black uppercase text-xs">🔍 Filtrar</button>
      </div>

      {/* Lista expansões - responsive cards */}
      {carregando ? (
        <div className={`p-8 border-2 text-center ${isDark ? 'border-white/20 text-zinc-400' : 'border-black/20'}`}>Carregando expansões...</div>
      ) : expansoes.length === 0 ? (
        <div className={`p-8 border-2 text-center ${isDark ? 'border-white/20 text-zinc-400' : 'border-black/20'}`}>
          <p className="text-sm">Nenhuma solicitação de expansão</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {expansoes.map((e:any) => (
            <div key={e.id} className={`p-4 border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
              <div className="flex justify-between items-start">
                <h4 className="font-black uppercase text-sm">{e.cidade_nome} - {e.estado_sigla}</h4>
                <span className={`px-2 py-1 text-[9px] font-black uppercase border ${service.statusCor(e.status)}`}>{e.status}</span>
              </div>
              <div className="mt-2 text-[11px] space-y-1">
                <div>População: <span className="font-bold">{e.populacao?.toLocaleString('pt-BR') || 'N/A'}</span></div>
                <div>Demanda: <span className="font-bold">{e.demanda_solicitacoes} solicitações / {e.demanda_vagas} vagas</span></div>
                <div>Prioridade: <span className={`px-2 py-0.5 text-[9px] font-black uppercase border ${service.prioridadeCor(e.prioridade)}`}>{['Baixa','Média','Alta','Urgente'][e.prioridade] || e.prioridade}</span></div>
                {e.motivo && <div className="mt-2 text-[10px] opacity-70">"{e.motivo}"</div>}
                {e.solicitado_por_nome && <div className="text-[9px] opacity-60">Por: {e.solicitado_por_nome}</div>}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {e.status !== 'EM_ANALISE' && <button onClick={()=>handleStatus(e.id, 'EM_ANALISE')} className="px-2 py-1 bg-[#FFC700] text-black border border-black text-[9px] font-black uppercase">Analisar</button>}
                {e.status !== 'APROVADA' && <button onClick={()=>handleStatus(e.id, 'APROVADA')} className="px-2 py-1 bg-[#0066FF] text-white border border-black text-[9px] font-black uppercase">Aprovar</button>}
                {e.status !== 'ATIVA' && <button onClick={()=>handleStatus(e.id, 'ATIVA')} className="px-2 py-1 bg-[#00C851] text-white border border-black text-[9px] font-black uppercase">Ativar</button>}
                {e.status !== 'REJEITADA' && <button onClick={()=>handleStatus(e.id, 'REJEITADA')} className="px-2 py-1 bg-[#E53935] text-white border border-black text-[9px] font-black uppercase">Rejeitar</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hierarquia País > Estado > Cidade > Bairro */}
      <div className={`p-4 border-2 ${isDark ? 'bg-black border-white/20' : 'bg-white border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'}`}>
        <h3 className={`font-black uppercase text-sm mb-4 ${isDark ? 'text-white' : 'text-black'}`}>🏙️ Hierarquia Geográfica Atual</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className={`${isDark ? 'bg-[#0066FF] text-white' : 'bg-black text-white'}`}>
              <tr>
                <th className="text-left p-2 font-black uppercase">País</th>
                <th className="text-left p-2 font-black uppercase">Estado</th>
                <th className="text-left p-2 font-black uppercase">Cidade</th>
                <th className="text-left p-2 font-black uppercase">IBGE</th>
                <th className="text-left p-2 font-black uppercase">Pop.</th>
                <th className="text-left p-2 font-black uppercase">Status</th>
                <th className="text-left p-2 font-black uppercase">Bairros</th>
              </tr>
            </thead>
            <tbody>
              {hierarquia.slice(0, 20).map((h:any, i:number) => (
                <tr key={i} className={`${i%2===0 ? (isDark ? 'bg-zinc-900' : 'bg-white') : (isDark ? 'bg-black' : 'bg-gray-50')} border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                  <td className={`p-2 ${isDark ? 'text-white' : 'text-black'}`}>{h.pais_sigla || 'BRA'}</td>
                  <td className={`p-2 ${isDark ? 'text-zinc-300' : 'text-black'}`}>{h.estado_sigla || h.estado || '-'}</td>
                  <td className={`p-2 font-bold ${isDark ? 'text-white' : 'text-black'}`}>{h.cidade_nome || '-'}</td>
                  <td className={`p-2 font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{h.codigo_ibge || '-'}</td>
                  <td className={`p-2 ${isDark ? 'text-zinc-300' : 'text-black'}`}>{h.populacao?.toLocaleString('pt-BR') || '-'}</td>
                  <td className="p-2"><span className={`px-2 py-0.5 text-[9px] font-black uppercase border ${service.statusCor(h.status_expansao || 'ATIVA')}`}>{h.status_expansao || 'ATIVA'}</span></td>
                  <td className={`p-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{h.total_bairros || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regras */}
      <div className={`mt-6 p-4 border-2 ${isDark ? 'bg-zinc-900 border-white/20 text-zinc-300' : 'bg-yellow-50 border-black/10 text-black'}`}>
        <h4 className="font-black uppercase text-xs">📋 Regras de Negócio - Expansão</h4>
        <ul className="mt-2 text-[11px] list-disc pl-4 space-y-1">
          <li>Hierarquia: País → Estado → Cidade → Bairro (tabelas paises, estados, cidades, bairros)</li>
          <li>Solicitação: qualquer usuário pode solicitar nova cidade, mas apenas super_admin ativa</li>
          <li>Prioridade: 0 Baixa, 1 Média, 2 Alta, 3 Urgente - baseada em demanda_solicitacoes + demanda_vagas</li>
          <li>Status: SOLICITADA → EM_ANALISE → APROVADA → ATIVA (cria cidade e libera para endereços)</li>
          <li>Raio padrão: 20KM (CIDADE_RAIO_KM_PADRAO) para validar endereço dentro da cidade</li>
          <li>Ativação: ao ativar, cria cidade em cidades com status_expansao=ATIVA e libera para cadastro</li>
        </ul>
      </div>
    </div>
  );
}
