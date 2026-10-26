"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CidadeService = void 0;
const CidadeRepository_1 = require("../repositories/CidadeRepository");
class CidadeService {
    cidadeRepository = new CidadeRepository_1.CidadeRepository();
    async listarArvoreGeografica() {
        return await this.cidadeRepository.buscarTodasComHierarquia();
    }
    async alternarStatusCidade(id, ativo) {
        return await this.cidadeRepository.atualizarStatus(id, ativo);
    }
}
exports.CidadeService = CidadeService;
