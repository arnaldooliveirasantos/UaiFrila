import { BaseRepository } from './BaseRepository';
import { EmailHistoricoModel } from '../models/EmailHistoricoModel';

export class EmailHistoricoRepository extends BaseRepository<EmailHistoricoModel> {
  constructor() { super('email_historico_disparos', EmailHistoricoModel); }

  async listarPorUsuario(usuarioId: number): Promise<EmailHistoricoModel[]> {
    try {
      const result = await this.query(`SELECT * FROM email_historico_disparos WHERE usuario_id = $1 ORDER BY criado_em DESC LIMIT 50`, [usuarioId]);
      return this.mapRows(result.rows || result);
    } catch {
      return [];
    }
  }

  async buscarCodigoValido(email: string, codigo: string): Promise<any | null> {
    try {
      const result = await this.query(
        `SELECT h.*, u.id as usuario_id
         FROM email_historico_disparos h
         LEFT JOIN usuarios u ON LOWER(u.email)=LOWER(h.email_destinatario)
         WHERE LOWER(h.email_destinatario)=LOWER($1) AND h.codigo_verificacao=$2
         AND (h.expira_em IS NULL OR h.expira_em > NOW())
         ORDER BY h.criado_em DESC LIMIT 1`,
        [email, codigo]
      );
      const rows = result.rows || result;
      return rows[0] || null;
    } catch (e: any) {
      console.warn('[EmailHistoricoRepository.buscarCodigoValido] erro:', e.message);
      return null;
    }
  }

  // Alias para compatibilidade com AuthService novo
  async buscarCodigoValidoModel(email: string, codigo: string) {
    return this.buscarCodigoValido(email, codigo);
  }

  async criarCodigo(dados: { emailDestinatario: string, templateId?: number | null, statusId?: number | null, codigoVerificacao: string, tituloFinal: string, conteudoFinal: string }): Promise<any> {
    try {
      if (dados.templateId && dados.statusId) {
        const result = await this.query(
          `INSERT INTO email_historico_disparos (email_destinatario, template_id, status_id, codigo_verificacao, titulo_final, conteudo_final, expira_em, tentativas, criado_em)
           VALUES ($1,$2,$3,$4,$5,$6, NOW() + INTERVAL '5 minutes', 0, NOW()) RETURNING *`,
          [dados.emailDestinatario, dados.templateId, dados.statusId, dados.codigoVerificacao, dados.tituloFinal, dados.conteudoFinal]
        );
        return (result.rows || result)[0] ? this.mapRow((result.rows || result)[0]) : null;
      } else if (dados.statusId) {
        const result = await this.query(
          `INSERT INTO email_historico_disparos (email_destinatario, status_id, codigo_verificacao, titulo_final, conteudo_final, expira_em, tentativas, criado_em)
           VALUES ($1,$2,$3,$4, NOW() + INTERVAL '5 minutes', 0, NOW()) RETURNING *`,
          [dados.emailDestinatario, dados.statusId, dados.codigoVerificacao, dados.tituloFinal, dados.conteudoFinal]
        );
        return (result.rows || result)[0] ? this.mapRow((result.rows || result)[0]) : null;
      } else {
        const result = await this.query(
          `INSERT INTO email_historico_disparos (email_destinatario, codigo_verificacao, titulo_final, conteudo_final, expira_em, criado_em)
           VALUES ($1,$2,$3,$4, NOW() + INTERVAL '5 minutes', NOW()) RETURNING *`,
          [dados.emailDestinatario, dados.codigoVerificacao, dados.tituloFinal, dados.conteudoFinal]
        );
        return (result.rows || result)[0] ? this.mapRow((result.rows || result)[0]) : null;
      }
    } catch (e: any) {
      console.warn('[EmailHistoricoRepository.criarCodigo] erro:', e.message);
      return null;
    }
  }

  async marcarComoConsumido(id: number): Promise<void> {
    try {
      await this.query(
        `UPDATE email_historico_disparos SET status_id=(SELECT id FROM email_status WHERE chave='CONSUMIDO' LIMIT 1), atualizado_em=NOW() WHERE id=$1`,
        [id]
      );
    } catch (e: any) {
      console.warn('[EmailHistoricoRepository.marcarComoConsumido] erro:', e.message);
    }
  }

  async listarPorEmail(email: string): Promise<EmailHistoricoModel[]> {
    try {
      const result = await this.query(`SELECT * FROM email_historico_disparos WHERE LOWER(email_destinatario)=LOWER($1) ORDER BY criado_em DESC LIMIT 20`, [email]);
      return this.mapRows(result.rows || result);
    } catch {
      return [];
    }
  }
}
