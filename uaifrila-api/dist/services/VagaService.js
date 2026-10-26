"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VagaService = void 0;
const VagaRepository_1 = require("../repositories/VagaRepository");
class VagaService {
    vagaRepo = new VagaRepository_1.VagaRepository();
    async calcularValoresParaExibicao(vaga, tipo) {
        const sub = (vaga.horas_estimadas * Number(vaga.valor_hora_limpo)) + Number(vaga.ajuda_custo_transporte);
        if (tipo === 'FREELA')
            return { ...vaga, valor_visivel: sub };
        return { ...vaga, total_cartao: sub * 1.14, total_pix_desconto: sub * 1.10 };
    }
    async listarVagasDisponiveisParaFreela(id) { return await this.vagaRepo.buscarMuralSemBloqueiosDeAvaliacao(id); }
}
exports.VagaService = VagaService;
