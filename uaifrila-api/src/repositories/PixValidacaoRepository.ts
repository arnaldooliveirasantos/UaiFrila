import { BaseRepository } from './BaseRepository';
import { PixValidacaoModel } from '../models/PixValidacaoModel';
export class PixValidacaoRepository extends BaseRepository<PixValidacaoModel> {
  constructor() { super('pix_validacoes', PixValidacaoModel); }
  async buscarPendentePorUsuario(usuarioId: number): Promise<PixValidacaoModel | null> {
    const r = await this.query(`SELECT * FROM pix_validacoes WHERE usuario_id = $1 AND status = 'PENDENTE' AND expira_em > NOW() ORDER BY id DESC LIMIT 1`, [usuarioId]);
    return (r.rows || [])[0] ? this.mapRow((r.rows || [])[0]) : null;
  }
  async buscarPorToken(token: string): Promise<PixValidacaoModel | null> {
    const r = await this.query(`SELECT * FROM pix_validacoes WHERE token = $1 AND status = 'PENDENTE' ORDER BY id DESC LIMIT 1`, [token]);
    return (r.rows || [])[0] ? this.mapRow((r.rows || [])[0]) : null;
  }
  async buscarValidadaParaChave(usuarioId: number, chavePix: string): Promise<PixValidacaoModel | null> {
    const r = await this.query(`SELECT * FROM pix_validacoes WHERE usuario_id = $1 AND chave_pix = $2 AND status = 'VALIDADO' ORDER BY id DESC LIMIT 1`, [usuarioId, chavePix]);
    return (r.rows || [])[0] ? this.mapRow((r.rows || [])[0]) : null;
  }
}
