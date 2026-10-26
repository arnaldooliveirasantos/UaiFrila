"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminFinanceiroController = void 0;
const AdminFinanceiroService_1 = require("../services/AdminFinanceiroService");
class AdminFinanceiroController {
    service = new AdminFinanceiroService_1.AdminFinanceiroService();
    obterVariaveis = async (req, res) => {
        try {
            const vars = await this.service.listarVariaveis();
            res.json({ variaveis: vars });
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
    salvarVariavel = async (req, res) => {
        try {
            const result = await this.service.salvarVariavel(req.body);
            res.json({ sucesso: true, variavel: result });
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
    relatorioTransacoes = async (req, res) => {
        try {
            const rel = await this.service.relatorioTransacoes(req.query);
            res.json(rel);
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
}
exports.AdminFinanceiroController = AdminFinanceiroController;
