
import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { BaseRepository } from '../repositories/BaseRepository';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public cadastro = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.authService.cadastro(req.body);
      res.status(201).json(result);
    } catch (e: any) {
      res.status(400).json({ erro: e.message });
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      let { email, senha } = req.body;
      email = (email || '').toString().trim().toLowerCase();
      if (!email || email.length < 5 || !email.includes('@')) {
        res.status(400).json({ erro: 'E-mail obrigatório' });
        return;
      }
      if (senha) {
        try {
          const result = await (this.authService as any).loginComSenha(email, senha);
          res.json(result);
          return;
        } catch {}
      }
      const result = await this.authService.login({ email });
      res.json(result);
    } catch (e: any) {
      if (e.message && e.message.toLowerCase().includes('não encontrado')) {
        res.status(404).json({ erro: 'Usuário não encontrado - faça cadastro primeiro' });
      } else {
        res.status(400).json({ erro: e.message });
      }
    }
  };

  public loginComSenha = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) {
        res.status(400).json({ erro: 'email e senha obrigatórios' });
        return;
      }
      const result = await (this.authService as any).loginComSenha(email, senha);
      res.json(result);
    } catch (e: any) {
      res.status(401).json({ erro: e.message });
    }
  };

  public validarCodigo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, codigo, tipo } = req.body;
      const result = await this.authService.validarCodigo({ email, codigo, tipo });
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ erro: e.message });
    }
  };

  public reenviarCodigo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, tipo } = req.body;
      const result = await this.authService.reenviarCodigo({ email, tipo });
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ erro: e.message });
    }
  };

  public cancelarCadastro = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      const result = await this.authService.cancelarCadastro({ email });
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ erro: e.message });
    }
  };

  public me = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuarioAuth = (req as any).usuario;
      if (!usuarioAuth?.id) {
        res.status(401).json({ erro: 'Não autenticado' });
        return;
      }
      const pool = BaseRepository.getPool() as any;
      if (!pool) {
        res.status(500).json({ erro: 'Pool não configurado' });
        return;
      }
      const resDB = await pool.query(`
        SELECT 
          u.id, u.nome_completo, u.email, u.cpf, u.cnpj, u.nome_fantasia,
          u.funcao_principal, u.valor_hora_base, u.bio, u.tem_mei, u.como_chega, u.ajuda_uber,
          u.tipo_usuario_id, u.status_usuario_id, u.role, u.criado_em, u.atualizado_em,
          tu.chave as tipo_chave, tu.nome_exibicao as tipo_nome,
          eu.endereco, eu.bairro, eu.cep, eu.numero, eu.complemento, eu.lat, eu.lng, eu.cidade_id,
          c.nome as cidade_nome, e.sigla as estado
        FROM usuarios u
        LEFT JOIN tipos_usuario tu ON tu.id = u.tipo_usuario_id
        LEFT JOIN enderecos_usuario eu ON eu.usuario_id = u.id AND eu.is_ativo = true
        LEFT JOIN cidades c ON c.id = eu.cidade_id
        LEFT JOIN estados e ON e.id = c.estado_id
        WHERE u.id = $1
        ORDER BY eu.criado_em DESC LIMIT 1
      `, [usuarioAuth.id]);
      let usuario = resDB.rows[0];
      if (!usuario) {
        const resUser = await pool.query(`SELECT u.*, tu.chave as tipo_chave FROM usuarios u LEFT JOIN tipos_usuario tu ON tu.id = u.tipo_usuario_id WHERE u.id = $1`, [usuarioAuth.id]);
        usuario = resUser.rows[0];
      }
      res.json({ usuario });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  public atualizarPerfil = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuarioAuth = (req as any).usuario;
      if (!usuarioAuth?.id) {
        res.status(401).json({ erro: 'Não autenticado' });
        return;
      }
      const pool = BaseRepository.getPool() as any;
      const { nome, funcao, valorHora, bio, cnpj, nomeFantasia, temMei, comoChega, ajudaUber, endereco, bairro, cidade_id, cep, numero, complemento, lat, lng } = req.body;

      if (nome || funcao || valorHora || bio !== undefined) {
        await pool.query(`
          UPDATE usuarios 
          SET nome_completo = COALESCE($1, nome_completo),
              funcao_principal = COALESCE($2, funcao_principal),
              valor_hora_base = COALESCE($3, valor_hora_base),
              bio = COALESCE($4, bio),
              cnpj = COALESCE($5, cnpj),
              nome_fantasia = COALESCE($6, nome_fantasia),
              tem_mei = COALESCE($7, tem_mei),
              como_chega = COALESCE($8, como_chega),
              ajuda_uber = COALESCE($9, ajuda_uber),
              atualizado_em = NOW()
          WHERE id = $10
        `, [nome || null, funcao || null, valorHora || null, bio || null, cnpj || null, nomeFantasia || null, temMei || null, comoChega || null, ajudaUber || null, usuarioAuth.id]);
      }

      if (endereco || bairro || cidade_id || cep || numero || complemento) {
        try {
          await (this.authService as any).salvarEnderecoUsuario(usuarioAuth.id, {
            endereco: endereco || null, bairro: bairro || 'Centro', cidade_id: cidade_id || 1, cep: cep || null, numero: numero || null, complemento: complemento || null, lat: lat || null, lng: lng || null
          });
        } catch {}
      }

      const resDB = await pool.query(`SELECT u.*, tu.chave as tipo_chave FROM usuarios u LEFT JOIN tipos_usuario tu ON tu.id = u.tipo_usuario_id WHERE u.id = $1`, [usuarioAuth.id]);
      res.json({ sucesso: true, usuario: resDB.rows[0], mensagem: 'Perfil atualizado com sucesso' });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };
}
