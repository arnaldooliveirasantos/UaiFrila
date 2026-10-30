
import { BaseService } from './BaseService';
import { BaseRepository } from '../repositories/BaseRepository';

export class OperacaoService extends BaseService {
  private repository: BaseRepository;
  constructor(repository?: BaseRepository) {
    super();
    this.repository = repository || new BaseRepository();
  }
  async candidatar(dados: any) {
    try {
      this.validateRequired(dados, ['vagaId', 'usuarioId']);
      const pool = BaseRepository.getPool() as any;
      if (!pool) throw new Error('Pool não configurado');
      const rows = await pool.query('INSERT INTO candidaturas (vaga_id, usuario_id, freela_id, status) VALUES ($1,$2,$2,$3) RETURNING *', [dados.vagaId, dados.usuarioId, 'PENDENTE']);
      return rows.rows[0];
    } catch (e:any) { this.handleError(e, 'OperacaoService.candidatar'); throw e; }
  }
  async listarOperacoes(usuarioId: number) {
    try {
      this.validateRequired({ usuarioId }, ['usuarioId']);
      const pool = BaseRepository.getPool() as any;
      if (!pool) return [];
      const rows = await pool.query('SELECT * FROM candidaturas WHERE usuario_id=$1 ORDER BY criado_em DESC', [usuarioId]);
      return rows.rows;
    } catch (e:any) { this.handleError(e, 'OperacaoService.listarOperacoes'); throw e; }
  }
}
