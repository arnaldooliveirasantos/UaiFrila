import { BaseRepository } from './BaseRepository';
import { EmailHistoricoModel } from '../models/EmailHistoricoModel';
export class EmailHistoricoRepository extends BaseRepository<EmailHistoricoModel> {
  constructor() { super('email_historico_disparos', EmailHistoricoModel); }
  async listarPorUsuario(usuarioId: number): Promise<EmailHistoricoModel[]> {
    const r = await this.query(`SELECT * FROM email_historico_disparos WHERE usuario_id = $1 ORDER BY criado_em DESC LIMIT 50`, [usuarioId]);
    return this.mapRows(r.rows || []);
  }
  async listarPorEmail(email: string): Promise<EmailHistoricoModel[]> {
    const r = await this.query(`SELECT * FROM email_historico_disparos WHERE LOWER(email_destinatario) = LOWER($1) ORDER BY criado_em DESC LIMIT 20`, [email]);
    return this.mapRows(r.rows || []);
  }
  // Ultimo codigo para email+codigo (ignora status/expiracao — quem decide o motivo do erro e o service).
  async buscarUltimoPorEmailCodigo(email: string, codigo: string): Promise<any | null> {
    const r = await this.query(`SELECT h.*, es.chave AS status_chave FROM email_historico_disparos h LEFT JOIN email_status es ON es.id = h.status_id WHERE LOWER(TRIM(h.email_destinatario)) = LOWER($1) AND TRIM(CAST(h.codigo_verificacao AS TEXT)) = $2 ORDER BY h.criado_em DESC LIMIT 1`, [email, codigo]);
    return r.rows?.[0] || null;
  }
  // Codigo valido para cancelar: EM_ESPERA/ENVIADO e nao expirado.
  async buscarCodigoParaCancelar(email: string, codigo: string): Promise<any | null> {
    const r = await this.query(`SELECT h.id, h.email_destinatario FROM email_historico_disparos h WHERE LOWER(TRIM(h.email_destinatario)) = LOWER($1) AND TRIM(CAST(h.codigo_verificacao AS TEXT)) = $2 AND h.expira_em > NOW() AND h.status_id IN (SELECT id FROM email_status WHERE UPPER(chave) IN ('EM_ESPERA','ENVIADO')) ORDER BY h.criado_em DESC LIMIT 1`, [email, codigo]);
    return r.rows?.[0] || null;
  }
  async buscarCodigoValido(email: string, codigo: string): Promise<any | null> {
    const r = await this.query(`SELECT h.*, u.id AS usuario_id FROM email_historico_disparos h LEFT JOIN usuarios u ON LOWER(u.email) = LOWER(h.email_destinatario) WHERE LOWER(h.email_destinatario) = LOWER($1) AND h.codigo_verificacao = $2 AND (h.expira_em IS NULL OR h.expira_em > NOW()) ORDER BY h.criado_em DESC LIMIT 1`, [email, codigo]);
    return r.rows?.[0] || null;
  }
  async invalidarPendentes(email: string): Promise<void> {
    await this.query(`UPDATE email_historico_disparos SET status_id = (SELECT id FROM email_status WHERE UPPER(chave) = 'CANCELADO') WHERE LOWER(email_destinatario) = LOWER($1) AND status_id IN (SELECT id FROM email_status WHERE UPPER(chave) IN ('EM_ESPERA','ENVIADO'))`, [email]);
  }
  async marcarComoConsumido(id: number): Promise<void> {
    await this.query(`UPDATE email_historico_disparos SET status_id = (SELECT id FROM email_status WHERE chave = 'CONSUMIDO' LIMIT 1), atualizado_em = NOW() WHERE id = $1`, [id]);
  }
  async criarCodigo(dados: { emailDestinatario: string; templateId?: number | null; statusId?: number | null; codigoVerificacao: string; tituloFinal: string; conteudoFinal: string; usuarioId?: number | null; dadosCadastro?: any }): Promise<any> {
    const cols: string[] = ['email_destinatario', 'codigo_verificacao', 'titulo_final', 'conteudo_final', 'expira_em', 'tentativas', 'criado_em'];
    const vals: any[] = [dados.emailDestinatario, dados.codigoVerificacao, dados.tituloFinal, dados.conteudoFinal];
    // placeholders: os 4 primeiros sao $1..$4; expira/criado sao NOW(); o resto entra depois com indice correto
    let sql = `INSERT INTO email_historico_disparos (email_destinatario, codigo_verificacao, titulo_final, conteudo_final, expira_em, tentativas, criado_em) VALUES ($1, $2, $3, $4, NOW() + INTERVAL '5 minutes', 0, NOW())`;
    if (dados.templateId || dados.statusId || dados.usuarioId || dados.dadosCadastro) {
      const extraCols: string[] = []; const extraVals: any[] = []; let i = 5;
      if (dados.templateId) { extraCols.push('template_id'); extraVals.push(dados.templateId); }
      if (dados.statusId) { extraCols.push('status_id'); extraVals.push(dados.statusId); }
      if (dados.usuarioId) { extraCols.push('usuario_id'); extraVals.push(dados.usuarioId); }
      if (dados.dadosCadastro) { extraCols.push('dados_cadastro'); extraVals.push(JSON.stringify(dados.dadosCadastro)); }
      const allCols = ['email_destinatario', 'codigo_verificacao', 'titulo_final', 'conteudo_final', ...extraCols, 'expira_em', 'tentativas', 'criado_em'];
      const ph = ['$1', '$2', '$3', '$4', ...extraVals.map(() => `$${i++}`)];
      sql = `INSERT INTO email_historico_disparos (${allCols.join(', ')}) VALUES (${ph.join(', ')}, NOW() + INTERVAL '5 minutes', 0, NOW())`;
      vals.push(...extraVals);
    }
    const r = await this.query(`${sql} RETURNING *`, vals);
    return r.rows?.[0] || null;
  }
}
