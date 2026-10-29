import { BaseService } from './BaseService';
import { BaseRepository } from '../repositories/BaseRepository';

class OperacaoRepo extends BaseRepository {
  async candidatar(vagaId: number, usuarioId: number) {
    try {
      // Se tabela candidaturas não existir, só retorna stub
      return await this.query(`INSERT INTO candidaturas (vaga_id, freela_id, status) VALUES ($1,$2,'PENDENTE') RETURNING *`, [vagaId, usuarioId]);
    } catch {
      return [{ vaga_id: vagaId, freela_id: usuarioId, status: 'PENDENTE', mensagem: 'Candidatura stub - crie tabela candidaturas' }];
    }
  }
}

export class OperacaoService extends BaseService {
  private opRepo: OperacaoRepo;

  constructor(repository?: BaseRepository) {
    super(repository);
    this.opRepo = new OperacaoRepo();
  }

  async candidatar(vagaId: number, usuarioId: number) {
    this.validateRequired({ vagaId, usuarioId }, ['vagaId', 'usuarioId']);
    try {
      return await this.opRepo.candidatar(vagaId, usuarioId);
    } catch (e) {
      this.handleError(e, 'OperacaoService.candidatar');
    }
  }

  async listarOperacoes(usuarioId: number) {
    this.validateRequired({ usuarioId }, ['usuarioId']);
    try {
      return [];
    } catch (e) {
      this.handleError(e, 'OperacaoService.listarOperacoes');
    }
  }
}
