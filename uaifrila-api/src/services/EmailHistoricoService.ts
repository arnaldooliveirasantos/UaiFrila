import { EmailHistoricoRepository } from '../repositories/EmailHistoricoRepository';
import { EmailHistoricoModel } from '../models/EmailHistoricoModel';
export class EmailHistoricoService {
  private repo = new EmailHistoricoRepository();
  async listar(): Promise<EmailHistoricoModel[]> { return await this.repo.buscarTodos(); }
  async listarPorUsuario(usuarioId: number): Promise<EmailHistoricoModel[]> { return await this.repo.listarPorUsuario(usuarioId); }
  async listarPorEmail(email: string): Promise<EmailHistoricoModel[]> { return await this.repo.listarPorEmail(email); }
  async buscarPorId(id: number): Promise<EmailHistoricoModel> { const h = await this.repo.buscarPorId(id); if (!h) throw new Error('Historico nao encontrado'); return h; }
  async buscarCodigoValido(email: string, codigo: string): Promise<any | null> { return await this.repo.buscarCodigoValido(email, codigo); }
  async buscarUltimoPorEmailCodigo(email: string, codigo: string): Promise<any | null> { return await this.repo.buscarUltimoPorEmailCodigo(email, codigo); }
  async buscarCodigoParaCancelar(email: string, codigo: string): Promise<any | null> { return await this.repo.buscarCodigoParaCancelar(email, codigo); }
  async invalidarPendentes(email: string): Promise<void> { await this.repo.invalidarPendentes(email); }
  async marcarComoConsumido(id: number): Promise<void> { await this.repo.marcarComoConsumido(id); }
  async criarCodigo(dados: any): Promise<any> { return await this.repo.criarCodigo(dados); }
  async criar(dados: any): Promise<EmailHistoricoModel> { return await this.repo.criarGenerico(dados); }
  async deletar(id: number): Promise<boolean> { return await this.repo.deletarPorId(id); }
}
