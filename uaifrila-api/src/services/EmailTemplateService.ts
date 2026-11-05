import { EmailTemplateRepository } from '../repositories/EmailTemplateRepository';
import { EmailTemplateModel } from '../models/EmailTemplateModel';
export class EmailTemplateService {
  private repo: EmailTemplateRepository;
  constructor() { this.repo = new EmailTemplateRepository(); }
  async listar(): Promise<EmailTemplateModel[]> { return await this.repo.buscarTodos(); }
  async buscarPorId(id: number): Promise<EmailTemplateModel> { const t = await this.repo.buscarPorId(id); if (!t) throw new Error('Template não encontrado'); return t; }
  async buscarPorChave(chave: string): Promise<EmailTemplateModel | null> { return await this.repo.buscarPorChave(chave); }
  async criar(dados: any): Promise<EmailTemplateModel> { return await this.repo.criarGenerico(dados); }
  async atualizar(id: number, dados: any): Promise<EmailTemplateModel | null> { return await this.repo.atualizarGenerico(id, dados); }
  async deletar(id: number): Promise<boolean> { return await this.repo.deletarPorId(id); }
}
