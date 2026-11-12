import { TrampoRepository } from '../repositories/TrampoRepository';
import { VariavelSistemaRepository } from '../repositories/VariavelSistemaRepository';
// Regra "Meus Ganhos": freela recebe 85% (intermediacao 15% - termo 5 do cadastro).
// Se variaveis_sistema tiver COMISSAO_APLICATIVO / TAXA_PLATAFORMA_PERCENTUAL /
// INTERMEDIACAO_PERCENTUAL, usa ela. Se o trampo ja tiver freela_recebe_liquido,
// usa ele. SEM MOCK: sem trampos -> [] com totais 0.
export class GanhosService {
  private trampoRepo = new TrampoRepository();
  private variavelRepo = new VariavelSistemaRepository();
  async meusGanhos(usuarioId: number, filtros: any): Promise<{ ganhos: any[]; resumo: any; comissao_percentual: number }> {
    const id = Number(usuarioId);
    if (!id || isNaN(id)) throw new Error('Usuario invalido');
    let comissaoPct = 15;
    try {
      for (const chave of ['COMISSAO_APLICATIVO', 'TAXA_PLATAFORMA_PERCENTUAL', 'INTERMEDIACAO_PERCENTUAL']) {
        const n = await this.variavelRepo.buscarNumero(chave, NaN as any);
        if (!isNaN(n)) { comissaoPct = n; break; }
      }
    } catch {}
    const rows = await this.trampoRepo.listarGanhosRaw(id, filtros || {});
    const ganhos = rows.map((row: any) => {
      const bruto = Number(row.valor_total ?? row.valor_servico ?? 0) || 0;
      const liquidoJaCalculado = Number(row.freela_recebe_liquido ?? row.valor_liquido ?? row.valor_freela ?? NaN);
      const liquido = !isNaN(liquidoJaCalculado) && liquidoJaCalculado > 0 ? liquidoJaCalculado : bruto * (1 - comissaoPct / 100);
      const comissao = bruto - liquido;
      return { id: row.id, trampo_id: row.id, vaga_id: row.vaga_id, vaga_titulo: row.vaga_titulo,
        funcao: row.vaga_funcao || row.funcao, contratante_id: row.contratante_id, contratante_nome: row.contratante_nome,
        cidade_nome: row.cidade_nome, status: row.status, data_inicio: row.data_inicio, data_fim: row.data_fim,
        criado_em: row.criado_em, valor_bruto: bruto, comissao_percentual: comissaoPct,
        comissao: Number(comissao.toFixed(2)), valor_liquido: Number(liquido.toFixed(2)),
        valor_hora: row.valor_hora_base ?? null };
    });
    const resumo = { total_bruto: 0, total_comissao: 0, total_liquido: 0, total_trampos: ganhos.length, total_horas: 0 };
    for (const g of ganhos) {
      resumo.total_bruto += g.valor_bruto; resumo.total_comissao += g.comissao; resumo.total_liquido += g.valor_liquido;
      if (g.data_inicio && g.data_fim) resumo.total_horas += (new Date(g.data_fim).getTime() - new Date(g.data_inicio).getTime()) / 3600000;
    }
    resumo.total_bruto = Number(resumo.total_bruto.toFixed(2));
    resumo.total_comissao = Number(resumo.total_comissao.toFixed(2));
    resumo.total_liquido = Number(resumo.total_liquido.toFixed(2));
    resumo.total_horas = Number(resumo.total_horas.toFixed(1));
    return { ganhos, resumo, comissao_percentual: comissaoPct };
  }
}
