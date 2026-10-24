import { VagaRepository } from '../repositories/VagaRepository';
export class MuralVagasService {
    private vagaRepository = new VagaRepository();
    public async listarVagasParaMural(usuarioId: number, tipoUsuario: 'FREELA' | 'CONTRATANTE'): Promise<any[]> {
        const vagas = await this.vagaRepository.buscarMuralSemBloqueiosDeAvaliacao(usuarioId);
        return vagas.map(v => {
            const subtotal = (Number(v.horas_estimadas) * Number(v.valor_hora_limpo)) + Number(v.ajuda_custo_transporte);
            return tipoUsuario === 'FREELA' ? { id: v.id, funcao: v.funcao, data_hora: v.data_hora, endereco_completo: v.endereco_completo, valor_visivel: subtotal, status: v.status } 
            : { id: v.id, funcao: v.funcao, data_hora: v.data_hora, endereco_completo: v.endereco_completo, total_cartao: subtotal * 1.14, total_pix_desconto: subtotal * 1.10, status: v.status };
        });
    }
}
