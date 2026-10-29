
import { VagaRepository } from '../repositories/VagaRepository';
import { BaseRepository } from '../repositories/BaseRepository';

export class VagaService {
  private repository: VagaRepository;

  constructor() {
    this.repository = new VagaRepository();
  }

  async criarVaga(dados: any) {
    if (!dados.titulo || !dados.data_inicio || !dados.data_fim) {
      throw new Error('titulo, data_inicio e data_fim obrigatórios');
    }
    if (dados.valor_servico < 75) {
      // Busca VALOR_MINIMO_VAGA de variaveis_sistema
      try {
        const pool = BaseRepository.getPool();
        const res = await pool.query(`SELECT valor_numerico FROM variaveis_sistema WHERE chave='VALOR_MINIMO_VAGA' LIMIT 1`);
        const minimo = res.rows[0]?.valor_numerico ? Number(res.rows[0].valor_numerico) : 75;
        if (dados.valor_servico < minimo) throw new Error(`Valor mínimo R$ ${minimo}`);
      } catch {}
    }
    return await this.repository.criarVaga(dados);
  }

  async listarPorContratante(contratanteId: number) {
    return await this.repository.listarVagasPorContratante(contratanteId);
  }

  async buscarMural(usuarioId: number, page = 1, limit = 20) {
    return await this.repository.buscarMuralSemBloqueiosDeAvaliacao(usuarioId, page, limit);
  }

  async buscarPorId(id: number) {
    const vaga = await this.repository.buscarPorId(id);
    if (!vaga) throw new Error('Vaga não encontrada');
    return vaga;
  }

  async atualizarVaga(id: number, dados: any) {
    return await this.repository.atualizarVaga(id, dados);
  }

  async cancelarVaga(id: number) {
    return await this.repository.cancelarVaga(id);
  }
}
