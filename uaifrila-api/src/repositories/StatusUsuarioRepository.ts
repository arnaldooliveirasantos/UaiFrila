import { BaseRepository } from './BaseRepository';

export class StatusUsuarioRepository extends BaseRepository {
  async listarTodos() {
    return await this.query(`SELECT id, chave, nome_exibicao, descricao, cor_hex, ordem FROM status_usuario ORDER BY ordem ASC`);
  }

  async buscarPorId(id: number) {
    return await this.queryOne(`SELECT * FROM status_usuario WHERE id = $1`, [id]);
  }

  async buscarPorChave(chave: string) {
    return await this.queryOne(`SELECT * FROM status_usuario WHERE chave = $1`, [chave.toUpperCase()]);
  }

  async garantirTabela() {
    try {
      await this.query(`
        CREATE TABLE IF NOT EXISTS status_usuario (
          id SERIAL PRIMARY KEY,
          chave VARCHAR(50) UNIQUE NOT NULL,
          nome_exibicao VARCHAR(100) NOT NULL,
          descricao TEXT,
          cor_hex VARCHAR(20),
          ordem INT DEFAULT 0,
          criado_em TIMESTAMP DEFAULT NOW()
        );
      `);
      await this.query(`
        INSERT INTO status_usuario (chave, nome_exibicao, descricao, cor_hex, ordem) VALUES
        ('AGUARDANDO_VALIDACAO', 'Aguardando Validação', 'Usuário cadastrado mas ainda não validou e-mail', '#FFC700', 1),
        ('ATIVO', 'Ativo', 'Usuário validado e ativo no sistema', '#00C851', 2),
        ('INATIVO', 'Inativo', 'Usuário desativado temporariamente', '#9E9E9E', 3),
        ('BLOQUEADO', 'Bloqueado', 'Usuário bloqueado por violação de regras', '#E53935', 4),
        ('SUSPENSO', 'Suspenso', 'Usuário suspenso temporariamente', '#FF6D00', 5)
        ON CONFLICT (chave) DO NOTHING;
      `);
      await this.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS status_usuario_id INT REFERENCES status_usuario(id)`);
      // Migra antigos
      await this.query(`UPDATE usuarios SET status_usuario_id = (SELECT id FROM status_usuario WHERE chave = 'AGUARDANDO_VALIDACAO') WHERE LOWER(TRIM(status)) = 'aguardando_validacao' AND status_usuario_id IS NULL`);
      await this.query(`UPDATE usuarios SET status_usuario_id = (SELECT id FROM status_usuario WHERE chave = 'ATIVO') WHERE (LOWER(TRIM(status)) = 'ativo' OR status IS NULL OR status = '') AND status_usuario_id IS NULL`);
      await this.query(`UPDATE usuarios SET status_usuario_id = (SELECT id FROM status_usuario WHERE chave = 'ATIVO') WHERE status_usuario_id IS NULL`);
    } catch (e:any) {
      console.log('Erro garantir tabela status_usuario:', e.message);
    }
  }
}