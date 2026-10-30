
import { VagaRepository } from '../repositories/VagaRepository';
import { BaseRepository } from '../repositories/BaseRepository';

export class EnderecoVagaService {
  private repo: VagaRepository;
  constructor() { this.repo = new VagaRepository(); }
  async buscarPorVagaId(vagaId: number) {
    try {
      const r = this.repo as any;
      if (r.buscarEnderecoPorVagaId) return await r.buscarEnderecoPorVagaId(vagaId);
      const pool = BaseRepository.getPool() as any;
      if (!pool) return null;
      const rows = await pool.query('SELECT * FROM enderecos_Vaga WHERE vaga_id=$1 AND is_ativo=true LIMIT 1', [vagaId]);
      return rows.rows[0] || null;
    } catch { return null; }
  }
  async atualizarEnderecoVaga(vagaId: number, dados: any) {
    try {
      const r = this.repo as any;
      if (r.atualizarEnderecoVaga) return await r.atualizarEnderecoVaga(vagaId, dados);
      const pool = BaseRepository.getPool() as any;
      if (!pool) return null;
      const rows = await pool.query('UPDATE enderecos_Vaga SET endereco_completo=$2, atualizado_em=NOW() WHERE vaga_id=$1 RETURNING *', [vagaId, dados.endereco_completo]);
      return rows.rows[0] || null;
    } catch { return null; }
  }
}
