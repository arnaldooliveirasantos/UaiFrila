"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminFinanceiroController = void 0;
const AdminFinanceiroService_1 = require("../services/AdminFinanceiroService");
class AdminFinanceiroController {
    finService = new AdminFinanceiroService_1.AdminFinanceiroService();
    obterVariaveis = async (req, res) => {
        try {
            if (!req.body.usuario_is_admin) {
                res.status(403).json({ erro: 'Acesso restrito apenas a administradores.' });
                return;
            }
            const dados = await this.finService.obterParametrosGlobais();
            res.status(200).json(dados);
        }
        catch (error) {
            res.status(500).json({ erro: error.message });
        }
    };
    salvarVariavel = async (req, res) => {
        try {
            if (!req.body.usuario_is_admin) {
                res.status(403).json({ erro: 'Acesso restrito apenas a administradores.' });
                return;
            }
            const { chave, valor } = req.body;
            await this.finService.salvarParametroGlobal(chave, valor);
            res.status(200).json({ sucesso: true });
        }
        catch (error) {
            res.status(500).json({ erro: error.message });
        }
    };
    relatorioTransacoes = async (req, res) => {
        try {
            if (!req.body.usuario_is_admin) {
                res.status(403).json({ erro: 'Acesso restrito apenas a administradores.' });
                return;
            }
            const { inicio, fim } = req.query;
            const dados = await this.finService.obterRelatorioAuditoria(String(inicio), String(fim));
            res.status(200).json(dados);
        }
        catch (error) {
            res.status(500).json({ erro: error.message });
        }
    };
}
exports.AdminFinanceiroController = AdminFinanceiroController;
