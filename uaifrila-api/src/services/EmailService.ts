import { BaseRepository } from '../repositories/BaseRepository';

// EmailService - usa EXATAMENTE a tabela já existente:
// email_templates(chave_uso, titulo_assunto, conteudo_corpo, email_remetente, nome_remetente)
// Chaves já existentes:
//   CONFIRMACAO_CADASTRO -> cadastro
//   2FA_LOGIN          -> login
//   REENVIO_CODIGO     -> reenvio / reenviar
// NENHUM HTML hardcoded aqui - layout vem 100% do conteudo_corpo

export type TipoEmailCodigo = 'login' | 'cadastro' | 'reenvio';

export interface DadosEmailCodigo {
  email: string;
  nome: string;
  codigo: string;
  tipo: TipoEmailCodigo;
  tempoExpiracaoMin?: number;
}

function chaveUsoParaTipo(tipo: TipoEmailCodigo): string {
  if (tipo === 'cadastro') return 'CONFIRMACAO_CADASTRO';
  if (tipo === 'reenvio') return 'REENVIO_CODIGO';
  return '2FA_LOGIN';
}

export class EmailService {
  static chaveUsoParaTipo(tipo: TipoEmailCodigo): string {
    return chaveUsoParaTipo(tipo);
  }

  static async buscarTemplate(chaveUso: string): Promise<{ titulo: string; conteudo: string; emailRemetente: string; nomeRemetente: string }> {
    const pool = BaseRepository.getPool() as any;
    const res = await pool.query(
      `SELECT titulo_assunto, conteudo_corpo, email_remetente, nome_remetente FROM email_templates WHERE chave_uso = $1 LIMIT 1`,
      [chaveUso]
    );
    if (!res.rows[0]) {
      throw new Error(`Template '${chaveUso}' não encontrado em email_templates - rode os INSERTs de CONFIRMACAO_CADASTRO / 2FA_LOGIN / REENVIO_CODIGO`);
    }
    if (!res.rows[0].conteudo_corpo) {
      throw new Error(`Template '${chaveUso}' está com conteudo_corpo vazio`);
    }
    return {
      titulo: res.rows[0].titulo_assunto,
      conteudo: res.rows[0].conteudo_corpo,
      emailRemetente: res.rows[0].email_remetente || 'noreply@uaifrila.com.br',
      nomeRemetente: res.rows[0].nome_remetente || 'UAI FRILA',
    };
  }

  static async renderizarTemplateCodigo(dados: DadosEmailCodigo): Promise<{ titulo: string; conteudo: string; emailRemetente: string; nomeRemetente: string }> {
    const chaveUso = chaveUsoParaTipo(dados.tipo);
    const template = await this.buscarTemplate(chaveUso);

    const tempo = String(dados.tempoExpiracaoMin ?? 5);
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const linkValidar = `${frontendUrl}/?codigo=${encodeURIComponent(dados.codigo)}&email=${encodeURIComponent(dados.email)}&tipo=${dados.tipo === 'reenvio' ? 'login' : dados.tipo}`;
    const linkCancelar = `${frontendUrl}/?cancelar=true&email=${encodeURIComponent(dados.email)}&codigo=${encodeURIComponent(dados.codigo)}`;

    const mapa: Record<string, string> = {
      '{{NOME}}': dados.nome || 'Uai Frila',
      '{{CODIGO}}': dados.codigo,
      '{{TEMPO_EXPIRACAO}}': tempo,
      '{{LINK_VALIDAR}}': linkValidar,
      '{{LINK_CANCELAR}}': linkCancelar,
      '{{FRONTEND_URL}}': frontendUrl,
      '{{EMAIL}}': dados.email,
      '{{TIPO}}': dados.tipo,
    };

    let conteudoFinal = template.conteudo;
    let tituloFinal = template.titulo || '';
    for (const [placeholder, valor] of Object.entries(mapa)) {
      conteudoFinal = conteudoFinal.split(placeholder).join(valor);
      tituloFinal = tituloFinal.split(placeholder).join(valor);
    }

    const restantes = conteudoFinal.match(/\{\{[^}]+\}\}/g);
    if (restantes) {
      throw new Error(`Template '${chaveUso}' tem placeholders não substituídos: ${restantes.join(', ')}`);
    }

    return { titulo: tituloFinal, conteudo: conteudoFinal, emailRemetente: template.emailRemetente, nomeRemetente: template.nomeRemetente };
  }

  static async enviarCodigo(dados: DadosEmailCodigo): Promise<{ titulo: string; conteudo: string; emailRemetente: string; nomeRemetente: string }> {
    const renderizado = await this.renderizarTemplateCodigo(dados);
    console.log(`[Email] Template: ${chaveUsoParaTipo(dados.tipo)} | Para: ${dados.email} | De: ${renderizado.nomeRemetente} <${renderizado.emailRemetente}> | Código: ${dados.codigo}`);
    console.log(`[Email] Título: ${renderizado.titulo}`);
    console.log(`[Email] Conteúdo (do template):\n${renderizado.conteudo}`);
    // TODO SMTP real - usar renderizado.emailRemetente / nomeRemetente como remetente:
    // await transporter.sendMail({ from: `"${renderizado.nomeRemetente}" <${renderizado.emailRemetente}>`, to: dados.email, subject: renderizado.titulo, html: renderizado.conteudo });
    return renderizado;
  }
}
