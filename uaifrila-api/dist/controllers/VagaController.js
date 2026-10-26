"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VagaController = void 0;
const VagaService_1 = require("../services/VagaService");
class VagaController {
    vagaService = new VagaService_1.VagaService();
    criar = async (req, res) => {
        try {
            const contratanteId = req.user?.id || req.body.contratante_id;
            if (!contratanteId) {
                res.status(401).json({ erro: 'Não autenticado' });
                return;
            }
            const vaga = await this.vagaService.criar({
                contratante_id: contratanteId,
                ...req.body
            });
            res.status(201).json({ sucesso: true, vaga });
        }
        catch (e) {
            console.error('Erro criar vaga:', e);
            res.status(500).json({ erro: e.message });
        }
    };
    criarVaga = async (req, res) => {
        return this.criar(req, res);
    };
    listar = async (req, res) => {
        try {
            const vagas = await this.vagaService.listar(req.query);
            res.json({ vagas });
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
}
exports.VagaController = VagaController;
