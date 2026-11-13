import { CandidatoRepository } from '../repositories/CandidatoRepository';
import { BaseService } from './BaseService';
import { UsuarioModel } from '../models/UsuarioModel';
// SEM MOCK: a versao antiga inventava distancia ("1.2 km", "3.6 km"...) e foto
// (dicebear com URL quebrada) para cada candidato. Agora so dado real do banco.
export class CandidatoService extends BaseService<UsuarioModel> {
  constructor() { super(new CandidatoRepository()); }
  async listarCandidatosPorVaga(vagaId: number): Promise<any[]> {
    const id = Number(vagaId);
    if (!id || isNaN(id)) throw new Error('vagaId invalido');
    const rows = await (this.getRepo() as CandidatoRepository).listarCandidatosPorVaga(id);
    return rows.map((f: any) => {
      const mediaFuncao = f.media_funcao != null ? Number(f.media_funcao) : null;
      const tramposFuncao = Number(f.trampos_funcao_comprovados || 0);
      const declarada = (Array.isArray(f.funcoes_declaradas) ? f.funcoes_declaradas : []).find((x: any) => x.funcao_nome === f.funcao_vaga);
      const mesesDeclarados = Number(declarada?.tempo_experiencia_meses || 0);
      // Match 0-100: 40% experiência na função (declarada+comprovada), 35% nota na função (ou geral), 25% histórico no app
      const ptsExp = Math.min(40, mesesDeclarados / 60 * 20 + Math.min(20, tramposFuncao * 2));
      const ptsNota = ((mediaFuncao ?? Number(f.media_avaliacao ?? 5)) / 5) * 35;
      const ptsHist = Math.min(25, Number(f.trampos_concluidos_app || 0) * 2 - Number(f.candidaturas_canceladas || 0) * 5);
      const match = Math.max(0, Math.min(100, Math.round(ptsExp + ptsNota + ptsHist)));
      return { id: f.freela_id, freela_id: f.freela_id, nome: f.nome, foto: f.foto || null,
        media: Number(f.media_avaliacao ?? 5).toFixed(1), media_avaliacao: Number(f.media_avaliacao ?? 5).toFixed(1),
        total_avaliacoes: Number(f.total_avaliacoes || 0),
        funcao_vaga: f.funcao_vaga, match_vaga: match,
        experiencia_funcao: { funcao: f.funcao_vaga, meses_declarados: mesesDeclarados, trampos_comprovados: tramposFuncao,
          media_funcao: mediaFuncao != null ? Number(mediaFuncao.toFixed(1)) : null, ultimo_trampo_em: f.ultimo_trampo_funcao_em || null },
        funcoes_declaradas: f.funcoes_declaradas || [],
        historico_app: { trampos_concluidos: Number(f.trampos_concluidos_app || 0), candidaturas_canceladas: Number(f.candidaturas_canceladas || 0) },
        avaliacoes_recentes: f.avaliacoes_recentes || [],
        trampos: Number(f.trampos_concluidos_app || 0), total_trampos: Number(f.trampos_concluidos_app || 0) };
    });
  }
}
