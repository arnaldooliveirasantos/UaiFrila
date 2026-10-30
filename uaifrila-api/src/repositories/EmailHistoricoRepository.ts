import { BaseRepository } from './BaseRepository';

export class EmailHistoricoRepository extends BaseRepository {
  async criar(dados: {
    template_id: number;
    usuario_id?: number;
    email_destinatario: string;
    titulo_final: string;
    conteudo_final: string;
    codigo_verificacao: string;
    status_id?: number;
    expira_em?: Date;
  }) {
    const res = await this.query(
      `INSERT INTO email_historico_disparos (template_id, usuario_id, email_destinatario, titulo_final, conteudo_final, codigo_verificacao, status_id, expira_em, criado_em)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`,
      [dados.template_id, dados.usuario_id || null, dados.email_destinatario, dados.titulo_final, dados.conteudo_final, dados.codigo_verificacao, dados.status_id || 1, dados.expira_em || new Date(Date.now() + 5*60*1000)]
    );
    return res[0];
  }

  async buscarCodigoValido(email: string, codigo: string) {
    return await this.queryOne(
      `SELECT * FROM email_historico_disparos 
       WHERE email_destinatario = $1 AND codigo_verificacao = $2 AND expira_em > NOW() AND status_id != 3
       ORDER BY criado_em DESC LIMIT 1`,
      [email, codigo]
    );
  }

  async marcarEnviado(id: number) {
    await this.query(`UPDATE email_historico_disparos SET enviado_em=NOW(), status_id=2, atualizado_em=NOW() WHERE id=$1`, [id]);
  }

  async marcarErro(id: number, erro: string) {
    await this.query(`UPDATE email_historico_disparos SET ultimo_erro=$1, tentativas=tentativas+1, ultima_tentativa=NOW() WHERE id=$2`, [erro, id]);
  }

  async listarUltimos() {
    return await this.query('SELECT * FROM email_historico_disparos ORDER BY criado_em DESC LIMIT 100');
  }
}
