
import { AvaliacaoRepository } from '../repositories/AvaliacaoRepository';
import { AvaliacaoModel } from '../models/AvaliacaoModel';
import { BaseService } from './BaseService';

export class AvaliacaoService extends BaseService<AvaliacaoModel> {
  protected repository: AvaliacaoRepository;

  constructor() {
    super();
    this.repository = new AvaliacaoRepository();
  }

  async listarPorAvaliado(avaliadoId: number): Promise<AvaliacaoModel[]> {
    try {
      if (!avaliadoId) throw new Error('Avaliado ID obrigatório');
      return await this.repository.listarPorAvaliado(avaliadoId);
    } catch (e: any) {
      this.handleError(e, 'AvaliacaoService.listarPorAvaliado');
    }
  }

  async listarPorAvaliador(avaliadorId: number): Promise<AvaliacaoModel[]> {
    try {
      return await this.repository.listarPorAvaliador(avaliadorId);
    } catch (e: any) {
      this.handleError(e, 'AvaliacaoService.listarPorAvaliador');
    }
  }

  // FASE 4: trampos finalizados em que o usuário ainda NÃO avaliou a outra parte.
  // O saque (quando existir) usa esta lista como trava: sem avaliar, sem liberar.
  async pendentes(usuarioId: number): Promise<any[]> {
    const { BaseRepository } = await import('../repositories/BaseRepository');
    const pool = BaseRepository.getPool() as any;
    const r = await pool.query(
      `SELECT t.id as trampo_id, t.vaga_id, v.titulo as vaga_titulo,
              CASE WHEN t.freela_id = $1 THEN t.contratante_id ELSE t.freela_id END as avaliado_id,
              CASE WHEN t.freela_id = $1 THEN u2.nome_completo ELSE u1.nome_completo END as avaliado_nome,
              t.data_fim
       FROM trampos t JOIN vagas v ON v.id = t.vaga_id
       LEFT JOIN usuarios u1 ON u1.id = t.contratante_id
       LEFT JOIN usuarios u2 ON u2.id = t.freela_id
       WHERE (t.freela_id = $1 OR t.contratante_id = $1) AND t.status = 'FINALIZADO'
         AND NOT EXISTS (SELECT 1 FROM avaliacoes a WHERE a.trampo_id = t.id AND a.avaliador_id = $1)
       ORDER BY t.data_fim DESC NULLS LAST`, [usuarioId]);
    return r.rows || [];
  }

  async minhasAvaliacoes(usuarioId: number): Promise<AvaliacaoModel[]> {
    return this.listarPorAvaliador(usuarioId);
  }

  async criarAvaliacao(dados: { avaliadorId: number, avaliadoId: number, nota: number, comentario?: string, trampoId?: number }): Promise<AvaliacaoModel> {
    try {
      this.validateRequired(dados, ['avaliadorId', 'avaliadoId', 'nota']);
      if (dados.nota < 1 || dados.nota > 5) throw new Error('Nota deve ser entre 1 e 5');
      if (dados.avaliadorId === dados.avaliadoId) throw new Error('Não pode avaliar a si mesmo');
      return await this.criar(dados);
    } catch (e: any) {
      this.handleError(e, 'AvaliacaoService.criarAvaliacao');
    }
  }
}
