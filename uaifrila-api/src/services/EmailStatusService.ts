import { EmailStatusRepository } from '../repositories/EmailStatusRepository';
import { EmailStatusModel } from '../models/EmailStatusModel';
export class EmailStatusService {
  private repo: EmailStatusRepository;
  constructor() { this.repo = new EmailStatusRepository(); }
  async listar(): Promise<EmailStatusModel[]> { return await this.repo.buscarTodos(); }
  async buscarPorId(id: number): Promise<EmailStatusModel> { const s = await this.repo.buscarPorId(id); if (!s) throw new Error('Status não encontrado'); return s; }
  async buscarPorChave(chave: string): Promise<EmailStatusModel | null> { return await this.repo.buscarPorChave(chave); }
  async criar(dados: any): Promise<EmailStatusModel> { return await this.repo.criarGenerico(dados); }
  async deletar(id: number): Promise<boolean> { return await this.repo.deletarPorId(id); }
}
