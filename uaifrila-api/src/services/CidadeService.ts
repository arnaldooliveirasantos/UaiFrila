import { CidadeRepository } from '../repositories/CidadeRepository';
import { CidadeModel } from '../models/CidadeModel';
export class CidadeService {
  private repo: CidadeRepository;
  constructor() { this.repo = new CidadeRepository(); }
  async listar(): Promise<CidadeModel[]> { return await this.repo.buscarTodos(); }
  async listarAtivas(): Promise<CidadeModel[]> { return await this.repo.listarAtivas(); }
  async listarTodas(): Promise<CidadeModel[]> { return await this.listar(); }
  async listarPorEstado(estadoId: number): Promise<CidadeModel[]> { if (!estadoId || isNaN(estadoId)) throw new Error('estadoId obrigatorio'); return await this.repo.listarPorEstado(estadoId); }
  async listarPorEstadoSigla(sigla: string): Promise<CidadeModel[]> { if (!sigla) throw new Error('sigla obrigatoria'); return await this.repo.listarPorEstadoSigla(sigla); }
  async buscarPorId(id: number): Promise<CidadeModel> { const c = await this.repo.buscarPorId(id); if (!c) throw new Error('Cidade nao encontrada'); return c; }
  async buscarPorIdComRelacoes(id: number): Promise<CidadeModel | null> { return await this.repo.buscarPorIdComRelacoes(id); }
  async criar(dados: any): Promise<CidadeModel> { const payload = { ...dados }; if (payload.ativo !== undefined && payload.ativa === undefined) { payload.ativa = payload.ativo; } delete payload.ativo; delete payload.estado; return await this.repo.criarGenerico(payload); }
  async atualizar(id: number, dados: any): Promise<CidadeModel | null> { const payload = { ...dados }; if (payload.ativo !== undefined && payload.ativa === undefined) { payload.ativa = payload.ativo; } delete payload.ativo; delete payload.estado; delete payload.estado_sigla; delete payload.sigla; return await this.repo.atualizarGenerico(id, payload); }
  async deletar(id: number): Promise<boolean> { return await this.repo.deletarPorId(id); }
  async atualizarStatus(id: number, ativa: boolean): Promise<CidadeModel | null> { return await this.atualizar(id, { ativa }); }
}
