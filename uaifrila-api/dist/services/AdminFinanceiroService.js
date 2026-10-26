"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminFinanceiroService = void 0;
const BaseService_1 = require("./BaseService");
const AdminFinanceiroRepository_1 = require("../repositories/AdminFinanceiroRepository");
class AdminFinanceiroService extends BaseService_1.BaseService {
    repo = new AdminFinanceiroRepository_1.AdminFinanceiroRepository();
    async listarVariaveis() {
        try {
            return await this.repo.listarVariaveis();
        }
        catch (e) {
            this.handleError(e, 'AdminFinanceiroService.listarVariaveis');
        }
    }
    async salvarVariavel(dados) {
        this.validateRequired(dados, ['chave']);
        return await this.repo.salvarVariavel(dados);
    }
    async relatorioTransacoes(filtros) {
        return await this.repo.relatorioTransacoes(filtros);
    }
}
exports.AdminFinanceiroService = AdminFinanceiroService;
