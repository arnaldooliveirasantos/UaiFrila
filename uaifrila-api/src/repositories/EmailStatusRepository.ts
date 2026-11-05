import { BaseRepository } from './BaseRepository';
import { EmailStatusModel } from '../models/EmailStatusModel';
export class EmailStatusRepository extends BaseRepository<EmailStatusModel> {
  constructor() { super('email_status', EmailStatusModel); }
  async buscarPorChave(chave: string): Promise<EmailStatusModel | null> {
    const result = await this.query(`SELECT * FROM email_status WHERE chave = $1 LIMIT 1`, [chave]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }
}
