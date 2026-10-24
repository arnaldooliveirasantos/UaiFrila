import { CidadeRepository } from '../repositories/CidadeRepository';

export class CidadeService {
    private cidadeRepository: CidadeRepository = new CidadeRepository();

    public async listarArvoreGeografica(): Promise<any[]> {
        return await this.cidadeRepository.buscarTodasComHierarquia();
    }

    public async alternarStatusCidade(id: number, ativo: boolean): Promise<any[]> {
        return await this.cidadeRepository.atualizarStatus(id, ativo);
    }
}
