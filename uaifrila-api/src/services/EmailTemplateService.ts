
import { EmailTemplateRepository } from '../repositories/EmailTemplateRepository';

export interface VariaveisTemplate {
  NOME?: string;
  EMAIL?: string;
  CODIGO?: string;
  LINK_VALIDAR?: string;
  LINK_CANCELAR?: string;
  FRONTEND_URL?: string;
  TEMPO_EXPIRACAO?: string | number;
  [key: string]: any;
}

export class EmailTemplateService {
  private repository: EmailTemplateRepository;
  constructor() { this.repository = new EmailTemplateRepository(); }

  async buscarPorChave(chave: string) {
    const template = await this.repository.buscarPorChave(chave);
    if (!template) throw new Error(`Template ${chave} não encontrado em email_templates - Rode sql/02-ATUALIZAR-EMAIL-TEMPLATES-LINKS.sql`);
    return template;
  }

  async listarTodas() { return await this.repository.listarTodas(); }

  renderizar(conteudo: string, variaveis: VariaveisTemplate): string {
    let html = conteudo;
    for (const [key, value] of Object.entries(variaveis)) {
      const placeholder = `{{${key}}}`;
      html = html.split(placeholder).join(String(value ?? ''));
    }
    return html.replace(/\{\{[A-Z_]+\}\}/g, '');
  }

  gerarLinks(email: string, codigo: string, tipo: 'cadastro' | 'login', frontendUrl?: string) {
    const baseUrl = frontendUrl || process.env.FRONTEND_URL || 'http://192.168.24.11:5173';
    const linkValidar = `${baseUrl}/?email=${encodeURIComponent(email)}&codigo=${codigo}&tipo=${tipo}`;
    const linkCancelar = `${baseUrl}/?email=${encodeURIComponent(email)}&acao=cancelar&token=${codigo}`;
    return { linkValidar, linkCancelar, baseUrl };
  }

  async renderizarPorChave(chave: string, variaveis: VariaveisTemplate) {
    const template = await this.buscarPorChave(chave);
    const frontendUrl = variaveis.FRONTEND_URL || process.env.FRONTEND_URL || 'http://192.168.24.11:5173';
    const tempoExpiracao = variaveis.TEMPO_EXPIRACAO || '5';
    const variaveisCompletas = { ...variaveis, FRONTEND_URL: frontendUrl, TEMPO_EXPIRACAO: tempoExpiracao };
    const tituloFinal = this.renderizar(template.titulo_assunto, variaveisCompletas);
    const corpoFinal = this.renderizar(template.conteudo_corpo, variaveisCompletas);
    return { template, tituloFinal, corpoFinal, emailRemetente: template.email_remetente, nomeRemetente: template.nome_remetente };
  }
}
