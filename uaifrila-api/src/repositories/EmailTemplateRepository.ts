import { BaseRepository } from './BaseRepository';
import { EmailTemplateModel } from '../models/EmailTemplateModel';
export class EmailTemplateRepository extends BaseRepository<EmailTemplateModel> {
  constructor() { super('email_templates', EmailTemplateModel); }
  async buscarPorChave(chave: string): Promise<EmailTemplateModel | null> {
    const result = await this.query(`SELECT * FROM email_templates WHERE chave_uso = $1 LIMIT 1`, [chave]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }
}
