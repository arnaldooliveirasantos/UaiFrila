
import { MuralVagasRepository } from '../repositories/MuralVagasRepository';
import { VagaRepository } from '../repositories/VagaRepository';
import { BaseRepository } from '../repositories/BaseRepository';

export class MuralVagasService {
  private repository: MuralVagasRepository;
  private vagaRepo: VagaRepository;
  constructor() { 
    this.repository = new MuralVagasRepository();
    this.vagaRepo = new VagaRepository();
  }

  async obterMural(usuarioId: number, page = 1, limit = 20) {
    if (!usuarioId) throw new Error('usuarioId obrigatório');
    try {
      const repo = this.repository as any;
      if (repo.buscarMural) return await repo.buscarMural(usuarioId, page, limit);
      
      // Fallback: usa VagaRepository
      const vagaRepo = this.vagaRepo as any;
      if (vagaRepo.buscarMuralSemBloqueiosDeAvaliacao) {
        return await vagaRepo.buscarMuralSemBloqueiosDeAvaliacao(usuarioId);
      }
      if (vagaRepo.buscarMural) {
        return await vagaRepo.buscarMural(usuarioId, page, limit);
      }
      
      // Fallback final: query direta
      const pool = BaseRepository.getPool() as any;
      if (!pool) return [];
      const limitVal = limit || 20;
      const offset = (page-1)*limitVal;
      const rows = await pool.query("SELECT * FROM vagas WHERE status='ABERTA' ORDER BY criado_em DESC LIMIT $1 OFFSET $2", [limitVal, offset]);
      return rows.rows;
    } catch (e:any) {
      console.error('[MuralVagasService] Erro:', e.message);
      return [];
    }
  }
}
