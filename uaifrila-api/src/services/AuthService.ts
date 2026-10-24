import { AuthRepository } from '../repositories/AuthRepository';
import jwt from 'jsonwebtoken';

export class AuthService {
  private authRepo = new AuthRepository();

  async registrar(dados: any) {
    const { nome, cpf, email, senha, cnpj, nomeFantasia, isFreela, isContratante } = dados;

    if (!email || !email.includes('@')) throw new Error('E-mail inválido - obrigatório');
    if (!nome) throw new Error('Nome obrigatório');

    const existe = await this.authRepo.existeUsuarioPorEmail(email);
    if (existe) throw new Error('E-mail já cadastrado');

    const temTemplate = await this.authRepo.existeTemplate('CONFIRMACAO_CADASTRO');
    const senhaHash = this.authRepo.hashSenha(senha);

    if (!temTemplate) {
      console.log('⚠️ Modo direto sem e-mail - criando usuário');
      const rows = await this.authRepo.criarUsuarioCompleto(dados, senhaHash);
      return { sucesso: true, usuario: rows[0], modo: 'direto_sem_email' };
    }

    const minutos = await this.authRepo.buscarTempoExpiracao();
    const templateRows = await this.authRepo.buscarTemplatePorUso('CONFIRMACAO_CADASTRO');
    const template = templateRows[0];
    const codigo = this.authRepo.gerarCodigo();
    let corpo = template.conteudo_corpo.replace('{{NOME}}', nome).replace('{{CODIGO}}', codigo).replace('{{EMAIL}}', email);

    await this.authRepo.inserirDisparoCadastro(template.id, email, template.titulo_assunto, corpo, codigo, minutos, dados);

    return { status: 'AGUARDANDO_VALIDACAO_EMAIL', email };
  }

  async login(email: string) {
    if (!email) throw new Error('E-mail obrigatório');

    const usuarioRows = await this.authRepo.buscarUsuarioPorEmail(email);
    if (usuarioRows.length === 0) throw new Error('Usuário não encontrado com este e-mail: ' + email);

    const usuario = usuarioRows[0];

    try {
      const temTemplate = await this.authRepo.existeTemplate('2FA_LOGIN');
      if (!temTemplate) throw new Error('sem template');

      const minutos = await this.authRepo.buscarTempoExpiracao();
      const templateRows = await this.authRepo.buscarTemplatePorUso('2FA_LOGIN');
      const template = templateRows[0];
      const codigo = this.authRepo.gerarCodigo();
      let corpo = template.conteudo_corpo.replace('{{CODIGO}}', codigo).replace('{{EMAIL}}', email);

      await this.authRepo.inserirDisparoLogin(template.id, usuario.id, email, template.titulo_assunto, corpo, codigo, minutos);

      return { status: 'AGUARDANDO_VALIDACAO_EMAIL', email };
    } catch {
      const token = jwt.sign({ id: usuario.id, email: usuario.email, is_admin: true }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      return { sucesso: true, token, usuario: { ...usuario, nome: usuario.nome_completo }, modo: 'login_direto_sem_2fa' };
    }
  }

  async verificarCodigo(email: string, codigo: string) {
    const disparoRows = await this.authRepo.buscarUltimoDisparoPorEmail(email);

    if (disparoRows.length === 0) throw new Error('Nenhum código encontrado para este e-mail');

    const disparo = disparoRows[0] as any;

    if (new Date() > new Date(disparo.expira_em)) {
      await this.authRepo.marcarDisparoExpirado(disparo.id);
      throw new Error('Código expirado');
    }

    if (disparo.codigo_verificacao !== codigo) throw new Error('Código incorreto');

    await this.authRepo.marcarDisparoValidado(disparo.id);

    if (disparo.dados_cadastro) {
      const d = typeof disparo.dados_cadastro === 'string' ? JSON.parse(disparo.dados_cadastro) : disparo.dados_cadastro;
      const senhaHash = this.authRepo.hashSenha(d.senha);
      const novoRows = await this.authRepo.criarOuAtualizarUsuarioPorEmail(d, senhaHash);
      const usuario = novoRows[0];
      const token = jwt.sign({ id: usuario.id, email: usuario.email, is_admin: true }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      return { sucesso: true, token, usuario };
    }

    const usuarioRows = await this.authRepo.buscarUsuarioPorEmail(email);
    const usuario = { ...usuarioRows[0], nome: usuarioRows[0].nome_completo };
    const token = jwt.sign({ id: usuario.id, email: usuario.email, is_admin: true }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    return { sucesso: true, token, usuario };
  }
}