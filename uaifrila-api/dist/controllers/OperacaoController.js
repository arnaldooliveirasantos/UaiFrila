"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperacaoController = void 0;
const OperacaoService_1 = require("../services/OperacaoService");
class OperacaoController {
    operacaoService = new OperacaoService_1.OperacaoService();
    candidatar = async (req, res) => {
        try {
            const { vagaId, usuarioId } = req.body;
            await this.operacaoService.candidatarVaga(Number(vagaId), Number(usuarioId));
            res.status(200).json({ sucesso: true, mensagem: 'Candidatura registrada!' });
        }
        catch (error) {
            res.status(400).json({ erro: error.message });
        }
    };
    aceitar = async (req, res) => {
        try {
            const { vagaId, freelaId } = req.body;
            const trampo = await this.operacaoService.aceitarCandidato(Number(vagaId), Number(freelaId));
            res.status(201).json({ sucesso: true, trampo });
        }
        catch (error) {
            res.status(400).json({ erro: error.message });
        }
    };
    historicoChat = async (req, res) => {
        try {
            const { vagaId } = req.params;
            const historico = await this.operacaoService.buscarHistoricoChat(Number(vagaId));
            res.status(200).json(historico);
        }
        catch (error) {
            res.status(500).json({ erro: error.message });
        }
    };
}
exports.OperacaoController = OperacaoController;
