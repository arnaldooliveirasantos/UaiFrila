
import { EmailTemplateRepository } from '../repositories/EmailTemplateRepository';
import { EmailHistoricoRepository } from '../repositories/EmailHistoricoRepository';
import { BaseRepository } from '../repositories/BaseRepository';

export class EmailService {
  private templateRepo: EmailTemplateRepository;
  private historicoRepo: EmailHistoricoRepository;
  constructor() {
    this.templateRepo = new EmailTemplateRepository();
    this.historicoRepo = new EmailHistoricoRepository();
  }
  async enviarCodigo(params: { tipo: string, email: string, nome: string, codigo: string, usuario_id?: number }) {
    try {
      const pool = BaseRepository.getPool() as any;
      if (!pool) throw new Error('Pool não configurado');
      const templateRows = await pool.query('SELECT * FROM email_templates WHERE chave_uso=$1 LIMIT 1', [params.tipo]);
      let template = templateRows.rows[0];
      if (!template) {
        const all = await pool.query('SELECT * FROM email_templates LIMIT 1');
        template = all.rows[0];
      }
      if (!template) throw new Error('Template não encontrado');
      const statusRows = await pool.query("SELECT id FROM email_status WHERE chave='EM_ESPERA' LIMIT 1");
      const statusId = statusRows.rows[0]?.id || 1;
      const titulo = template.titulo_assunto.replace('{{NOME}}', params.nome).replace('{{CODIGO}}', params.codigo);
      let conteudo = template.conteudo_corpo.replace('{{NOME}}', params.nome).replace('{{CODIGO}}', params.codigo).replace('{{EMAIL}}', params.email);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const linkValidar = `${frontendUrl}/?email=${encodeURIComponent(params.email)}&codigo=${params.codigo}&tipo=${params.tipo === 'CONFIRMACAO_CADASTRO' ? 'cadastro' : 'login'}`;
      conteudo = conteudo.replace('{{LINK_VALIDAR}}', linkValidar);
      
      // CORREÇÃO: Usa NOW() do banco + 10 minutos, não JS Date, para evitar diferença de relógio
      const historicoRows = await pool.query(
        `INSERT INTO email_historico_disparos (template_id, usuario_id, email_destinatario, titulo_final, conteudo_final, codigo_verificacao, status_id, expira_em, criado_em)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW() + INTERVAL '10 minutes',NOW()) RETURNING *`,
        [template.id, params.usuario_id || null, params.email, titulo, conteudo, params.codigo, statusId]
      );
      console.log(`[EmailService] Código ${params.codigo} criado para ${params.email} expira em 10min (DB time) ID ${historicoRows.rows[0].id}`);
      return { sucesso:true, historicoId: historicoRows.rows[0].id, codigo: params.codigo };
    } catch (e:any) {
      console.error('[EmailService] Erro:', e.message);
      throw e;
    }
  }
  async listarUltimos() {
    try {
      const pool = BaseRepository.getPool() as any;
      if (!pool) return [];
      const rows = await pool.query('SELECT * FROM email_historico_disparos ORDER BY criado_em DESC LIMIT 100');
      return rows.rows;
    } catch { return []; }
  }
}
