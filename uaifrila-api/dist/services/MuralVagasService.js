"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MuralVagasService = void 0;
const VagaRepository_1 = require("../repositories/VagaRepository");
class MuralVagasService {
    vagaRepo = new VagaRepository_1.VagaRepository();
    async listarVagasParaMural(usuarioId, tipo) {
        try {
            const vagas = await this.vagaRepo.buscarMuralSemBloqueiosDeAvaliacao(usuarioId);
            return vagas;
        }
        catch (e) {
            console.error('Erro mural:', e);
            return [];
        }
    }
}
exports.MuralVagasService = MuralVagasService;
