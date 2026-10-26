"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperacaoController = void 0;
const OperacaoService_1 = require("../services/OperacaoService");
class OperacaoController {
    service = new OperacaoService_1.OperacaoService();
    candidatar = async (req, res) => {
        try {
            const result = await this.service.candidatar(req.body.vagaId, req.user.id);
            res.json(result);
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
    aceitar = async (req, res) => {
        try {
            const result = await this.service.aceitarCandidatura(req.body.candidaturaId, req.user.id);
            res.json(result);
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
    historicoChat = async (req, res) => {
        try {
            const historico = await this.service.historicoChat(Number(req.params.vagaId));
            res.json({ mensagens: historico });
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
}
exports.OperacaoController = OperacaoController;
