import { VagaRepository } from '../repositories/VagaRepository';

export class MuralVagasService {
    private vagaRepository = new VagaRepository();

    public async listarVagasParaMural(usuarioId: number, tipoUsuario: 'FREELA' | 'CONTRATANTE'): Promise<any[]> {
        // Busca do banco respeitando as travas de bloqueio mútuo por avaliações ruins
        const vagasBrutas = await this.vagaRepository.buscarMuralSemBloqueiosDeAvaliacao(usuarioId);
        
        return vagasBrutas.map(vaga => {
            const horas = Number(vaga.horas_estimadas);
            const valorHora = Number(vaga.valor_hora_limpo);
            const uber = Number(vaga.ajuda_custo_transporte);
            const subtotal = (horas * valorHora) + uber;

            if (tipoUsuario === 'FREELA') {
                // Freela visualiza apenas o valor cheio que irá receber, limpo de taxas extras
                return {
                    id: vaga.id,
                    funcao: vaga.funcao,
                    data_hora: vaga.data_hora,
                    endereco_completo: vaga.endereco_completo,
                    valor_visivel: subtotal,
                    status: vaga.status
                };
            } else {
                // Contratante visualiza as taxas embutidas (14% cartão / 10% pix)
                return {
                    id: vaga.id,
                    funcao: vaga.funcao,
                    data_hora: vaga.data_hora,
                    endereco_completo: vaga.endereco_completo,
                    total_cartao: subtotal * 1.14,
                    total_pix_desconto: subtotal * 1.10,
                    status: vaga.status
                };
            }
        });
    }
}
