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
    return rows.map((f: any) => ({
      id: f.freela_id,
      freela_id: f.freela_id,
      nome: f.nome,
      media: Number(f.media_avaliacao ?? 5).toFixed(1),
      media_avaliacao: Number(f.media_avaliacao ?? 5).toFixed(1),
      trampos: Number(f.total_trampos ?? 0),
      total_trampos: Number(f.total_trampos ?? 0),
    }));
  }
}
