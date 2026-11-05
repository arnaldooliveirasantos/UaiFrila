import { EnderecoRepository } from '../repositories/EnderecoRepository';
import { CidadeRepository } from '../repositories/CidadeRepository';
import { BaseService } from './BaseService';

export class EnderecoService extends BaseService {
  private enderecoRepo: EnderecoRepository;
  private cidadeRepo: CidadeRepository;

  constructor() {
    super();
    this.enderecoRepo = new EnderecoRepository();
    this.cidadeRepo = new CidadeRepository();
  }

  async listarPorUsuario(usuarioId: number) {
    try {
      return await this.enderecoRepo.listarPorUsuario(usuarioId);
    } catch (e: any) {
      console.warn('[EnderecoService.listarPorUsuario] erro:', e.message);
      return [];
    }
  }

  async buscarAtivoPorUsuario(usuarioId: number) {
    try {
      return await this.enderecoRepo.buscarAtivoPorUsuario(usuarioId);
    } catch (e: any) {
      console.warn('[EnderecoService.buscarAtivoPorUsuario] erro:', e.message);
      return null;
    }
  }

  async buscarPorId(id: number) {
    return await this.enderecoRepo.buscarCompletoPorId(id) || await this.enderecoRepo.buscarPorId(id);
  }

  async criar(dados: any) {
    this.validateRequired(dados, ['cidadeId', 'logradouro', 'bairro']);
    const cidade = await this.cidadeRepo.buscarPorId(dados.cidadeId);
    if (!cidade) throw new Error('Cidade não encontrada');
    const novo = await this.enderecoRepo.criarGenerico({
      usuarioId: dados.usuarioId,
      cidadeId: dados.cidadeId,
      tipoEnderecoId: dados.tipoEnderecoId || 1,
      logradouro: dados.logradouro,
      numero: dados.numero,
      complemento: dados.complemento,
      bairro: dados.bairro,
      cep: dados.cep,
      ativo: true,
    });
    if (dados.usuarioId && novo) {
      try { await this.enderecoRepo.desativarOutrosAtivos(dados.usuarioId, (novo as any).id); } catch {}
    }
    return novo;
  }

  async atualizar(id: number, dados: any) {
    return await this.enderecoRepo.atualizarGenerico(id, dados);
  }

  async deletar(id: number) {
    return await this.enderecoRepo.deletar(id);
  }

  async definirAtivo(id: number, usuarioId: number) {
    try {
      return await this.enderecoRepo.definirAtivo(id, usuarioId);
    } catch (e: any) {
      await this.enderecoRepo.desativarOutrosAtivos(usuarioId, id);
      const result = await this.enderecoRepo.query(`UPDATE enderecos SET ativo=true WHERE id=$1 AND usuario_id=$2 RETURNING *`, [id, usuarioId]);
      return (result.rows || result)[0] || null;
    }
  }
}
