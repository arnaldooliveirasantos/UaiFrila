import { BaseRepository } from './BaseRepository';
import crypto from 'crypto';

export class AuthRepository extends BaseRepository {

  // Utils
  hashSenha(senha: string): string {
    return crypto.createHash('sha256').update(senha || '123456').digest('hex');
  }

  gerarCodigo(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Usuarios
  async buscarUsuarioPorEmail(email: string) {
    try {
      return await this.query(`SELECT id, email, nome_completo FROM usuarios WHERE email = $1`, [email]);
    } catch (e:any) {
      console.log('Criando tabela usuarios minimalista:', e.message);
      await this.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id SERIAL PRIMARY KEY,
          nome_completo VARCHAR(150),
          cpf VARCHAR(14),
          email VARCHAR(150) UNIQUE,
          senha_hash VARCHAR(255),
          cnpj VARCHAR(18),
          nome_fantasia VARCHAR(150),
          is_freela BOOLEAN DEFAULT FALSE,
          is_contratante BOOLEAN DEFAULT FALSE,
          status VARCHAR(20) DEFAULT 'ATIVO',
          criado_em TIMESTAMP DEFAULT NOW()
        );
      `);
      return await this.query(`SELECT id, email, nome_completo FROM usuarios WHERE email = $1`, [email]);
    }
  }

  async existeUsuarioPorEmail(email: string): Promise<boolean> {
    const rows = await this.buscarUsuarioPorEmail(email);
    return rows.length > 0;
  }

  async criarUsuarioCompleto(dados: any, senhaHash: string) {
    try {
      return await this.query(
        `INSERT INTO usuarios (nome_completo, cpf, email, senha_hash, cnpj, nome_fantasia, is_freela, is_contratante, status) 
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ATIVO') RETURNING id, email, nome_completo`,
        [dados.nome, dados.cpf, dados.email, senhaHash, dados.cnpj, dados.nomeFantasia, !!dados.isFreela, !!dados.isContratante]
      );
    } catch (err:any) {
      console.log('Fallback insert minimalista:', err.message);
      return await this.query(
        `INSERT INTO usuarios (nome_completo, email, senha_hash) VALUES ($1,$2,$3) RETURNING id, email, nome_completo`,
        [dados.nome, dados.email, senhaHash]
      );
    }
  }

  async criarOuAtualizarUsuarioPorEmail(dados: any, senhaHash: string) {
    return await this.query(
      `INSERT INTO usuarios (nome_completo, cpf, email, senha_hash, cnpj, nome_fantasia, is_freela, is_contratante, status) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ATIVO') 
       ON CONFLICT (email) DO UPDATE SET nome_completo = EXCLUDED.nome_completo 
       RETURNING id, email, nome_completo`,
      [dados.nome, dados.cpf, dados.email, senhaHash, dados.cnpj, dados.nomeFantasia, dados.isFreela, dados.isContratante]
    );
  }

  // Email templates / variaveis
  async buscarTempoExpiracao(): Promise<number> {
    try {
      const rows = await this.query(`SELECT valor FROM variaveis_ambiente WHERE chave = 'EMAIL_EXPIRACAO_MINUTOS'`);
      if (rows[0]) return Number(rows[0].valor);
    } catch {}
    return 5;
  }

  async existeTemplate(chaveUso: string): Promise<boolean> {
    try {
      const rows = await this.query(`SELECT id FROM email_templates WHERE chave_uso = $1 LIMIT 1`, [chaveUso]);
      return rows.length > 0;
    } catch {
      return false;
    }
  }

  async buscarTemplatePorUso(chaveUso: string) {
    return await this.query(`SELECT id, titulo_assunto, conteudo_corpo FROM email_templates WHERE chave_uso = $1 LIMIT 1`, [chaveUso]);
  }

  // Email disparos
  async garantirColunaDadosCadastro() {
    try {
      await this.query(`ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS dados_cadastro JSONB`);
      await this.query(`ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS usuario_id INT`);
    } catch {}
  }

  async inserirDisparoCadastro(templateId: number, email: string, titulo: string, corpo: string, codigo: string, minutos: number, dadosCadastro: any) {
    await this.garantirColunaDadosCadastro();
    try {
      return await this.query(
        `INSERT INTO email_historico_disparos (template_id, email_destinatario, titulo_final, conteudo_final, codigo_verificacao, status_id, expira_em, criado_em, dados_cadastro) 
         VALUES ($1,$2,$3,$4,$5,(SELECT id FROM email_status WHERE chave='EM_ESPERA'), NOW()+cast($6||' minutes' as interval), NOW(), $7) RETURNING id`,
        [templateId, email, titulo, corpo, codigo, minutos, JSON.stringify(dadosCadastro)]
      );
    } catch (e:any) {
      console.log('Fallback disparo sem dados_cadastro:', e.message);
      return await this.query(
        `INSERT INTO email_historico_disparos (template_id, email_destinatario, titulo_final, conteudo_final, codigo_verificacao, status_id, expira_em, criado_em) 
         VALUES ($1,$2,$3,$4,$5,(SELECT id FROM email_status WHERE chave='EM_ESPERA'), NOW()+cast($6||' minutes' as interval), NOW()) RETURNING id`,
        [templateId, email, titulo, corpo, codigo, minutos]
      );
    }
  }

  async inserirDisparoLogin(templateId: number, usuarioId: number, email: string, titulo: string, corpo: string, codigo: string, minutos: number) {
    return await this.query(
      `INSERT INTO email_historico_disparos (template_id, usuario_id, email_destinatario, titulo_final, conteudo_final, codigo_verificacao, status_id, expira_em, criado_em) 
       VALUES ($1,$2,$3,$4,$5,$6,(SELECT id FROM email_status WHERE chave='EM_ESPERA'), NOW()+cast($7||' minutes' as interval), NOW()) RETURNING id`,
      [templateId, usuarioId, email, titulo, corpo, codigo, minutos]
    );
  }

  async buscarUltimoDisparoPorEmail(email: string) {
    try {
      return await this.query(`SELECT id, codigo_verificacao, expira_em, dados_cadastro FROM email_historico_disparos WHERE email_destinatario = $1 ORDER BY criado_em DESC LIMIT 1`, [email]);
    } catch {
      return await this.query(`SELECT id, codigo_verificacao, expira_em FROM email_historico_disparos WHERE email_destinatario = $1 ORDER BY criado_em DESC LIMIT 1`, [email]);
    }
  }

  async marcarDisparoValidado(id: number) {
    return await this.query(`UPDATE email_historico_disparos SET status_id = (SELECT id FROM email_status WHERE chave='VALIDADO') WHERE id = $1`, [id]);
  }

  async marcarDisparoExpirado(id: number) {
    return await this.query(`UPDATE email_historico_disparos SET status_id = (SELECT id FROM email_status WHERE chave='EXPIRADO') WHERE id = $1`, [id]);
  }
}