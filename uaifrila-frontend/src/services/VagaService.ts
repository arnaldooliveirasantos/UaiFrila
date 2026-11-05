import { VagaRepository } from '../repositories/VagaRepository';
import { BaseService } from './BaseService';

export class VagaService extends BaseService {
  private repository: VagaRepository;
  constructor() {
    super();
    this.repository = new VagaRepository();
  }

  async listar() {
    return await this.repository.buscarTodos();
  }

  async listarAbertas() {
    return await this.repository.listarAbertas();
  }

  async listarPorContratante(contratanteId: number) {
    const id = Number(contratanteId);
    if (!id || isNaN(id)) {
      console.warn('[VagaService.listarPorContratante] id inválido:', contratanteId);
      return [];
    }
    return await this.repository.listarPorContratante(id);
  }

  async buscarPorId(id: number) {
    const idNum = Number(id);
    if (!idNum || isNaN(idNum)) return null;
    return await this.repository.buscarPorId(idNum);
  }

  async buscarCompletaPorId(id: number) {
    const idNum = Number(id);
    if (!idNum || isNaN(idNum)) return null;
    return await this.repository.buscarCompletaPorId(idNum);
  }

  async criar(dados: any) {
    this.validateRequired(dados, ['titulo', 'descricao']);
    const payload = {
      contratanteId: Number(dados.contratanteId || dados.contratante_id),
      titulo: dados.titulo,
      descricao: dados.descricao,
      funcao: dados.funcao || dados.titulo,
      valor: Number(dados.valor || dados.valor_servico || 0),
      valorServico: Number(dados.valor_servico || dados.valor || 0),
      dataInicio: dados.data_inicio ? new Date(dados.data_inicio) : new Date(),
      dataFim: dados.data_fim ? new Date(dados.data_fim) : new Date(Date.now() + 86400000),
      status: dados.status || 'ABERTA',
      cidadeId: dados.cidade_id || dados.cidadeId || null,
      enderecoId: dados.endereco_id || dados.enderecoId || null,
    };
    if (!payload.contratanteId || isNaN(payload.contratanteId)) throw new Error('contratanteId obrigatório');
    return await this.repository.criarGenerico(payload);
  }

  async atualizar(id: number, dados: any) {
    const idNum = Number(id);
    if (!idNum || isNaN(idNum)) throw new Error('ID inválido');
    return await this.repository.atualizarGenerico(idNum, dados);
  }

  async deletar(id: number) {
    const idNum = Number(id);
    if (!idNum || isNaN(idNum)) throw new Error('ID inválido');
    return await this.repository.deletar(idNum);
  }

  async calcular(dados: any) {
    const valor = Number(dados.valor || dados.valor_servico || 0);
    const taxa = 0.1;
    const valorLiquido = valor * (1 - taxa);
    return { valorBruto: valor, taxa: taxa * 100, valorLiquido, taxaValor: valor * taxa };
  }
}
