import { AuthRepository } from '../repositories/AuthRepository';
import jwt from 'jsonwebtoken';

export class AuthService {
  private authRepo = new AuthRepository();

  async registrar(dados: any) {
    const { nome, cpf, email, senha } = dados;
    const emailLimpo = email?.trim().toLowerCase();
    if (!emailLimpo || !emailLimpo.includes('@')) throw new Error('E-mail inválido');
    if (!nome) throw new Error('Nome obrigatório');
    await this.authRepo.listarEmailsDebug();
    const existe = await this.authRepo.existeUsuarioPorEmail(emailLimpo);
    if (existe) throw new Error('E-mail já cadastrado: ' + emailLimpo);
    const senhaHash = this.authRepo.hashSenha(senha);
    const statusAguardandoId = await this.authRepo.buscarIdStatusPorChave('AGUARDANDO_VALIDACAO');
    const usuarioRows = await this.authRepo.criarUsuarioCompleto({...dados, email: emailLimpo, status_usuario_id: statusAguardandoId, status_chave: 'AGUARDANDO_VALIDACAO'}, senhaHash);
    const usuarioCriado = usuarioRows[0];
    const temTemplate = await this.authRepo.existeTemplate('CONFIRMACAO_CADASTRO');
    if (!temTemplate) {
      await this.authRepo.ativarUsuarioPorEmail(emailLimpo);
      return { sucesso: true, usuario: usuarioCriado, modo: 'direto_sem_email' };
    }
    const minutos = await this.authRepo.buscarTempoExpiracao();
    const templateRows = await this.authRepo.buscarTemplatePorUso('CONFIRMACAO_CADASTRO');
    const template = templateRows[0];
    const codigo = this.authRepo.gerarCodigo();
    let corpo = template.conteudo_corpo.replace('{{NOME}}', nome).replace('{{CODIGO}}', codigo).replace('{{EMAIL}}', emailLimpo);
    await this.authRepo.inserirDisparoCadastro(template.id, emailLimpo, template.titulo_assunto, corpo, codigo, minutos, {...dados, email: emailLimpo});
    return { status: 'AGUARDANDO_VALIDACAO_EMAIL', email: emailLimpo, usuario_id: usuarioCriado.id, status_usuario_id: statusAguardandoId };
  }

  async login(email: string) {
    const emailLimpo = email?.trim().toLowerCase();
    if (!emailLimpo) throw new Error('E-mail obrigatório');
    await this.authRepo.listarEmailsDebug();
    const usuarioRows = await this.authRepo.buscarUsuarioPorEmail(emailLimpo);
    if (usuarioRows.length === 0) throw new Error('Usuário não encontrado: ' + emailLimpo);
    const usuario = usuarioRows[0];
    const statusChave = usuario.status_chave || 'ATIVO';
    if (statusChave === 'AGUARDANDO_VALIDACAO') {
      try {
        const minutos = await this.authRepo.buscarTempoExpiracao();
        const templateRows = await this.authRepo.buscarTemplatePorUso('CONFIRMACAO_CADASTRO');
        const template = templateRows[0];
        const codigo = this.authRepo.gerarCodigo();
        let corpo = template.conteudo_corpo.replace('{{NOME}}', usuario.nome_completo).replace('{{CODIGO}}', codigo).replace('{{EMAIL}}', emailLimpo);
        await this.authRepo.inserirDisparoCadastro(template.id, emailLimpo, template.titulo_assunto, corpo, codigo, minutos, {email: emailLimpo, nome: usuario.nome_completo});
        return { status: 'AGUARDANDO_VALIDACAO_EMAIL', email: emailLimpo, mensagem: 'Usuario com status AGUARDANDO_VALIDACAO - novo código enviado' };
      } catch {}
    }
    if (statusChave === 'BLOQUEADO' || statusChave === 'SUSPENSO') {
      throw new Error(`Usuário ${statusChave} - entre em contato com suporte`);
    }
    try {
      const temTemplate = await this.authRepo.existeTemplate('2FA_LOGIN');
      if (!temTemplate) throw new Error('sem template');
      const minutos = await this.authRepo.buscarTempoExpiracao();
      const templateRows = await this.authRepo.buscarTemplatePorUso('2FA_LOGIN');
      const template = templateRows[0];
      const codigo = this.authRepo.gerarCodigo();
      let corpo = template.conteudo_corpo.replace('{{CODIGO}}', codigo).replace('{{EMAIL}}', emailLimpo);
      await this.authRepo.inserirDisparoLogin(template.id, usuario.id, emailLimpo, template.titulo_assunto, corpo, codigo, minutos);
      return { status: 'AGUARDANDO_VALIDACAO_EMAIL', email: emailLimpo };
    } catch (e:any) {
      const token = jwt.sign({ id: usuario.id, email: usuario.email, is_admin: usuario.is_admin || true, status_usuario_id: usuario.status_usuario_id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      return { sucesso: true, token, usuario: { ...usuario, nome: usuario.nome_completo }, modo: 'login_direto_sem_2fa' };
    }
  }

  async buscarMe(id: number) {
    const rows = await this.authRepo.buscarUsuarioPorId(id);
    if (rows.length === 0) throw new Error('Usuário não encontrado');
    return rows[0];
  }

  async atualizarUsuario(id: number, dados: any, usuarioLogado: any) {
    // Bloqueia atualização de CPF e EMAIL na API
    if (dados.cpf !== undefined || dados.email !== undefined || dados.cpfOriginal !== undefined) {
      console.log('🚫 Tentativa de atualizar CPF ou EMAIL bloqueada pela API');
      delete dados.cpf;
      delete dados.email;
      delete dados.cpfOriginal;
    }

    const usuarioAtualRows = await this.authRepo.buscarUsuarioPorId(id);
    if (usuarioAtualRows.length === 0) throw new Error('Usuário não encontrado');
    const usuarioAtual = usuarioAtualRows[0];

    // Regra: Se já é DUAL (is_freela && is_contratante), não pode voltar para simples
    const eraDual = !!(usuarioAtual.is_freela && usuarioAtual.is_contratante);
    if (eraDual) {
      // Se era dual, força manter dual
      dados.is_freela = true;
      dados.is_contratante = true;
    } else {
      // Se não era dual, verifica se está tentando virar dual - pode, mas depois não volta
      const querFreela = dados.is_freela ?? usuarioAtual.is_freela;
      const querContratante = dados.is_contratante ?? usuarioAtual.is_contratante;
      if (querFreela && querContratante) {
        console.log('✅ Usuário virando DUAL - após isso não poderá voltar para simples');
      }
      // Garante pelo menos um
      if (!querFreela && !querContratante) {
        throw new Error('Selecione pelo menos Freela ou Contratante');
      }
    }

    const rows = await this.authRepo.atualizarUsuario(id, dados);
    if (rows.length === 0) throw new Error('Erro ao atualizar');
    return rows[0];
  }

  async verificarCodigo(email: string, codigo: string) {
    const emailLimpo = email?.trim().toLowerCase();
    const disparoRows = await this.authRepo.buscarUltimoDisparoPorEmail(emailLimpo);
    if (disparoRows.length === 0) throw new Error('Nenhum código encontrado: ' + emailLimpo);
    const disparo = disparoRows[0] as any;
    if (new Date() > new Date(disparo.expira_em)) {
      await this.authRepo.marcarDisparoExpirado(disparo.id);
      throw new Error('Código expirado');
    }
    if (disparo.codigo_verificacao !== codigo) throw new Error('Código incorreto');
    await this.authRepo.marcarDisparoValidado(disparo.id);
    const usuarioAtivadoRows = await this.authRepo.ativarUsuarioPorEmail(emailLimpo);
    const usuario = usuarioAtivadoRows[0] || (await this.authRepo.buscarUsuarioPorEmail(emailLimpo))[0];
    const token = jwt.sign({ id: usuario.id, email: usuario.email, is_admin: usuario.is_admin || true, status_usuario_id: usuario.status_usuario_id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    return { sucesso: true, token, usuario: { ...usuario, nome: usuario.nome_completo }, mensagem: 'Usuario ativado' };
  }
}