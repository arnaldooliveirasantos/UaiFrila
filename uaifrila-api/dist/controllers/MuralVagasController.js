"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MuralVagasController = void 0;
const MuralVagasService_1 = require("../services/MuralVagasService");
class MuralVagasController {
    muralService = new MuralVagasService_1.MuralVagasService();
    obterMural = async (req, res) => {
        try {
            const { usuarioId, tipo } = req.body; // Injetados pelo AuthMiddleware
            if (!usuarioId || !tipo) {
                res.status(400).json({ erro: "Parâmetros 'usuarioId' e 'tipo' são obrigatórios." });
                return;
            }
            const dadosMural = await this.muralService.listarVagasParaMural(Number(usuarioId), tipo);
            res.status(200).json(dadosMural);
        }
        catch (error) {
            res.status(500).json({ erro: error.message });
        }
    };
}
exports.MuralVagasController = MuralVagasController;
