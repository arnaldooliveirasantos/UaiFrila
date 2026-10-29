
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

export class AuthController {
  private getPool(): Pool {
    const { BaseRepository } = require('../repositories/BaseRepository');
    return (BaseRepository as any).getPool() || (BaseRepository as any).pool;
  }

  // POST /api/auth/login { email } -> SEMPRE pede codigo, mesmo em DEV
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) { res.status(400).json({ erro: 'email obrigatório' }); return; }
      const pool = this.getPool();
      const emailLower = email.toLowerCase().trim();

      const uRes = await pool.query(`SELECT id, nome_completo, email FROM usuarios WHERE LOWER(email)=LOWER($1) LIMIT 1`, [emailLower]);
      if (uRes.rows.length === 0) {
        res.status(404).json({ erro: 'Usuário não encontrado, faça cadastro', precisa_cadastro: true });
        return;
      }
      const usuario = uRes.rows[0];
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      const expira = new Date(Date.now() + 5 * 60 * 1000);

      let templateId = 1; let statusId = 1;
      try {
        const t = await pool.query(`SELECT id FROM email_templates WHERE chave_uso='2FA_LOGIN' LIMIT 1`);
        if (t.rows.length) templateId = t.rows[0].id;
        const s = await pool.query(`SELECT id FROM email_status WHERE chave='EM_ESPERA' LIMIT 1`);
        if (s.rows.length) statusId = s.rows[0].id;
      } catch {}

      await pool.query(
        `INSERT INTO email_historico_disparos (template_id, usuario_id, email_destinatario, codigo_verificacao, status_id, expira_em, titulo_final, conteudo_final) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [templateId, usuario.id, emailLower, codigo, statusId, expira, 'Codigo Uai Frila', `Seu codigo e ${codigo}`]
      );

      console.log(`\n\n[AUTH] ===============================`);
      console.log(`[AUTH] CODIGO para ${emailLower}: ${codigo}`);
      console.log(`[AUTH] Expira em 5min: ${expira.toISOString()}`);
      console.log(`[AUTH] ===============================\n\n`);

      // SEMPRE retorna precisa_codigo - força frontend a abrir tela de código
      res.json({ 
        sucesso: false, 
        precisa_codigo: true, 
        mensagem: 'Código enviado por e-mail (ver terminal da API em DEV)', 
        email: emailLower,
        codigo_dev: codigo // em prod remova essa linha
      });
    } catch (e: any) {
      console.error('[AuthController.login] Erro:', e.message);
      res.status(500).json({ erro: e.message });
    }
  };

  public validarCodigo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, codigo, code } = req.body;
      const codigoFinal = (codigo || code || '').toString().trim();
      if (!email || !codigoFinal) { res.status(400).json({ erro: 'email e codigo obrigatórios' }); return; }
      const pool = this.getPool();
      const emailLower = email.toLowerCase().trim();

      const q = await pool.query(
        `SELECT eh.id, eh.usuario_id, eh.expira_em, eh.codigo_verificacao, u.id as uid, u.nome_completo, u.email FROM email_historico_disparos eh JOIN usuarios u ON u.id=eh.usuario_id WHERE LOWER(eh.email_destinatario)=LOWER($1) AND eh.codigo_verificacao=$2 ORDER BY eh.criado_em DESC LIMIT 1`,
        [emailLower, codigoFinal]
      );
      if (q.rows.length === 0) { res.status(400).json({ erro: 'Código inválido' }); return; }
      const reg = q.rows[0];
      if (new Date(reg.expira_em) < new Date()) { res.status(400).json({ erro: 'Código expirado, solicite novamente' }); return; }

      try {
        const statusValidado = await pool.query(`SELECT id FROM email_status WHERE chave='VALIDADO' LIMIT 1`);
        if (statusValidado.rows.length) {
          await pool.query(`UPDATE email_historico_disparos SET status_id=$1, atualizado_em=NOW() WHERE id=$2`, [statusValidado.rows[0].id, reg.id]);
        }
      } catch {}

      const token = jwt.sign({ id: reg.uid, email: reg.email, tipo_chave: 'FREELA' }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      res.json({ sucesso: true, token, usuario: { id: reg.uid, nome: reg.nome_completo, email: reg.email } });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  public cadastro = async (req: Request, res: Response): Promise<void> => {
    try {
      const { nome, nome_completo, email, cpf, cidade_id } = req.body;
      const nomeFinal = (nome_completo || nome || '').trim();
      if (!nomeFinal || !email) { res.status(400).json({ erro: 'nome e email obrigatórios' }); return; }
      const pool = this.getPool();
      const emailLower = email.toLowerCase().trim();
      const existe = await pool.query(`SELECT id FROM usuarios WHERE LOWER(email)=LOWER($1) LIMIT 1`, [emailLower]);
      if (existe.rows.length > 0) { res.status(400).json({ erro: 'Email já cadastrado, faça login' }); return; }
      const senhaHash = await bcrypt.hash('uaifrila123', 10);
      const ins = await pool.query(`INSERT INTO usuarios (nome_completo, email, cpf, senha_hash, cidade_id, status_usuario_id, tipo_usuario_id) VALUES ($1,$2,$3,$4,$5,1,1) RETURNING id, nome_completo, email`, [nomeFinal, emailLower, cpf || null, senhaHash, cidade_id || 1]);
      const usuario = ins.rows[0];
      const token = jwt.sign({ id: usuario.id, email: usuario.email, tipo_chave: 'FREELA' }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      res.status(201).json({ sucesso: true, token, usuario });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };
}
