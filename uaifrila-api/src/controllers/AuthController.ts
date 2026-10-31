
import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { BaseRepository } from '../repositories/BaseRepository';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // POST /auth/cadastro - Cadastro Unificado (gera código CONFIRMACAO_CADASTRO)
  public cadastro = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('[AuthController][CADASTRO] Body:', { email: req.body.email, nome: req.body.nome, cpf: req.body.cpf?.substring(0,3)+'***' });
      const result = await this.authService.cadastro(req.body);
      console.log('[AuthController][CADASTRO] OK - precisa validar código');
      res.status(201).json(result);
    } catch (e: any) {
      console.error('[AuthController][CADASTRO] Erro:', e.message);
      res.status(400).json({ erro: e.message });
    }
  };

  // POST /auth/login - Login sem senha (gera código 2FA_LOGIN)
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      let { email, senha } = req.body;
      console.log('[AuthController][LOGIN] Body raw:', req.body);
      console.log('[AuthController][LOGIN] Headers:', req.headers['content-type']);

      // Trim e validação robusta
      email = (email || '').toString().trim().toLowerCase();
      console.log('[AuthController][LOGIN] Email normalizado:', email, 'temSenha:', !!senha);

      if (!email || email.length < 5 || !email.includes('@')) {
        console.log('[AuthController][LOGIN] Erro: E-mail inválido ou vazio, body recebido:', JSON.stringify(req.body));
        res.status(400).json({ erro: 'E-mail obrigatório - digite um e-mail válido' });
        return;
      }

      // Se enviou senha, tenta login com senha (legado)
      if (senha) {
        try {
          const result = await (this.authService as any).loginComSenha(email, senha);
          console.log('[AuthController][LOGIN] Login com senha OK');
          res.json(result);
          return;
        } catch (err: any) {
          console.log('[AuthController][LOGIN] Senha falhou, tentando código:', err.message);
          // Se falhou com senha mas email existe, gera código mesmo assim
        }
      }

      // Login padrão: só email, gera código
      const result = await this.authService.login({ email });
      console.log('[AuthController][LOGIN] Código de login gerado para', email);
      res.json(result);
    } catch (e: any) {
      console.error('[AuthController][LOGIN] Erro:', e.message, 'Stack:', e.stack);
      // Se usuário não encontrado, retorna 404 com mensagem clara, não 401
      if (e.message && e.message.toLowerCase().includes('não encontrado')) {
        res.status(404).json({ erro: 'Usuário não encontrado - faça cadastro primeiro' });
      } else {
        res.status(400).json({ erro: e.message });
      }
    }
  };

  // POST /auth/login-com-senha - Login com senha (separado)
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
      console.error('[AuthController][LOGIN-SENHA] Erro:', e.message);
      res.status(401).json({ erro: e.message });
    }
  };

  // POST /auth/validar-codigo - Valida código de cadastro ou login
  public validarCodigo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, codigo, tipo } = req.body;
      console.log('[AuthController][VALIDAR] Body:', { email, codigo, tipo });
      const result = await this.authService.validarCodigo({ email, codigo, tipo });
      console.log('[AuthController][VALIDAR] Código OK');
      res.json(result);
    } catch (e: any) {
      console.error('[AuthController][VALIDAR] Erro:', e.message);
      res.status(400).json({ erro: e.message });
    }
  };

  public reenviarCodigo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, tipo } = req.body;
      console.log('[AuthController][REENVIAR] Para:', email, tipo);
      const result = await this.authService.reenviarCodigo({ email, tipo });
      res.json(result);
    } catch (e: any) {
      console.error('[AuthController][REENVIAR] Erro:', e.message);
      res.status(400).json({ erro: e.message });
    }
  };

  public cancelarCadastro = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      console.log('[AuthController][CANCELAR] Para:', email);
      const result = await this.authService.cancelarCadastro({ email });
      res.json(result);
    } catch (e: any) {
      console.error('[AuthController][CANCELAR] Erro:', e.message);
      res.status(400).json({ erro: e.message });
    }
  };


  // GET /usuarios/me - SEM VIEW - Consulta direta com JOINs
  public me = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuarioAuth = (req as any).usuario;
      if (!usuarioAuth?.id) {
        res.status(401).json({ erro: 'Não autenticado' });
        return;
      }
      console.log('[AuthController][ME] Buscando usuario', usuarioAuth.id, 'com endereco ativo - consulta direta SEM VIEW');
      
      const pool = BaseRepository.getPool() as any;
      if (!pool) {
        res.status(500).json({ erro: 'Pool não configurado' });
        return;
      }

      // Consulta direta SEM VIEW - traz todos os campos de endereço
      const resDB = await pool.query(`
        SELECT 
          u.id, u.nome_completo, u.email, u.cpf, u.cnpj, u.nome_fantasia,
          u.funcao_principal, u.valor_hora_base, u.bio, u.tem_mei, u.como_chega, u.ajuda_uber,
          u.tipo_usuario_id, u.status_usuario_id, u.role, u.criado_em, u.atualizado_em,
          tu.chave as tipo_chave, tu.nome_exibicao as tipo_nome, tu.nivel_permissao, tu.descricao as tipo_descricao,
          -- Endereço ativo completo
          eu.id as endereco_ativo_id, 
          eu.endereco as endereco_ativo_completo,
          eu.endereco as endereco_ativo, 
          eu.bairro as endereco_ativo_bairro, 
          eu.cep as endereco_ativo_cep, 
          eu.numero as endereco_ativo_numero, 
          eu.complemento as endereco_ativo_complemento,
          eu.lat as endereco_ativo_lat, 
          eu.lng as endereco_ativo_lng,
          eu.cidade_id as endereco_ativo_cidade_id,
          -- Cidade
          c.nome as endereco_ativo_cidade, 
          c.nome as cidade_real,
          c.estado as endereco_ativo_estado,
          c.estado_id as endereco_ativo_estado_id,
          c.ativa as cidade_ativa,
          -- Estado
          e.id as estado_id_real,
          e.sigla as endereco_ativo_estado_sigla,
          e.nome as endereco_ativo_estado_nome,
          e.ativo as estado_ativo,
          -- Campos compatibilidade frontend antigo
          eu.endereco as endereco_completo,
          eu.bairro as bairro,
          eu.cep as cep,
          eu.numero as numero,
          eu.complemento as complemento,
          c.id as cidade_id,
          c.nome as cidade_nome,
          c.nome as cidade,
          e.sigla as estado,
          e.sigla as uf,
          e.id as estado_id
        FROM usuarios u
        LEFT JOIN tipos_usuario tu ON tu.id = u.tipo_usuario_id
        LEFT JOIN enderecos_usuario eu ON eu.usuario_id = u.id AND eu.is_ativo = true
        LEFT JOIN cidades c ON c.id = eu.cidade_id
        LEFT JOIN estados e ON e.id = c.estado_id OR (e.id = (SELECT id FROM estados WHERE UPPER(sigla)=UPPER(c.estado) LIMIT 1))
        WHERE u.id = $1
        ORDER BY eu.criado_em DESC 
        LIMIT 1
      `, [usuarioAuth.id]);

      let usuario = resDB.rows[0];

      // Fallback se não tem endereço ativo, busca só usuario
      if (!usuario) {
        const resUser = await pool.query(`
          SELECT u.*, tu.chave as tipo_chave, tu.nome_exibicao as tipo_nome, tu.nivel_permissao
          FROM usuarios u
          LEFT JOIN tipos_usuario tu ON tu.id = u.tipo_usuario_id
          WHERE u.id = $1
        `, [usuarioAuth.id]);
        usuario = resUser.rows[0];
      }

      console.log('[AuthController][ME] Usuario encontrado SEM VIEW com endereco completo:', {
        id: usuario?.id,
        nome: usuario?.nome_completo,
        endereco_ativo: usuario?.endereco_ativo_completo,
        endereco: usuario?.endereco_completo,
        bairro: usuario?.endereco_ativo_bairro || usuario?.bairro,
        cep: usuario?.endereco_ativo_cep || usuario?.cep,
        numero: usuario?.endereco_ativo_numero || usuario?.numero,
        complemento: usuario?.endereco_ativo_complemento || usuario?.complemento,
        cidade_id: usuario?.endereco_ativo_cidade_id || usuario?.cidade_id,
        cidade: usuario?.endereco_ativo_cidade || usuario?.cidade_nome,
        estado: usuario?.endereco_ativo_estado || usuario?.estado,
        estado_id: usuario?.endereco_ativo_estado_id || usuario?.estado_id,
        estado_sigla: usuario?.endereco_ativo_estado_sigla
      });

      res.json({ usuario });
    } catch (e: any) {
      console.error('[AuthController][ME] Erro SEM VIEW:', e.message, e.stack);
      res.status(500).json({ erro: e.message });
    }
  };


  // POST /usuarios/atualizar - Atualiza perfil e endereço
  public atualizarPerfil = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuarioAuth = (req as any).usuario;
      if (!usuarioAuth?.id) {
        res.status(401).json({ erro: 'Não autenticado' });
        return;
      }

      console.log('[AuthController][ATUALIZAR] Usuario', usuarioAuth.id, 'dados:', {
        nome: req.body.nome,
        endereco: req.body.endereco,
        bairro: req.body.bairro,
        cep: req.body.cep,
        numero: req.body.numero
      });

      const pool = BaseRepository.getPool() as any;

      // Atualiza dados básicos do usuario (sem endereço - endereço vai para enderecos_usuario)
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

      // Atualiza endereço em enderecos_usuario se enviou dados de endereço
      if (endereco || bairro || cidade_id || cep || numero || complemento) {
        try {
          await (this.authService as any).salvarEnderecoUsuario(usuarioAuth.id, {
            endereco: endereco || null,
            bairro: bairro || 'Centro',
            cidade_id: cidade_id || 1,
            cep: cep || null,
            numero: numero || null,
            complemento: complemento || null,
            lat: lat || null,
            lng: lng || null
          });
          console.log('[ATUALIZAR] Endereço atualizado para usuario', usuarioAuth.id);
        } catch (e:any) {
          console.log('[ATUALIZAR] Erro ao atualizar endereço:', e.message);
        }
      }

      // Retorna usuário atualizado com endereço via view
      let usuarioAtualizado = null;
      try {
        usuarioAtualizado = await this.authService.buscarUsuarioComEnderecoAtivo(usuarioAuth.id);
      } catch {}

      if (!usuarioAtualizado) {
        const resDB = await pool.query(`SELECT * FROM usuarios WHERE id = $1`, [usuarioAuth.id]);
        usuarioAtualizado = resDB.rows[0];
      }

      res.json({ sucesso: true, usuario: usuarioAtualizado, mensagem: 'Perfil atualizado com sucesso' });

    } catch (e: any) {
      console.error('[AuthController][ATUALIZAR] Erro:', e.message);
      res.status(500).json({ erro: e.message });
    }
  };
}
