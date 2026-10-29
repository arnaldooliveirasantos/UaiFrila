
import { BaseRepository } from './BaseRepository';

export class TermoRepository extends BaseRepository {
  async listar() { return await this.query(`SELECT * FROM termos ORDER BY id`); }
}
