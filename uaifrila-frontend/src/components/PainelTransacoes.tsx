import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

// OOP: Classe para regras de negócio de transações
class TransacaoService {
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

  async listar(filtros: any) {
    const params = new URLSearchParams(filtros).toString();
    const res = await fetch(`${this.API}/transacoes?${params}`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return res.json();
  }

  async estatisticas() {
    const res = await fetch(`${this.API}/transacoes/estatisticas`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return res.json();
  }

  formatarMoeda(valor: number) {
    return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
  }

  formatarData(data: string) {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
  }

  statusCor(status: string) {
    const cores: any = {
      'FINALIZADA': 'bg-[#00C851] text-white border-black',
      'PAGO_ESCROW': 'bg-[#0066FF] text-white border-[#0066FF]',
      'EM_ANDAMENTO': 'bg-[#FFC700] text-black border-black',
      'AGUARDANDO_PAGAMENTO': 'bg-zinc-200 text-black border-black/20',
      'CANCELADA': 'bg-[#E53935] text-white border-black',
      'EXPIRADA': 'bg-zinc-500 text-white border-black'
    };
    return cores[status] || 'bg-white text-black border-black/20';
  }
}

interface Props {
  usuario?: any;
}

export default function PainelTransacoes({ usuario: usuarioProp }: Props) {
  const { isDark } = useTheme();
  const [usuario, setUsuario] = useState<any>(usuarioProp);
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [totais, setTotais] = useState<any>({});
  const [estatisticas, setEstatisticas] = useState<any>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [filtros, setFiltros] = useState({
    inicio: '',
    fim: '',
    status: 'todos',
    cidade: 'todas',
    page: '1',
    limit: '20'
  });
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

    const service = new TransacaoService(API, token);
    setCarregando(true);
    try {
      const [dados, stats] = await Promise.all([
        service.listar(filtros),
        service.estatisticas().catch(() => ({ estatisticas: {} }))
      ]);
      setTransacoes(dados.transacoes || []);
      setTotais(dados.totais || {});
      setEstatisticas(stats.estatisticas || stats || {});
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, [usuario, filtros.status, filtros.page]);

  const service = new TransacaoService(API, '');

  if (erro === 'ACESSO_NEGADO') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className={`p-8 border-2 ${isDark ? 'bg-red-900/20 border-red-600 text-red-100' : 'bg-red-100 border-black text-black'}`}>
          <h2 className="text-xl font-black uppercase">Acesso Negado</h2>
          <p className="mt-2 text-xs">Apenas administradores podem ver transações por período</p>
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
            💳 Transações Período
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Escrow, taxas, volume por período • Regras: pagamento antecipado {totais.total_transacoes || 0} transações
          </p>
        </div>
        <button onClick={carregar} className={`px-4 py-2 border-2 font-black uppercase text-xs ${isDark ? 'bg-[#0066FF] text-white border-[#0066FF]' : 'bg-black text-white border-black'}`}>
          🔄 Atualizar
        </button>
      </div>

      {/* Cards estatísticas - responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
          <div className="text-[10px] font-black uppercase opacity-60">Total Volume</div>
          <div className="text-xl font-black mt-1">{service.formatarMoeda(totais.total_contratante || estatisticas.volume_total || 0)}</div>
          <div className="text-[10px] mt-1">{totais.total_transacoes || 0} transações</div>
        </div>
        <div className={`p-4 border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
          <div className="text-[10px] font-black uppercase opacity-60">Taxas Plataforma</div>
          <div className="text-xl font-black mt-1">{service.formatarMoeda(totais.total_taxas || estatisticas.taxas_total || 0)}</div>
          <div className="text-[10px] mt-1">15% padrão</div>
        </div>
        <div className={`p-4 border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
          <div className="text-[10px] font-black uppercase opacity-60">Finalizadas</div>
          <div className="text-xl font-black mt-1">{totais.finalizadas || 0}</div>
          <div className="text-[10px] mt-1">{totais.canceladas || 0} canceladas</div>
        </div>
        <div className={`p-4 border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-900 border-white text-white' : 'bg-white border-black text-black'}`}>
          <div className="text-[10px] font-black uppercase opacity-60">Em Escrow</div>
          <div className="text-xl font-black mt-1">{totais.em_escrow || 0}</div>
          <div className="text-[10px] mt-1">Aguardando liberação</div>
        </div>
      </div>

      {/* Filtros - responsive */}
      <div className={`p-4 border-2 mb-6 ${isDark ? 'bg-black border-white/20' : 'bg-gray-50 border-black/10'}`}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase">Início</label>
            <input type="date" value={filtros.inicio} onChange={e=>setFiltros({...filtros, inicio: e.target.value})} className={`w-full h-[40px] px-3 text-xs border-2 outline-none ${isDark ? 'bg-black !text-white border-white placeholder:text-zinc-400' : 'bg-white !text-black border-black'}`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase">Fim</label>
            <input type="date" value={filtros.fim} onChange={e=>setFiltros({...filtros, fim: e.target.value})} className={`w-full h-[40px] px-3 text-xs border-2 outline-none ${isDark ? 'bg-black !text-white border-white placeholder:text-zinc-400' : 'bg-white !text-black border-black'}`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase">Status</label>
            <select value={filtros.status} onChange={e=>setFiltros({...filtros, status: e.target.value})} className={`w-full h-[40px] px-3 text-xs border-2 outline-none ${isDark ? 'bg-black !text-white border-white' : 'bg-white !text-black border-black'}`}>
              <option value="todos">Todos</option>
              <option value="FINALIZADA">Finalizada</option>
              <option value="PAGO_ESCROW">Pago Escrow</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="AGUARDANDO_PAGAMENTO">Aguardando Pag.</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase">Cidade</label>
            <input value={filtros.cidade} onChange={e=>setFiltros({...filtros, cidade: e.target.value})} placeholder="Uberlândia ou todas" className={`w-full h-[40px] px-3 text-xs border-2 outline-none ${isDark ? 'bg-black !text-white border-white placeholder:text-zinc-400' : 'bg-white !text-black border-black placeholder:text-zinc-500'}`} />
          </div>
          <div className="flex flex-col gap-1 justify-end">
            <button onClick={()=>setFiltros({...filtros, page: '1'})} className={`h-[40px] px-4 border-2 font-black uppercase text-xs ${isDark ? 'bg-[#FFC700] text-black border-black' : 'bg-[#FFC700] text-black border-black'}`}>
              🔍 Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Tabela - responsive com scroll */}
      {carregando ? (
        <div className={`p-8 border-2 text-center ${isDark ? 'border-white/20 text-zinc-400' : 'border-black/20'}`}>Carregando transações...</div>
      ) : transacoes.length === 0 ? (
        <div className={`p-8 border-2 text-center ${isDark ? 'border-white/20 text-zinc-400' : 'border-black/20'}`}>
          <p className="text-sm">Nenhuma transação no período</p>
          <p className="text-[10px] mt-2">Regras: pagamento antecipado 60min antes, expira em 30min, escrow libera em 24h</p>
        </div>
      ) : (
        <div className="overflow-x-auto border-2 border-black">
          <table className="w-full text-xs">
            <thead className={`${isDark ? 'bg-[#0066FF] text-white' : 'bg-black text-white'}`}>
              <tr>
                <th className="text-left p-3 font-black uppercase">Código</th>
                <th className="text-left p-3 font-black uppercase">Status</th>
                <th className="text-left p-3 font-black uppercase">Cidade</th>
                <th className="text-left p-3 font-black uppercase">Freela</th>
                <th className="text-left p-3 font-black uppercase">Base</th>
                <th className="text-left p-3 font-black uppercase">Taxa</th>
                <th className="text-left p-3 font-black uppercase">Total</th>
                <th className="text-left p-3 font-black uppercase">Data</th>
              </tr>
            </thead>
            <tbody>
              {transacoes.map((t:any, i:number) => (
                <tr key={t.id || i} className={`${i % 2 === 0 ? (isDark ? 'bg-zinc-900' : 'bg-white') : (isDark ? 'bg-black' : 'bg-gray-50')} border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                  <td className={`p-3 font-mono font-bold ${isDark ? 'text-white' : 'text-black'}`}>{t.codigo}</td>
                  <td className="p-3"><span className={`px-2 py-1 border text-[10px] font-black uppercase ${service.statusCor(t.status)}`}>{t.status}</span></td>
                  <td className={`p-3 ${isDark ? 'text-zinc-300' : 'text-black'}`}>{t.cidade_nome || '-'}</td>
                  <td className={`p-3 ${isDark ? 'text-zinc-300' : 'text-black'}`}>{t.freela_nome?.split(' ')[0] || `Freela #${t.freela_id}`}</td>
                  <td className={`p-3 font-mono ${isDark ? 'text-white' : 'text-black'}`}>{service.formatarMoeda(t.valor_base)}</td>
                  <td className={`p-3 font-mono ${isDark ? 'text-white' : 'text-black'}`}>{service.formatarMoeda(t.taxa_valor)}</td>
                  <td className={`p-3 font-mono font-black ${isDark ? 'text-white' : 'text-black'}`}>{service.formatarMoeda(t.valor_total_contratante)}</td>
                  <td className={`p-3 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{service.formatarData(t.criado_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Regras de negócio */}
      <div className={`mt-6 p-4 border-2 ${isDark ? 'bg-zinc-900 border-white/20 text-zinc-300' : 'bg-yellow-50 border-black/10 text-black'}`}>
        <h4 className="font-black uppercase text-xs">📋 Regras de Negócio - Transações</h4>
        <ul className="mt-2 text-[11px] list-disc pl-4 space-y-1">
          <li>Pagamento antecipado obrigatório: 60 minutos antes do trampo (variável PAGAMENTO_ANTECEDENCIA_MINUTOS)</li>
          <li>Expiração automática: se não confirmar código início até início + 30min → NO_SHOW (variável PAGAMENTO_EXPIRA_AUTO_MINUTOS)</li>
          <li>Taxa intermediação: 15% padrão (TAXA_INTERMEDIACAO_PERCENTUAL) - contratante paga, freela recebe líquido</li>
          <li>Escrow libera em 24h após finalização (ESCROW_LIBERACAO_AUTOMATICA_HORAS)</li>
          <li>Cancelamento &lt; 4h: multa R$40 (TAXA_CANCELAMENTO_VALOR)</li>
          <li>Freela banimento por no-show: 3 meses (FREELA_BANIMENTO_MESES) se FREELA_BANIMENTO_POR_NO_SHOW = true</li>
        </ul>
      </div>
    </div>
  );
}
