import { EmailHistoricoRepository } from '../repositories/EmailHistoricoRepository';
import { EmailHistoricoModel } from '../models/EmailHistoricoModel';
export class EmailHistoricoService {
  private repo: EmailHistoricoRepository;
  constructor() { this.repo = new EmailHistoricoRepository(); }
  async listar(): Promise<EmailHistoricoModel[]> { return await this.repo.buscarTodos(); }
  async listarPorUsuario(usuarioId: number): Promise<EmailHistoricoModel[]> { return await this.repo.listarPorUsuario(usuarioId); }
  async buscarPorId(id: number): Promise<EmailHistoricoModel> { const h = await this.repo.buscarPorId(id); if (!h) throw new Error('Histórico não encontrado'); return h; }
  async buscarCodigoValido(email: string, codigo: string): Promise<EmailHistoricoModel | null> { return await this.repo.buscarCodigoValido(email, codigo); }
  async criar(dados: any): Promise<EmailHistoricoModel> { return await this.repo.criarGenerico(dados); }
  async deletar(id: number): Promise<boolean> { return await this.repo.deletarPorId(id); }
}
