import { BaseRepository } from '../repositories/BaseRepository';

export class EmailService {
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
      const titulo = template.titulo_assunto.replace('{{NOME}}', params.nome).replace('{{CODIGO}}', '***').replace('{{EMAIL}}', params.email);
      let conteudo = template.conteudo_corpo.replace('{{NOME}}', params.nome).replace('{{CODIGO}}', params.codigo).replace('{{EMAIL}}', params.email);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const linkValidar = `${frontendUrl}/?email=${encodeURIComponent(params.email)}&codigo=${params.codigo}&tipo=${params.tipo === 'CONFIRMACAO_CADASTRO' ? 'cadastro' : 'login'}`;
      conteudo = conteudo.replace('{{LINK_VALIDAR}}', linkValidar);
      
      const historicoRows = await pool.query(
        `INSERT INTO email_historico_disparos (template_id, usuario_id, email_destinatario, titulo_final, conteudo_final, codigo_verificacao, status_id, expira_em, criado_em)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW() + INTERVAL '10 minutes',NOW()) RETURNING id`,
        [template.id, params.usuario_id || null, params.email, titulo, conteudo, params.codigo, statusId]
      );
      // NUNCA logar código completo em produção
      console.log(`[EmailService] Código ***${params.codigo.slice(-2)} criado para ${params.email} ID ${historicoRows.rows[0].id}`);
      return { sucesso:true, historicoId: historicoRows.rows[0].id };
    } catch (e:any) {
      console.error('[EmailService] Erro:', e.message);
      throw e;
    }
  }
}
