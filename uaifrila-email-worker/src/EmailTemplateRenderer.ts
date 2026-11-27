
import { Pool } from 'pg';

export interface EmailTemplate {
  id: number;
  chave_uso: string;
  titulo_assunto: string;
  conteudo_corpo: string;
  email_remetente: string;
  nome_remetente: string;
}

// Service que o worker pode usar para fallback se conteudo_final não estiver renderizado
export class EmailTemplateRenderer {
  // Substitui {{VARIAVEL}} no template
  static render(conteudo: string, variaveis: Record<string, any>): string {
    let html = conteudo;
    for (const [key, value] of Object.entries(variaveis)) {
      const placeholder = `{{${key}}}`;
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      html = html.replace(regex, String(value ?? ''));
    }
    return html.replace(/\{\{[A-Z_]+\}\}/g, '');
  }

  static gerarLinks(email: string, codigo: string, tipo: 'cadastro' | 'login', frontendUrl: string) {
    const linkValidar = `${frontendUrl}/?email=${encodeURIComponent(email)}&codigo=${codigo}&tipo=${tipo}`;
    const linkCancelar = `${frontendUrl}/?email=${encodeURIComponent(email)}&acao=cancelar&token=${codigo}`;
    return { linkValidar, linkCancelar, baseUrl: frontendUrl };
  }
}
