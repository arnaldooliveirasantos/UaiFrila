import jwt from 'jsonwebtoken';
import { UsuarioService } from './UsuarioService';
import { EnderecoService } from './EnderecoService';
import { StatusUsuarioService } from './StatusUsuarioService';
import { TipoUsuarioService } from './TipoUsuarioService';
import { EmailHistoricoService } from './EmailHistoricoService';
import { EmailStatusService } from './EmailStatusService';
import { EmailService } from './EmailService';
import { CandidaturaRepository } from '../repositories/CandidaturaRepository';
// Regra definitiva do fluxo:
//  solicitar tipo=cadastro -> CRIA usuario AGUARDANDO_VALIDACAO (+ endereco) e grava o codigo.
//  validar tipo=cadastro  -> SÓ ALTERA status para ATIVO. Nunca cria usuario.
//  cancelar               -> status CANCELADO + anonimiza email/CPF + apaga endereco + cancela candidaturas.
// Toda a escrita acontece dentro da transacao unica do TransactionMiddleware — NENHUM BEGIN/COMMIT aqui.
const JWT_SECRET = process.env.JWT_SECRET || '';
function erro(message: string, status = 400): any { const e: any = new Error(message); e.status = status; return e; }
function gerarToken(usuario: any, tipoChave: string, nivel: number, tipoUsuarioId: number) {
  return jwt.sign({ id: usuario.id, email: usuario.email, tipoUsuarioId, tipoChave, tipo_chave: tipoChave, nivelPermissao: nivel, nivel_permissao: nivel, isAdmin: nivel >= 80 || ['ADMIN', 'SUPER_ADMIN'].includes(String(tipoChave).toUpperCase()) }, JWT_SECRET, { expiresIn: '7d' });
}
export class CodigoVerificacaoService {
  private usuarioSvc = new UsuarioService();
  private enderecoSvc = new EnderecoService();
  private statusSvc = new StatusUsuarioService();
  private tipoSvc = new TipoUsuarioService();
  private historicoSvc = new EmailHistoricoService();
  private emailStatusSvc = new EmailStatusService();
  private candidaturaRepo = new CandidaturaRepository();
  private async montarToken(usuario: any) {
    const tipo: any = await this.tipoSvc.buscarPorId(Number(usuario.tipo_usuario_id));
    if (!tipo?.chave) throw erro(`Tipo de usuario id=${usuario.tipo_usuario_id} nao cadastrado em tipos_usuario`, 500);
    const tipoChave = tipo.chave; const nivel = Number(tipo.nivel_permissao ?? tipo.nivelPermissao ?? 0);
    const token = gerarToken(usuario, tipoChave, nivel, usuario.tipo_usuario_id);
    return { token, usuario: { ...UsuarioService.semSenha(usuario), tipo_chave: tipoChave, tipoChave, nivel_permissao: nivel } };
  }
  async solicitar(body: any): Promise<{ message: string; usuario_id: number | null; usuario_existente: boolean }> {
    const { email, tipo, dadosCadastro } = body || {};
    if (!email?.includes('@')) throw erro('E-mail invalido', 400);
    const emailNorm = String(email).trim().toLowerCase();
    const tipoFinal = tipo === 'cadastro' ? 'cadastro' : 'login';
    const existente: any = await this.usuarioSvc.buscarPorEmailComStatus(emailNorm);
    const statusExistente = String(existente?.status_chave || '').toUpperCase();
    if (tipoFinal === 'login') {
      if (!existente) throw erro('Usuario nao encontrado - faca o cadastro primeiro', 404);
      if (statusExistente === 'CANCELADO') throw erro('Cadastro cancelado. Voce pode cadastrar novamente.', 403);
    }
    if (tipoFinal === 'cadastro' && existente && statusExistente === 'ATIVO') throw erro('E-mail ja cadastrado - faca login', 409);
    if (tipoFinal === 'cadastro' && existente && !['AGUARDANDO_VALIDACAO', 'CANCELADO'].includes(statusExistente)) throw erro('E-mail ja cadastrado - faca login', 409);
    let usuarioId: number | null = existente?.id || null;
    let nomeParaTemplate = existente?.nome_completo || existente?.nome || '';
    if (tipoFinal === 'cadastro' && dadosCadastro && typeof dadosCadastro === 'object') {
      const dados = dadosCadastro;
      const end = (dados.endereco && typeof dados.endereco === 'object' ? dados.endereco : dados) || {};
      const nome = dados.nome || dados.nome_completo || '';
      const cpf = String(dados.cpf || '').replace(/\D/g, '');
      if (!nome || !cpf) throw erro('Dados do cadastro incompletos (nome/CPF). Preencha o cadastro de novo.', 400);
      if (!end.cidade_id) throw erro('Cidade obrigatoria no cadastro. Selecione a cidade de novo.', 400);
      const statusAguardando: any = await this.statusSvc.buscarPorChave('AGUARDANDO_VALIDACAO');
      if (!statusAguardando?.id) throw erro('Status AGUARDANDO_VALIDACAO nao cadastrado - rode o SQL de status no banco', 500);
      if (!dados.tipo_chave && !dados.tipoChave) throw erro('tipo_chave obrigatorio no cadastro (FREELA / CONTRATANTE / DUAL).', 400);
      const tipoChave = String(dados.tipo_chave || dados.tipoChave).toUpperCase();
      const tipoUsuario: any = await this.tipoSvc.buscarPorChave(tipoChave);
      if (!tipoUsuario?.id) throw erro(`Tipo de usuario '${tipoChave}' nao cadastrado em tipos_usuario - cadastre no banco`, 500);
      const payload: any = { nome_completo: nome, email: emailNorm, cpf: cpf || null, cnpj: dados.cnpj || null, nome_fantasia: dados.nomeFantasia || dados.nome_fantasia || null, funcao_principal: dados.funcao || dados.funcao_principal || 'Garcom', valor_hora_base: Number(dados.valorHora ?? dados.valor_hora_base ?? 20), bio: dados.bio || null, tipo_usuario_id: Number(tipoUsuario.id), tem_mei: !!(dados.temMei ?? dados.tem_mei) };
      if (!existente) {
        payload.status_usuario_id = Number(statusAguardando.id);
        const criado: any = await this.usuarioSvc.criarCadastro(payload);
        usuarioId = Number(criado.id);
      } else {
        await this.usuarioSvc.atualizarCadastro(usuarioId!, payload);
      }
      await this.enderecoSvc.criarOuAtualizarPorUsuario(usuarioId!, end);
      nomeParaTemplate = nome;
    } else if (tipoFinal === 'cadastro' && !dadosCadastro) {
      throw erro('Dados do cadastro nao enviados. Volte e clique em Cadastrar de novo.', 400);
    }
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    await this.historicoSvc.invalidarPendentes(emailNorm);
    const chaveUso = tipoFinal === 'cadastro' ? 'CONFIRMACAO_CADASTRO' : '2FA_LOGIN';
    // Renderiza o template UMA vez e grava o resultado no historico (titulo/conteudo finais).
    const renderizado = await EmailService.renderizarTemplateCodigo({ email: emailNorm, nome: nomeParaTemplate || 'Uai Frila', codigo, tipo: tipoFinal, tempoExpiracaoMin: 5 });
    const statusEmEspera: any = await this.emailStatusSvc.buscarPorChave('EM_ESPERA');
    await this.historicoSvc.criarCodigo({ emailDestinatario: emailNorm, templateId: null, statusId: statusEmEspera?.id || null, codigoVerificacao: codigo, tituloFinal: renderizado.titulo, conteudoFinal: renderizado.conteudo, usuarioId, dadosCadastro: tipoFinal === 'cadastro' ? dadosCadastro : null });
    // EmailService.enviarCodigo so loga (TODO SMTP) — o envio real e feito pelo worker a partir do historico.
    await EmailService.enviarCodigo({ email: emailNorm, nome: nomeParaTemplate || 'Uai Frila', codigo, tipo: tipoFinal, tempoExpiracaoMin: 5 });
    return { message: 'Codigo enviado para seu e-mail', usuario_id: usuarioId, usuario_existente: !!existente };
  }
  async validar(body: any): Promise<{ token: string; usuario: any; data: { token: string; usuario: any } }> {
    const { email, codigo, tipo } = body || {};
    if (!email || !codigo) throw erro('E-mail e codigo obrigatorios', 400);
    const emailNorm = String(email).trim().toLowerCase();
    const codigoNorm = String(codigo).trim();
    const tipoFinal = tipo === 'cadastro' ? 'cadastro' : 'login';
    const codigoRow: any = await this.historicoSvc.buscarUltimoPorEmailCodigo(emailNorm, codigoNorm);
    if (!codigoRow) throw erro('Codigo invalido - nao encontrado para este e-mail. Clique em Reenviar e use o codigo NOVO (o da ultima mensagem).', 400);
    const statusCodigo = String(codigoRow.status_chave || '').toUpperCase();
    if (statusCodigo === 'CONSUMIDO') throw erro('Este codigo ja foi usado. Clique em Reenviar e use o codigo NOVO.', 400);
    if (statusCodigo === 'CANCELADO') throw erro('Este codigo foi cancelado porque voce pediu outro depois. Use o codigo NOVO (o da ultima mensagem).', 400);
    if (codigoRow.expira_em && new Date(codigoRow.expira_em) < new Date()) throw erro('Codigo expirado. Clique em Reenviar e use o codigo NOVO.', 400);
    const usuario: any = await this.usuarioSvc.buscarPorEmailComStatus(emailNorm);
    const statusExistente = String(usuario?.status_chave || '').toUpperCase();
    if (tipoFinal === 'login') {
      if (!usuario) throw erro('Usuario nao encontrado - faca o cadastro primeiro', 404);
      if (statusExistente === 'CANCELADO') throw erro('Cadastro cancelado. Voce pode cadastrar novamente com o mesmo e-mail e CPF.', 403);
      await this.historicoSvc.marcarComoConsumido(codigoRow.id);
      const { token, usuario: u } = await this.montarToken(usuario);
      return { token, usuario: u, data: { token, usuario: u } };
    }
    // cadastro
    if (usuario && statusExistente === 'CANCELADO') throw erro('Cadastro cancelado. Voce pode cadastrar novamente com o mesmo e-mail e CPF.', 403);
    const statusAtivo: any = await this.statusSvc.buscarPorChave('ATIVO');
    if (!statusAtivo?.id) throw erro('Status ATIVO nao cadastrado - rode o SQL de status no banco', 500);
    if (!usuario) throw erro('Usuario nao encontrado. Volte e clique em Cadastrar de novo (o cadastro cria o usuario com AGUARDANDO_VALIDACAO).', 400);
    await this.historicoSvc.marcarComoConsumido(codigoRow.id);
    if (statusExistente === 'AGUARDANDO_VALIDACAO') await this.usuarioSvc.ativar(usuario.id, Number(statusAtivo.id));
    const atualizado: any = await this.usuarioSvc.buscarPorEmailComStatus(emailNorm);
    const { token, usuario: u } = await this.montarToken(atualizado);
    return { token, usuario: u, data: { token, usuario: u } };
  }
  async cancelar(body: any): Promise<{ message: string; usuario_existente: boolean; usuario_id?: number; email_anonimizado?: string }> {
    const { email, codigo } = body || {};
    if (!email || !codigo) throw erro('E-mail e codigo obrigatorios', 400);
    const emailNorm = String(email).trim().toLowerCase();
    const codigoNorm = String(codigo).trim();
    const codigoRow: any = await this.historicoSvc.buscarCodigoParaCancelar(emailNorm, codigoNorm);
    if (!codigoRow) {
      const ultimo: any = (await this.historicoSvc.listarPorEmail(emailNorm))[0];
      if (ultimo && String(ultimo.codigo_verificacao ?? ultimo.codigoVerificacao) === codigoNorm) {
        const st = String(ultimo.status_chave || '').toUpperCase();
        if (st === 'CONSUMIDO') throw erro('Este link ja foi usado (codigo consumido). Solicite um novo codigo.', 400);
        if (ultimo.expira_em && new Date(ultimo.expira_em) < new Date()) throw erro('Link expirado. Solicite um novo codigo.', 400);
      }
      throw erro('Link de cancelamento invalido - codigo nao confere com o e-mail', 400);
    }
    await this.historicoSvc.marcarComoConsumido(codigoRow.id);
    const usuario: any = await this.usuarioSvc.buscarPorEmailComStatus(emailNorm);
    if (!usuario) return { message: 'Cadastro cancelado. Nenhum usuario tinha sido criado com este e-mail. Voce pode cadastrar novamente.', usuario_existente: false };
    const usuarioId = Number(usuario.id);
    if (String(usuario.status_chave || '').toUpperCase() === 'CANCELADO') return { message: 'Cadastro ja estava cancelado. Voce pode cadastrar novamente com o mesmo e-mail e CPF.', usuario_existente: true, usuario_id: usuarioId };
    const statusCancelado: any = await this.statusSvc.buscarPorChave('CANCELADO');
    if (!statusCancelado?.id) throw erro('Status CANCELADO nao cadastrado - rode 01_status_usuario_CANCELADO.sql no banco', 500);
    await this.usuarioSvc.anonimizarCancelar(usuarioId, Number(statusCancelado.id));
    await this.enderecoSvc.deletarPorUsuario(usuarioId);
    await this.candidaturaRepo.cancelarPendentesPorUsuario(usuarioId);
    return { message: 'Cadastro cancelado. Seus dados foram apagados e seu e-mail e CPF foram liberados para um novo cadastro.', usuario_existente: true, usuario_id: usuarioId, email_anonimizado: `${usuarioId}@cancelado.com` };
  }
}
