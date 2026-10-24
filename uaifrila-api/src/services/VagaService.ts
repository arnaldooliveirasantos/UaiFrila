import { VagaRepository } from '../repositories/VagaRepository';
export class VagaService {
    private vagaRepo = new VagaRepository();
    public async calcularValoresParaExibicao(vaga: any, tipo: string) {
        const sub = (vaga.horas_estimadas * Number(vaga.valor_hora_limpo)) + Number(vaga.ajuda_custo_transporte);
        if (tipo === 'FREELA') return { ...vaga, valor_visivel: sub };
        return { ...vaga, total_cartao: sub * 1.14, total_pix_desconto: sub * 1.10 };
    }
    public async listarVagasDisponiveisParaFreela(id: number) { return await this.vagaRepo.buscarMuralSemBloqueiosDeAvaliacao(id); }
}
