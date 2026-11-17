import { UsuarioPixRepository } from '../repositories/UsuarioPixRepository';
import { UsuarioPixModel } from '../models/UsuarioPixModel';
import { BaseService } from './BaseService';

// Regra de negocio dos dados PIX. Sem SQL (Repository), sem req/res (Controller).
export const TIPOS_CHAVE_PIX = ['CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'ALEATORIA'] as const;

function validarChave(tipo: string, chave: string): string | null {
  const c = String(chave || '').trim();
  if (!c) return 'Chave PIX obrigatoria';
  if (tipo === 'CPF' && c.replace(/\D/g, '').length !== 11) return 'CPF deve ter 11 digitos';
  if (tipo === 'CNPJ' && c.replace(/\D/g, '').length !== 14) return 'CNPJ deve ter 14 digitos';
  if (tipo === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) return 'E-mail invalido para chave PIX';
  if (tipo === 'TELEFONE' && c.replace(/\D/g, '').length < 10) return 'Telefone invalido para chave PIX (DDD + numero)';
  return null;
}

export class UsuarioPixService extends BaseService<UsuarioPixModel> {
  protected repository: UsuarioPixRepository;

  constructor() {
    super();
    this.repository = new UsuarioPixRepository();
  }

  async buscarMeuPix(usuarioId: number): Promise<UsuarioPixModel | null> {
    try {
      if (!usuarioId) throw new Error('Usuario ID obrigatorio');
      return await this.repository.buscarAtivoPorUsuario(usuarioId);
    } catch (e: any) { this.handleError(e, 'UsuarioPixService.buscarMeuPix'); }
  }

  async listarHistorico(usuarioId: number): Promise<UsuarioPixModel[]> {
    try {
      if (!usuarioId) throw new Error('Usuario ID obrigatorio');
      return await this.repository.listarPorUsuario(usuarioId);
    } catch (e: any) { this.handleError(e, 'UsuarioPixService.listarHistorico'); }
  }

  async salvarPix(usuarioId: number, dados: any): Promise<any> {
    try {
      if (!usuarioId) throw new Error('Usuario ID obrigatorio');
      // Validação de chave: formato + existência no provedor + titular.
      const { PixValidacaoService } = await import('./PixValidacaoService');
      const pixValSvc = new PixValidacaoService();
      const tipo = String(dados?.tipo_chave ?? dados?.tipoChave ?? '').toUpperCase();
      const chavePix = String(dados?.chave_pix ?? dados?.chavePix ?? '').trim();
      const erroFormato = pixValSvc.validarFormato(tipo, chavePix);
      if (erroFormato) throw new Error(erroFormato);
      const pool = (await import('../repositories/BaseRepository')).BaseRepository.getPool() as any;
      const ru = await pool.query(`SELECT id, nome_completo, cpf, email FROM usuarios WHERE id = $1`, [usuarioId]);
      const usuarioDb = ru.rows[0];
      if (!usuarioDb) throw new Error('Usuário não encontrado');
      const existencia = await pixValSvc.verificarExistencia(chavePix);
      if (existencia.verificavel && existencia.existe === false) throw new Error('Dados inválidos — esta chave Pix não existe. Confira e tente de novo.');
      const titular = await pixValSvc.avaliarTitular(usuarioDb, dados);
      if (titular.divergente) {
        const jaValidado = await pixValSvc.buscarValidada(usuarioId, chavePix);
        if (!jaValidado) {
          if (!dados?.confirmar_uso_terceiro && !dados?.confirmarUsoTerceiro) {
            const e: any = new Error('Pix de terceiro — confirme que a chave é de outra pessoa e valide por e-mail');
            e.status = 409; e.precisa_confirmacao = true; e.motivo = titular.motivo;
            throw e;
          }
          const iniciada = await pixValSvc.iniciarValidacao(usuarioDb, dados);
          return { pendente_validacao: true, precisa_confirmacao: true, motivo: titular.motivo, ...iniciada };
        }
      }
      if (!(TIPOS_CHAVE_PIX as readonly string[]).includes(tipo)) throw new Error('tipo_chave deve ser CPF, CNPJ, EMAIL, TELEFONE ou ALEATORIA');
      const erroChave = validarChave(tipo, chavePix);
      if (erroChave) throw new Error(erroChave);
      const nomeTitular = String(dados?.nome_titular ?? dados?.nomeTitular ?? '').trim();
      if (!nomeTitular) throw new Error('Nome do titular obrigatorio');
      const tipoConta = dados?.tipo_conta ?? dados?.tipoConta ?? null;
      if (tipoConta && !['CORRENTE', 'POUPANCA'].includes(String(tipoConta).toUpperCase())) throw new Error('tipo_conta deve ser CORRENTE ou POUPANCA');
      const cpfCnpj = dados?.cpf_cnpj_titular ?? dados?.cpfCnpjTitular ?? null;
      return await this.repository.salvarNovo(usuarioId, {
        tipoChave: tipo,
        chavePix,
        nomeTitular,
        cpfCnpjTitular: cpfCnpj ? String(cpfCnpj).replace(/\D/g, '') : null,
        banco: dados?.banco ? String(dados.banco).trim() : null,
        agencia: dados?.agencia ? String(dados.agencia).trim() : null,
        conta: dados?.conta ? String(dados.conta).trim() : null,
        tipoConta: tipoConta ? String(tipoConta).toUpperCase() : null,
      });
    } catch (e: any) { this.handleError(e, 'UsuarioPixService.salvarPix'); }
  }

  async excluirPix(usuarioId: number): Promise<boolean> {
    try {
      if (!usuarioId) throw new Error('Usuario ID obrigatorio');
      return await this.repository.excluirAtivo(usuarioId);
    } catch (e: any) { this.handleError(e, 'UsuarioPixService.excluirPix'); }
  }
}
