import { Response } from 'express';
import { BaseRepository } from '../repositories/BaseRepository';
import { BaseController, AuthRequest } from './BaseController';

// Relatório "Meus Ganhos" - quanto o usuário ganhou ao fazer os Trampos.
// Fonte: trampos FINALIZADOS/CONCLUÍDOS do freela + valores da vaga.
// SEM MOCK: tudo do banco. Se trampos não existir / sem colunas, devolve [] com totais 0, não inventa.
// Filtros (query): data_inicio (YYYY-MM-DD), data_fim, status (FINALIZADO|CONCLUIDO|EM_ANDAMENTO|TODOS), contratante_id, funcao, busca
// Regra de valor: freela recebe 85% (intermediação 15% - termo 5 do cadastro). Se variaveis_sistema tiver
// COMISSAO_APLICATIVO / TAXA_PLATAFORMA_PERCENTUAL, usa ela. Se a vaga já tiver freela_recebe_liquido, usa ele.
export class GanhosController extends BaseController {
  meusGanhos = async (req: AuthRequest, res: Response) => {
    try {
      const pool = (BaseRepository as any).getPool ? (BaseRepository as any).getPool() : null;
      if (!pool) return this.error(res, 'Banco não conectado', 500);
      const usuarioId = Number(req.usuario!.id);
      const { data_inicio, data_fim, status, contratante_id, funcao, busca } = (req.query || {}) as any;
      // Comissão da plataforma (default 15%)
      let comissaoPct = 15;
      try {
        const rv = await pool.query(`SELECT chave, valor_numerico, valor FROM variaveis_sistema WHERE chave IN ('COMISSAO_APLICATIVO','TAXA_PLATAFORMA_PERCENTUAL','INTERMEDIACAO_PERCENTUAL')`);
        for (const row of rv.rows || []) {
          const n = parseFloat(row.valor_numerico ?? row.valor);
          if (!isNaN(n)) { comissaoPct = n; break; }
        }
      } catch {}
      // Descobre colunas de trampos de forma tolerante
      let cols: string[] = [];
      try { const rc = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'trampos'`); cols = (rc.rows || []).map((r: any) => r.column_name); } catch {}
      if (!cols.length) return res.json({ success: true, data: [], ganhos: [], resumo: { total_bruto: 0, total_comissao: 0, total_liquido: 0, total_trampos: 0, total_horas: 0 }, comissao_percentual: comissaoPct });
      const has = (c: string) => cols.includes(c);
      const freelaCol = has('freela_id') ? 'freela_id' : has('usuario_id') ? 'usuario_id' : has('freela_usuario_id') ? 'freela_usuario_id' : null;
      const vagaCol = has('vaga_id') ? 'vaga_id' : null;
      const statusCol = has('status') ? 'status' : null;
      const dataCol = has('data_fim') ? 'data_fim' : has('criado_em') ? 'criado_em' : has('data_inicio') ? 'data_inicio' : null;
      if (!freelaCol) return res.json({ success: true, data: [], ganhos: [], resumo: { total_bruto: 0, total_comissao: 0, total_liquido: 0, total_trampos: 0, total_horas: 0 }, comissao_percentual: comissaoPct });
      const where: string[] = [`t.${freelaCol} = $1`];
      const vals: any[] = [usuarioId];
      let pi = 2;
      if (data_inicio && dataCol) { where.push(`DATE(t.${dataCol}) >= $${pi++}`); vals.push(data_inicio); }
      if (data_fim && dataCol) { where.push(`DATE(t.${dataCol}) <= $${pi++}`); vals.push(data_fim); }
      if (status && String(status).toUpperCase() !== 'TODOS' && statusCol) { where.push(`UPPER(t.${statusCol}) = $${pi++}`); vals.push(String(status).toUpperCase()); }
      if (contratante_id && vagaCol) { where.push(`v.contratante_id = $${pi++}`); vals.push(Number(contratante_id)); }
      if (funcao && vagaCol) { where.push(`(v.funcao ILIKE $${pi} OR v.titulo ILIKE $${pi})`); vals.push(`%${funcao}%`); pi++; }
      if (busca && vagaCol) { where.push(`(v.titulo ILIKE $${pi} OR v.descricao ILIKE $${pi})`); vals.push(`%${busca}%`); pi++; }
      const sql = `SELECT t.*, v.titulo AS vaga_titulo, v.funcao AS vaga_funcao, v.valor_servico, v.valor_total, v.valor_transporte,
        v.contratante_id, u.nome_completo AS contratante_nome, c.nome AS cidade_nome
        FROM trampos t
        ${vagaCol ? 'LEFT JOIN vagas v ON v.id = t.vaga_id' : ''}
        ${vagaCol ? 'LEFT JOIN usuarios u ON u.id = v.contratante_id' : ''}
        ${vagaCol ? 'LEFT JOIN cidades c ON c.id = v.cidade_id' : ''}
        WHERE ${where.join(' AND ')} ORDER BY t.${dataCol || 'id'} DESC`;
      const r = await pool.query(sql, vals);
      const ganhos = (r.rows || []).map((row: any) => {
        const bruto = Number(row.valor_total ?? row.valor_servico ?? 0) || 0;
        const liquidoJaCalculado = Number(row.freela_recebe_liquido ?? row.valor_liquido ?? row.valor_freela ?? NaN);
        const liquido = !isNaN(liquidoJaCalculado) && liquidoJaCalculado > 0 ? liquidoJaCalculado : bruto * (1 - comissaoPct / 100);
        const comissao = bruto - liquido;
        return { id: row.id, trampo_id: row.id, vaga_id: row.vaga_id, vaga_titulo: row.vaga_titulo, funcao: row.vaga_funcao || row.funcao, contratante_id: row.contratante_id, contratante_nome: row.contratante_nome, cidade_nome: row.cidade_nome, status: row.status, data_inicio: row.data_inicio, data_fim: row.data_fim, criado_em: row.criado_em, valor_bruto: bruto, comissao_percentual: comissaoPct, comissao: Number(comissao.toFixed(2)), valor_liquido: Number(liquido.toFixed(2)), valor_hora: row.valor_hora_base ?? null };
      });
      const resumo = { total_bruto: 0, total_comissao: 0, total_liquido: 0, total_trampos: ganhos.length, total_horas: 0 };
      for (const g of ganhos) { resumo.total_bruto += g.valor_bruto; resumo.total_comissao += g.comissao; resumo.total_liquido += g.valor_liquido; if (g.data_inicio && g.data_fim) resumo.total_horas += (new Date(g.data_fim).getTime() - new Date(g.data_inicio).getTime()) / 3600000; }
      resumo.total_bruto = Number(resumo.total_bruto.toFixed(2)); resumo.total_comissao = Number(resumo.total_comissao.toFixed(2)); resumo.total_liquido = Number(resumo.total_liquido.toFixed(2)); resumo.total_horas = Number(resumo.total_horas.toFixed(1));
      return res.json({ success: true, data: ganhos, ganhos, resumo, comissao_percentual: comissaoPct });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
