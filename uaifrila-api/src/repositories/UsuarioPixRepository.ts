import { BaseRepository } from './BaseRepository';
import { UsuarioPixModel } from '../models/UsuarioPixModel';

// UNICO lugar que faz SQL em usuario_pix.
// Controller NUNCA toca em pool/query. Service NUNCA faz SQL - chama o Repository.
export class UsuarioPixRepository extends BaseRepository<UsuarioPixModel> {
  constructor() { super('usuario_pix', UsuarioPixModel); }

  async buscarAtivoPorUsuario(usuarioId: number): Promise<UsuarioPixModel | null> {
    const result = await this.query(`SELECT * FROM usuario_pix WHERE usuario_id = $1 AND ativo = TRUE ORDER BY id DESC LIMIT 1`, [usuarioId]);
    const rows = result.rows || result;
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async listarPorUsuario(usuarioId: number): Promise<UsuarioPixModel[]> {
    const result = await this.query(`SELECT * FROM usuario_pix WHERE usuario_id = $1 ORDER BY ativo DESC, id DESC`, [usuarioId]);
    return this.mapRows(result.rows || result);
  }

  async desativarAtivos(usuarioId: number): Promise<void> {
    await this.query(`UPDATE usuario_pix SET ativo = FALSE, atualizado_em = NOW() WHERE usuario_id = $1 AND ativo = TRUE`, [usuarioId]);
  }

  // Salva novo PIX: desativa o ativo anterior (historico preservado) e insere o novo.
  // 1 ativo por usuario garantido por essa sequencia (nao por DELETE).
  async salvarNovo(usuarioId: number, dados: any): Promise<UsuarioPixModel> {
    await this.desativarAtivos(usuarioId);
    return await this.criarGenerico({ ...dados, usuarioId, usuario_id: usuarioId, ativo: true });
  }

  // Excluir = desativar o ativo (nao apaga a linha, preserva historico/auditoria).
  async excluirAtivo(usuarioId: number): Promise<boolean> {
    const ativo = await this.buscarAtivoPorUsuario(usuarioId);
    if (!ativo) return false;
    await this.desativarAtivos(usuarioId);
    return true;
  }
}
