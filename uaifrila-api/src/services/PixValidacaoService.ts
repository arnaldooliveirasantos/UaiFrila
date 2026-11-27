import { BaseService } from './BaseService';
import { BaseRepository } from '../repositories/BaseRepository';
import { PixValidacaoRepository } from '../repositories/PixValidacaoRepository';
import { ProvedorPagamentoService } from './ProvedorPagamentoService';
import { VariavelSistemaService } from './VariavelSistemaService';
import { EmailService } from './EmailService';
import { EmailHistoricoService } from './EmailHistoricoService';
import { EmailStatusService } from './EmailStatusService';
import { MercadoPagoProvider } from './MercadoPagoProvider';
import { EfiProvider } from './EfiProvider';
import { descriptografar } from '../utils/Criptografia';
import { normalizarTexto } from '../utils/Dinheiro';
// Validação de chave Pix. Regras:
// - Formato sempre: CPF/CNPJ com dígito verificador, e-mail, telefone DDD válido, aleatória.
// - Existência: consulta o provedor ATIVO. Efí consulta de verdade; Mercado Pago não expõe
//   consulta de chave de terceiros -> verificavel=false (não bloqueia, só marca).
// - Titular divergente: nome OU cpf/cnpj diferente do cadastro -> exige confirmação por e-mail
//   (token 6 dígitos, 30 min). Sem confirmação, o Pix NÃO é salvo.
function soDigitos(s: string): string { return String(s || '').replace(/\D/g, ''); }
function digitoCPF(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0; for (let i = 0; i < 9; i++) soma += Number(cpf[i]) * (10 - i);
  let d1 = (soma * 10) % 11; if (d1 === 10) d1 = 0;
  if (d1 !== Number(cpf[9])) return false;
  soma = 0; for (let i = 0; i < 10; i++) soma += Number(cpf[i]) * (11 - i);
  let d2 = (soma * 10) % 11; if (d2 === 10) d2 = 0;
  return d2 === Number(cpf[10]);
}
function digitoCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (base: string, pesos: number[]) => { let s = 0; for (let i = 0; i < base.length; i++) s += Number(base[i]) * pesos[i]; const r = s % 11; return r < 2 ? 0 : 11 - r; };
  return calc(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(cnpj[12])
    && calc(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(cnpj[13]);
}
export class PixValidacaoService extends BaseService<any> {
  protected repo = new PixValidacaoRepository();
  private provedorSvc = new ProvedorPagamentoService();
  private variavelSvc = new VariavelSistemaService();
  private historicoSvc = new EmailHistoricoService();
  private emailStatusSvc = new EmailStatusService();
  constructor() { super(new PixValidacaoRepository()); }
  validarFormato(tipo: string, chave: string): string | null {
    const c = String(chave || '').trim();
    if (!c) return 'Chave Pix obrigatória';
    if (tipo === 'CPF' && !digitoCPF(soDigitos(c))) return 'CPF inválido (dígito verificador)';
    if (tipo === 'CNPJ' && !digitoCNPJ(soDigitos(c))) return 'CNPJ inválido (dígito verificador)';
    if (tipo === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return 'E-mail inválido para chave Pix';
    if (tipo === 'TELEFONE') { const d = soDigitos(c); if (d.length < 12 || d.length > 13 || !/^[1-9][1-9]9?\d{8}$/.test(d)) return 'Telefone inválido para chave Pix (DDD + número)'; }
    if (tipo === 'ALEATORIA' && c.length < 20) return 'Chave aleatória inválida';
    return null;
  }
  async avaliarTitular(usuario: any, dados: any): Promise<{ divergente: boolean; motivo: string }> {
    const nomeUsuario = normalizarTexto(usuario?.nome_completo || usuario?.nome || '');
    const nomeTitular = normalizarTexto(dados.nome_titular || dados.nomeTitular || '');
    const cpfUsuario = soDigitos(usuario?.cpf || '');
    const cpfTitular = soDigitos(dados.cpf_cnpj_titular || dados.cpfCnpjTitular || '');
    if (cpfUsuario && cpfTitular && cpfUsuario === cpfTitular) return { divergente: false, motivo: '' };
    if (cpfUsuario && cpfTitular && cpfUsuario !== cpfTitular) return { divergente: true, motivo: 'CPF/CNPJ do titular diferente do seu cadastro' };
    if (nomeUsuario && nomeTitular) {
      const tokensU = new Set(nomeUsuario.split(' ').filter(w => w.length > 2));
      const tokensT = nomeTitular.split(' ').filter(w => w.length > 2);
      const comuns = tokensT.filter(w => tokensU.has(w)).length;
      if (comuns >= 1) return { divergente: false, motivo: '' };
      return { divergente: true, motivo: 'Nome do titular diferente do seu cadastro' };
    }
    return { divergente: true, motivo: 'Informe o nome e o CPF/CNPJ do titular' };
  }
  async verificarExistencia(chave: string): Promise<{ existe: boolean | null; verificavel: boolean }> {
    try {
      const { provedor } = await this.provedorSvc.buscarAtivoComSegredos();
      const seg: any = { accessToken: descriptografar((provedor as any).clientSecretCriptografado || (provedor as any).client_secret_criptografado || ''), config: typeof (provedor as any).configJson === 'string' ? JSON.parse((provedor as any).configJson) : ((provedor as any).configJson || (provedor as any).config_json || {}), clientId: (provedor as any).clientId || (provedor as any).client_id };
      const impl = String(provedor.provedor).toUpperCase() === 'EFI' ? new EfiProvider() : new MercadoPagoProvider();
      const r = await impl.validarChavePix(chave, seg);
      return { existe: r.existe, verificavel: r.verificavel };
    } catch (e: any) {
      console.error('[PixValidacao] provedor indisponível:', e.message);
      return { existe: null, verificavel: false };
    }
  }
  async iniciarValidacao(usuario: any, dados: any): Promise<any> {
    const minutos = await this.variavelSvc.buscarNumeroObrigatorio('PIX_VALIDACAO_EMAIL_MINUTOS').catch(() => 30);
    const token = String(Math.floor(100000 + Math.random() * 900000));
    const salvo = await this.repo.criarGenerico({
      usuario_id: usuario.id, tipo_chave: String(dados.tipo_chave || dados.tipoChave).toUpperCase(),
      chave_pix: String(dados.chave_pix || dados.chavePix).trim(),
      nome_titular: String(dados.nome_titular || dados.nomeTitular).trim(),
      cpf_cnpj_titular: soDigitos(dados.cpf_cnpj_titular || dados.cpfCnpjTitular || '') || null,
      banco: dados.banco || null, agencia: dados.agencia || null, conta: dados.conta || null,
      tipo_conta: dados.tipo_conta || dados.tipoConta || null,
      token, status: 'PENDENTE', expira_em: new Date(Date.now() + Number(minutos) * 60 * 1000),
    });
    const renderizado = await EmailService.renderizarTemplateCodigo({ email: usuario.email, nome: usuario.nome_completo || 'Uai Frila', codigo: token, tipo: 'login', tempoExpiracaoMin: Number(minutos) });
    const statusEmEspera: any = await this.emailStatusSvc.buscarPorChave('EM_ESPERA');
    await this.historicoSvc.criarCodigo({ emailDestinatario: usuario.email, templateId: null, statusId: statusEmEspera?.id || null, codigoVerificacao: token, tituloFinal: 'Confirme o Pix de terceiro — UaiFrila', conteudoFinal: renderizado.conteudo.replace('{{CODIGO}}', token), usuarioId: usuario.id, dadosCadastro: null });
    return { validacao_id: salvo.id, expira_em: salvo.expiraEm, precisa_confirmacao: true };
  }
  async confirmarValidacao(usuarioId: number, token: string): Promise<any> {
    const v: any = await this.repo.buscarPorToken(String(token).trim());
    if (!v || Number(v.usuarioId ?? v.usuario_id) !== Number(usuarioId)) throw new Error('Código inválido');
    if (new Date(v.expiraEm ?? v.expira_em).getTime() < Date.now()) {
      await this.repo.atualizarGenerico(Number(v.id), { status: 'EXPIRADO' });
      throw new Error('Código expirado — peça um novo');
    }
    return await this.repo.atualizarGenerico(Number(v.id), { status: 'VALIDADO' });
  }
  async buscarValidada(usuarioId: number, chavePix: string): Promise<any> {
    return await this.repo.buscarValidadaParaChave(usuarioId, chavePix);
  }
}
