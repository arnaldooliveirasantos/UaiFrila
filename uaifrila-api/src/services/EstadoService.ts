
import { EstadoRepository } from '../repositories/EstadoRepository';

export class EstadoService {
  private repo: EstadoRepository;
  constructor() { this.repo = new EstadoRepository(); }

  async listarTodos() {
    return await this.repo.listarTodos();
  }

  async listarAtivos() {
    return await this.repo.listarAtivos();
  }

  async buscarPorId(id: number) {
    const estado = await this.repo.buscarPorId(id);
    if (!estado) throw new Error('Estado não encontrado');
    return estado;
  }

  async buscarPorSigla(sigla: string) {
    return await this.repo.buscarPorSigla(sigla);
  }
}
