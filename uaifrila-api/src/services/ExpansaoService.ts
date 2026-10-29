
import { ExpansaoRepository } from '../repositories/ExpansaoRepository';

export class ExpansaoService {
  private repository: ExpansaoRepository;

  constructor() {
    this.repository = new ExpansaoRepository();
  }

  async listarCidades() {
    return await this.repository.listarCidades();
  }

  async listarCidadesAtivas() {
    return await this.repository.listarCidadesAtivas();
  }

  async listarSolicitacoes() {
    return await this.repository.listarSolicitacoes();
  }

  async solicitar(cidadeNome: string, estadoSigla: string, motivo: string, solicitadoPor?: number) {
    if (!cidadeNome || !estadoSigla) throw new Error('cidade_nome e estado_sigla obrigatórios');
    return await this.repository.solicitar(cidadeNome, estadoSigla, motivo, solicitadoPor);
  }

  async listarCompleto() {
    const [cidades, solicitacoes] = await Promise.all([
      this.repository.listarCidades(),
      this.repository.listarSolicitacoes()
    ]);
    return { cidades, solicitacoes, expansao: solicitacoes };
  }
}
