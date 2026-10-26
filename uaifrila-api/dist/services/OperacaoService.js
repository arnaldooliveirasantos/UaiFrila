"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperacaoService = void 0;
const BaseService_1 = require("./BaseService");
const OperacaoRepository_1 = require("../repositories/OperacaoRepository");
class OperacaoService extends BaseService_1.BaseService {
    repo = new OperacaoRepository_1.OperacaoRepository();
    async candidatar(vagaId, usuarioId) {
        this.validateRequired({ vagaId, usuarioId }, ['vagaId', 'usuarioId']);
        try {
            return await this.repo.candidatar(vagaId, usuarioId);
        }
        catch (e) {
            this.handleError(e, 'OperacaoService.candidatar');
        }
    }
    async aceitarCandidatura(candidaturaId, contratanteId) {
        return await this.repo.aceitarCandidatura(candidaturaId, contratanteId);
    }
    async historicoChat(vagaId) {
        return await this.repo.historicoChat(vagaId);
    }
    async salvarMensagem(vagaId, remetenteId, conteudo) {
        return await this.repo.salvarMensagem(vagaId, remetenteId, conteudo);
    }
}
exports.OperacaoService = OperacaoService;
