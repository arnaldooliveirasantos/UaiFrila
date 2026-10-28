import React, { useState, useEffect } from 'react';

const API = (import.meta as any).env?.VITE_API_URL || 'http://192.168.24.11:3000/api';

interface TaxasSistema {
  valor_minimo_vaga: number;
  comissao_percentual: number;
  taxa_pix_percentual: number;
  taxa_cartao_percentual: number;
}

const TAXAS_DEFAULT: TaxasSistema = {
  valor_minimo_vaga: 75.00,
  comissao_percentual: 10.00,
  taxa_pix_percentual: 1.00,
  taxa_cartao_percentual: 4.00,
};

function formatarDataLocal(utc: string): string {
  if (!utc) return '';
  try { const d = new Date(utc); return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return utc; }
}

function calcularHoras(inicio: string, fim: string): number {
  if (!inicio || !fim) return 0;
  const d1 = new Date(inicio);
  const d2 = new Date(fim);
  const diff = d2.getTime() - d1.getTime();
  if (diff <= 0) return 0;
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
}

export default function MuralVagas(props: any) {
  const [vagas, setVagas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [taxas, setTaxas] = useState<TaxasSistema>(TAXAS_DEFAULT);

  const carregarTaxas = async () => {
    try {
      const token = localStorage.getItem('uaifrila_token');
      const res = await fetch(`${API}/variaveis`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const vars = data.variaveis || data || [];
        const find = (ch: string) => vars.find((x: any) => x.chave === ch);
        setTaxas({
          valor_minimo_vaga: parseFloat(find('VALOR_MINIMO_VAGA')?.valor_numerico || '75'),
          comissao_percentual: parseFloat((find('COMISSAO_APLICATIVO') || find('TAXA_PLATAFORMA_PERCENTUAL'))?.valor_numerico || '10'),
          taxa_pix_percentual: parseFloat(find('TAXA_PIX_PERCENTUAL')?.valor_numerico || '1'),
          taxa_cartao_percentual: parseFloat(find('TAXA_CARTAO_PERCENTUAL')?.valor_numerico || '4'),
        });
      }
    } catch {}
  };

  const carregar = async () => {
    setCarregando(true);
    try {
      const token = localStorage.getItem('uaifrila_token');
      const res = await fetch(`${API}/vagas/mural`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      const lista = data.vagas || data.mural || data || [];
      setVagas(lista);
    } catch (e: any) { console.error(e); } finally { setCarregando(false); }
  };

  useEffect(() => { carregarTaxas(); carregar(); }, []);

  const candidatar = async (vagaId: number) => {
    try {
      const token = localStorage.getItem('uaifrila_token');
      const res = await fetch(`${API}/vagas/candidatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ vaga_id: vagaId })
      });
      const data = await res.json();
      if (res.ok) { alert('Candidatura enviada!'); carregar(); }
      else alert(data.erro || 'Erro ao candidatar');
    } catch (e: any) { alert('Erro: ' + e.message); }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8">
      <div className="bg-[#1a1a1a] border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
        <h1 className="text-2xl font-black uppercase text-white">Mural de Vagas</h1>
        <p className="text-white text-xs mt-2 opacity-70">Calculo exato: Servico R$75 + Transporte R$15 = Base R$90 | Taxa PIX 1% R$0,90 + Comissao 10% R$9,00 | Total R$90 | Freela R$80,10</p>
      </div>

      <div className="space-y-4">
        {carregando && <div className="bg-white border-4 border-black p-6 font-bold">Carregando...</div>}
        {!carregando && vagas.length === 0 && <div className="bg-white border-4 border-black p-6 font-bold">Nenhuma vaga.</div>}

        {!carregando && vagas.map((v: any) => {
          const horas = calcularHoras(v.data_inicio, v.data_fim);
          const transporte = Number(v.ajuda_custo_transporte || v.ajuda_transporte || 0);
          const valorServico = Number(v.valor_servico || 0) > 0 ? Number(v.valor_servico) : (Number(v.valor_hora || 0) * horas) || (Number(v.total_contratante || 0) - transporte) || 75;
          const meioPagamento = (v.meio_pagamento || 'pix') as 'pix' | 'cartao';
          const baseCalculo = valorServico + transporte; // Base = Servico + Transporte = 90
          const taxaPercent = meioPagamento === 'pix' ? taxas.taxa_pix_percentual : taxas.taxa_cartao_percentual;
          const taxaPagamento = baseCalculo * taxaPercent / 100; // 90 * 1% = 0,90
          const comissaoApp = baseCalculo * taxas.comissao_percentual / 100; // 90 * 10% = 9,00
          const totalContratante = baseCalculo; // Total que contratante paga = Base = R$90,00
          const freelaRecebe = baseCalculo - taxaPagamento - comissaoApp; // Freela recebe = 90 - 0,90 - 9 = 80,10
          // CORRIGIDO: Valor hora = Valor freela / Horas
          const valorHora = horas > 0 ? freelaRecebe / horas : freelaRecebe;

          return (
            <div key={v.id} className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-black uppercase">{v.funcao} - {v.titulo}</h3>
                  <p className="text-xs mt-1 opacity-70">{v.descricao}</p>
                  <p className="text-xs mt-2 font-bold">📅 {formatarDataLocal(v.data_inicio)} → {formatarDataLocal(v.data_fim)} • {horas.toFixed(2)}h • {meioPagamento.toUpperCase()}</p>
                  <p className="text-[10px] mt-1">📍 {v.cidade_nome} - {v.bairro}</p>
                  
                  <div className="mt-3 bg-[#FFC700] border-2 border-black p-3">
                    <p className="text-[11px] font-black uppercase">💰 Valor da Hora (Freela) - Calculo Exato:</p>
                    <div className="mt-2 space-y-1 text-xs font-bold">
                      <div className="flex justify-between text-lg bg-black text-white p-2">
                        <span>Valor hora (Freela / Horas):</span>
                        <span>R$ {valorHora.toFixed(2).replace('.', ',')}/h</span>
                      </div>
                      <div className="flex justify-between"><span>Valor do Servico:</span><span>R$ {valorServico.toFixed(2).replace('.', ',')}</span></div>
                      <div className="flex justify-between"><span>Transporte:</span><span>R$ {transporte.toFixed(2).replace('.', ',')}</span></div>
                      <div className="flex justify-between border-t-2 border-black pt-1 font-black"><span>Base = Servico + Transporte:</span><span>R$ {baseCalculo.toFixed(2).replace('.', ',')}</span></div>
                      <div className="flex justify-between text-[10px] opacity-70"><span>Taxa {meioPagamento.toUpperCase()} {taxaPercent}% sobre base R$ {baseCalculo.toFixed(2)}:</span><span>R$ {taxaPagamento.toFixed(2).replace('.', ',')}</span></div>
                      <div className="flex justify-between text-[10px] opacity-70"><span>Comissao {taxas.comissao_percentual}% sobre base R$ {baseCalculo.toFixed(2)}:</span><span>R$ {comissaoApp.toFixed(2).replace('.', ',')}</span></div>
                      <div className="flex justify-between border-t-2 border-black pt-2 text-sm"><span>Total contratante paga:</span><span>R$ {totalContratante.toFixed(2).replace('.', ',')}</span></div>
                      <div className="flex justify-between text-green-700 text-sm font-black"><span>Freela recebe:</span><span>R$ {freelaRecebe.toFixed(2).replace('.', ',')}</span></div>
                      <div className="text-[9px] opacity-60 mt-1 bg-white p-1 border">
                        Ex: Servico R$75 + Transporte R$15 = Base R$90 | Taxa PIX 1% R$0,90 + Comissao 10% R$9,00 | Total R$90 | Freela R$80,10<br/>
                        Calculo: {baseCalculo.toFixed(2)} - {taxaPagamento.toFixed(2)} - {comissaoApp.toFixed(2)} = {freelaRecebe.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-yellow-400 text-black px-2 py-1 font-black border-2 border-black ml-2">{v.status} #{v.id}</span>
              </div>
              <button onClick={() => candidatar(v.id)} className="mt-3 w-full md:w-auto px-6 py-3 bg-black text-white border-2 border-black text-xs font-black uppercase">
                ✋ CANDIDATAR - R$ {valorHora.toFixed(2)}/h • Recebe R$ {freelaRecebe.toFixed(2)}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
