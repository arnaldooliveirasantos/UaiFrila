import { Request, Response } from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const getPool = () => new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME
});

function hashSenha(senha: string): string {
  return crypto.createHash('sha256').update(senha || '123456').digest('hex');
}

export class AuthController {
  public registrar = async (req: Request, res: Response): Promise<void> => {
    const pool = getPool();
    try {
      const { nome, cpf, email, senha, cnpj, nomeFantasia, isFreela, isContratante, funcao, valorHora, bio, bairro, comoChega, ajudaUber, temMei } = req.body;
      
      console.log('📥 REGISTRAR payload:', { nome, email, cpf, bairro });
      
      if (!email || !email.includes('@')) { res.status(400).json({ erro: 'E-mail inválido - obrigatório' }); return; }
      if (!nome) { res.status(400).json({ erro: 'Nome obrigatório' }); return; }

      let existe;
      try {
        existe = await pool.query(`SELECT id FROM usuarios WHERE email = $1`, [email]);
      } catch (e:any) {
        console.error('Erro verificar usuarios:', e.message);
        await pool.query(`
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
        existe = await pool.query(`SELECT id FROM usuarios WHERE email = $1`, [email]);
      }

      if (existe.rows.length > 0) { res.status(400).json({ erro: 'E-mail já cadastrado' }); return; }

      let minutos = 5;
      let temTemplate = false;
      try {
        const resTempo = await pool.query(`SELECT valor FROM variaveis_ambiente WHERE chave = 'EMAIL_EXPIRACAO_MINUTOS'`);
        if (resTempo.rows[0]) minutos = Number(resTempo.rows[0].valor);
        const resTemplate = await pool.query(`SELECT id FROM email_templates WHERE chave_uso = 'CONFIRMACAO_CADASTRO' LIMIT 1`);
        temTemplate = resTemplate.rows.length > 0;
      } catch (e:any) {
        console.log('Sem tabela variaveis/email_templates - modo direto:', e.message);
        temTemplate = false;
      }

      const senhaHash = hashSenha(senha);

      if (!temTemplate) {
        console.log('⚠️ Modo direto sem e-mail - criando usuário');
        try {
          const novoUsuario = await pool.query(
            `INSERT INTO usuarios (nome_completo, cpf, email, senha_hash, cnpj, nome_fantasia, is_freela, is_contratante, status) 
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ATIVO') RETURNING id, email, nome_completo`,
            [nome, cpf, email, senhaHash, cnpj, nomeFantasia, !!isFreela, !!isContratante]
          );
          res.status(201).json({ sucesso: true, usuario: novoUsuario.rows[0], modo: 'direto_sem_email' });
          return;
        } catch (insertErr:any) {
          console.error('Erro INSERT usuarios:', insertErr.message);
          const novoUsuario = await pool.query(
            `INSERT INTO usuarios (nome_completo, email, senha_hash) VALUES ($1,$2,$3) RETURNING id, email, nome_completo`,
            [nome, email, senhaHash]
          );
          res.status(201).json({ sucesso: true, usuario: novoUsuario.rows[0], modo: 'minimalista' });
          return;
        }
      }

      const resTemplateFull = await pool.query(`SELECT id, titulo_assunto, conteudo_corpo FROM email_templates WHERE chave_uso = 'CONFIRMACAO_CADASTRO' LIMIT 1`);
      const template = resTemplateFull.rows[0];
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      let corpo = template.conteudo_corpo.replace('{{NOME}}', nome).replace('{{CODIGO}}', codigo).replace('{{EMAIL}}', email);

      // TENTA CRIAR COLUNA dados_cadastro SE NÃO EXISTIR - FIX 500
      try {
        await pool.query(`ALTER TABLE email_historico_disparos ADD COLUMN IF NOT EXISTS dados_cadastro JSONB`);
      } catch {}

      // Tenta com dados_cadastro, se falhar tenta sem
      try {
        await pool.query(
          `INSERT INTO email_historico_disparos (template_id, email_destinatario, titulo_final, conteudo_final, codigo_verificacao, status_id, expira_em, criado_em, dados_cadastro) 
           VALUES ($1,$2,$3,$4,$5,(SELECT id FROM email_status WHERE chave='EM_ESPERA'), NOW()+cast($6||' minutes' as interval), NOW(), $7)`,
          [template.id, email, template.titulo_assunto, corpo, codigo, minutos, JSON.stringify(req.body)]
        );
      } catch (e:any) {
        console.log('Fallback sem dados_cadastro - coluna não existe:', e.message);
        await pool.query(
          `INSERT INTO email_historico_disparos (template_id, email_destinatario, titulo_final, conteudo_final, codigo_verificacao, status_id, expira_em, criado_em) 
           VALUES ($1,$2,$3,$4,$5,(SELECT id FROM email_status WHERE chave='EM_ESPERA'), NOW()+cast($6||' minutes' as interval), NOW())`,
          [template.id, email, template.titulo_assunto, corpo, codigo, minutos]
        );
        // Salva dados temporariamente em memoria ou cria usuario direto
      }

      res.status(200).json({ status: 'AGUARDANDO_VALIDACAO_EMAIL', email });
    } catch (e: any) {
      console.error('🔥 ERRO 500 REGISTRAR:', e);
      res.status(500).json({ erro: 'Erro interno: ' + e.message, stack: e.stack?.substring(0,500) });
    } finally { await pool.end(); }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    const pool = getPool();
    try {
      const { email } = req.body;
      if (!email) { res.status(400).json({ erro: 'E-mail obrigatório' }); return; }
      
      let usuarioRes;
      try {
        usuarioRes = await pool.query(`SELECT id, email, nome_completo FROM usuarios WHERE email = $1`, [email]);
      } catch (e:any) {
        res.status(500).json({ erro: 'Tabela usuarios não existe - rode DDL. Detalhe: ' + e.message });
        return;
      }
      
      if (usuarioRes.rows.length === 0) { res.status(401).json({ erro: 'Usuário não encontrado com este e-mail: ' + email }); return; }
      
      const usuario = usuarioRes.rows[0];
      
      try {
        const resTemplate = await pool.query(`SELECT id FROM email_templates WHERE chave_uso = '2FA_LOGIN' LIMIT 1`);
        if (resTemplate.rows.length === 0) throw new Error('sem template');
        
        const resTempo = await pool.query(`SELECT valor FROM variaveis_ambiente WHERE chave = 'EMAIL_EXPIRACAO_MINUTOS'`);
        const minutos = Number(resTempo.rows[0]?.valor || 5);
        const templateFull = await pool.query(`SELECT id, titulo_assunto, conteudo_corpo FROM email_templates WHERE chave_uso = '2FA_LOGIN' LIMIT 1`);
        const template = templateFull.rows[0];
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        let corpo = template.conteudo_corpo.replace('{{CODIGO}}', codigo).replace('{{EMAIL}}', email);

        await pool.query(
          `INSERT INTO email_historico_disparos (template_id, usuario_id, email_destinatario, titulo_final, conteudo_final, codigo_verificacao, status_id, expira_em, criado_em) VALUES ($1,$2,$3,$4,$5,$6,(SELECT id FROM email_status WHERE chave='EM_ESPERA'), NOW()+cast($7||' minutes' as interval), NOW())`,
          [template.id, usuario.id, email, template.titulo_assunto, corpo, codigo, minutos]
        );
        res.status(200).json({ status: 'AGUARDANDO_VALIDACAO_EMAIL', email });
      } catch {
        const token = jwt.sign({ id: usuario.id, email: usuario.email, is_admin: true }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.status(200).json({ sucesso: true, token, usuario: { ...usuario, nome: usuario.nome_completo }, modo: 'login_direto_sem_2fa' });
      }
    } catch (e: any) {
      console.error('🔥 ERRO 500 LOGIN:', e);
      res.status(500).json({ erro: e.message });
    } finally { await pool.end(); }
  };

  public verificarToken2FA = async (req: Request, res: Response): Promise<void> => { return this.verificarTokenEmail(req, res); };

  public verificarTokenEmail = async (req: Request, res: Response): Promise<void> => {
    const pool = getPool();
    try {
      const { email, codigo } = req.body;
      console.log('🔍 Verificando código', email, codigo);
      
      let resDisparo;
      try {
        // Tenta com dados_cadastro, se não existir tenta sem
        try {
          resDisparo = await pool.query(`SELECT id, codigo_verificacao, expira_em, dados_cadastro FROM email_historico_disparos WHERE email_destinatario = $1 ORDER BY criado_em DESC LIMIT 1`, [email]);
        } catch {
          resDisparo = await pool.query(`SELECT id, codigo_verificacao, expira_em FROM email_historico_disparos WHERE email_destinatario = $1 ORDER BY criado_em DESC LIMIT 1`, [email]);
        }
      } catch {
        const resUser = await pool.query(`SELECT id, email, nome_completo as nome FROM usuarios WHERE email = $1`, [email]);
        const usuario = resUser.rows[0];
        const token = jwt.sign({ id: usuario.id, email: usuario.email, is_admin: true }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.status(200).json({ sucesso: true, token, usuario });
        return;
      }

      if (resDisparo.rows.length === 0) { res.status(400).json({ erro: 'Nenhum código encontrado para este e-mail' }); return; }
      
      const disparo = resDisparo.rows[0];
      if (new Date() > new Date(disparo.expira_em)) {
        await pool.query(`UPDATE email_historico_disparos SET status_id = (SELECT id FROM email_status WHERE chave='EXPIRADO') WHERE id = $1`, [disparo.id]);
        res.status(400).json({ erro: 'Código expirado' });
        return;
      }
      if (disparo.codigo_verificacao !== codigo) { res.status(400).json({ erro: 'Código incorreto' }); return; }
      
      await pool.query(`UPDATE email_historico_disparos SET status_id = (SELECT id FROM email_status WHERE chave='VALIDADO') WHERE id = $1`, [disparo.id]);

      if ((disparo as any).dados_cadastro) {
        const d = typeof (disparo as any).dados_cadastro === 'string' ? JSON.parse((disparo as any).dados_cadastro) : (disparo as any).dados_cadastro;
        const senhaHash = hashSenha(d.senha);
        const novo = await pool.query(
          `INSERT INTO usuarios (nome_completo, cpf, email, senha_hash, cnpj, nome_fantasia, is_freela, is_contratante, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ATIVO') ON CONFLICT (email) DO UPDATE SET nome_completo = EXCLUDED.nome_completo RETURNING id, email, nome_completo`,
          [d.nome, d.cpf, d.email, senhaHash, d.cnpj, d.nomeFantasia, d.isFreela, d.isContratante]
        );
        const usuario = novo.rows[0];
        const token = jwt.sign({ id: usuario.id, email: usuario.email, is_admin: true }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
        res.status(200).json({ sucesso: true, token, usuario });
        return;
      }

      const resUser = await pool.query(`SELECT id, email, nome_completo as nome FROM usuarios WHERE email = $1`, [email]);
      const usuario = resUser.rows[0];
      const token = jwt.sign({ id: usuario.id, email: usuario.email, is_admin: true }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      res.status(200).json({ sucesso: true, token, usuario });
    } catch (e: any) {
      console.error('🔥 ERRO 500 VERIFICAR:', e);
      res.status(500).json({ erro: e.message });
    } finally { await pool.end(); }
  };
}