"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VagaService = void 0;
const BaseService_1 = require("./BaseService");
const VagaRepository_1 = require("../repositories/VagaRepository");
class VagaService extends BaseService_1.BaseService {
    vagaRepo = new VagaRepository_1.VagaRepository();
    async criar(dados) {
        this.validateRequired(dados, ['contratante_id', 'titulo']);
        try {
            const result = await this.vagaRepo.criarVaga(dados);
            return result[0];
        }
        catch (e) {
            this.handleError(e, 'VagaService.criar');
        }
    }
    async listar(filtros) {
        return await this.vagaRepo.listarVagas(filtros);
    }
    async buscarPorId(id) {
        return await this.vagaRepo.buscarPorId(id);
    }
}
exports.VagaService = VagaService;
