import { EmailTemplateRepository } from '../repositories/EmailTemplateRepository';
// Layout vem 100% do conteudo_corpo do template. NENHUM HTML hardcoded.
// CORRIGIDO: buscarTemplate usava BaseRepository.getPool().query direto. Agora usa repository.
// CORRIGIDO: enviarCodigo LOGAVA o codigo e o conteudo. Agora loga so o essencial, sem codigo.
export type TipoEmailCodigo = 'login' | 'cadastro' | 'reenvio';
export interface DadosEmailCodigo { email: string; nome: string; codigo: string; tipo: TipoEmailCodigo; tempoExpiracaoMin?: number; }
function chaveUsoParaTipo(tipo: TipoEmailCodigo): string {
  if (tipo === 'cadastro') return 'CONFIRMACAO_CADASTRO';
  if (tipo === 'reenvio') return 'REENVIO_CODIGO';
  return '2FA_LOGIN';
}
export class EmailService {
  static chaveUsoParaTipo(tipo: TipoEmailCodigo): string { return chaveUsoParaTipo(tipo); }
  static async buscarTemplate(chaveUso: string): Promise<{ titulo: string; conteudo: string; emailRemetente: string; nomeRemetente: string }> {
    const repo = new EmailTemplateRepository();
    const t: any = await repo.buscarPorChave(chaveUso);
    if (!t) throw new Error(`Template '${chaveUso}' nao encontrado em email_templates - rode os INSERTs de CONFIRMACAO_CADASTRO / 2FA_LOGIN / REENVIO_CODIGO`);
    const corpo = t.conteudo_corpo || t.conteudoCorpo;
    if (!corpo) throw new Error(`Template '${chaveUso}' esta com conteudo_corpo vazio`);
    return { titulo: t.titulo_assunto || t.tituloAssunto, conteudo: corpo, emailRemetente: t.email_remetente || t.emailRemetente || 'noreply@uaifrila.com.br', nomeRemetente: t.nome_remetente || t.nomeRemetente || 'UAI FRILA' };
  }
  static async renderizarTemplateCodigo(dados: DadosEmailCodigo): Promise<{ titulo: string; conteudo: string; emailRemetente: string; nomeRemetente: string }> {
    const chaveUso = chaveUsoParaTipo(dados.tipo);
    const template = await this.buscarTemplate(chaveUso);
    const tempo = String(dados.tempoExpiracaoMin ?? 5);
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const linkValidar = `${frontendUrl}/?codigo=${encodeURIComponent(dados.codigo)}&email=${encodeURIComponent(dados.email)}&tipo=${dados.tipo === 'reenvio' ? 'login' : dados.tipo}`;
    const linkCancelar = `${frontendUrl}/?cancelar=true&email=${encodeURIComponent(dados.email)}&codigo=${encodeURIComponent(dados.codigo)}`;
    const mapa: Record<string, string> = { '{{NOME}}': dados.nome || 'Uai Frila', '{{CODIGO}}': dados.codigo, '{{TEMPO_EXPIRACAO}}': tempo, '{{LINK_VALIDAR}}': linkValidar, '{{LINK_CANCELAR}}': linkCancelar, '{{FRONTEND_URL}}': frontendUrl, '{{EMAIL}}': dados.email, '{{TIPO}}': dados.tipo };
    let conteudoFinal = template.conteudo; let tituloFinal = template.titulo || '';
    for (const [ph, valor] of Object.entries(mapa)) { conteudoFinal = conteudoFinal.split(ph).join(valor); tituloFinal = tituloFinal.split(ph).join(valor); }
    const restantes = conteudoFinal.match(/\{\{[^}]+\}\}/g);
    if (restantes) throw new Error(`Template '${chaveUso}' tem placeholders nao substituidos: ${restantes.join(', ')}`);
    return { titulo: tituloFinal, conteudo: conteudoFinal, emailRemetente: template.emailRemetente, nomeRemetente: template.nomeRemetente };
  }
  static async enviarCodigo(dados: DadosEmailCodigo): Promise<{ titulo: string; conteudo: string; emailRemetente: string; nomeRemetente: string }> {
    const renderizado = await this.renderizarTemplateCodigo(dados);
    // SEM log de codigo/conteudo. O envio real (SMTP) ainda e TODO — o worker e quem envia a partir do historico.
    console.log(`[Email] Template: ${chaveUsoParaTipo(dados.tipo)} | Para: ${dados.email}`);
    return renderizado;
  }
}
