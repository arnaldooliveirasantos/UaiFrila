"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminFinanceiroService = void 0;
const AdminFinanceiroRepository_1 = require("../repositories/AdminFinanceiroRepository");
class AdminFinanceiroService {
    repo = new AdminFinanceiroRepository_1.AdminFinanceiroRepository();
    async obterParametrosGlobais() { return await this.repo.listarVariaveisSistema(); }
    async salvarParametroGlobal(chave, valor) {
        const num = parseFloat(valor);
        return await this.repo.atualizarVariavelSistema(chave, valor, isNaN(num) ? undefined : num);
    }
    async obterRelatorioAuditoria(inicio, fim) { return []; }
    async listarVariaveis() { return await this.repo.listarVariaveisSistema(); }
    async atualizarVariavel(chave, valor) { return await this.repo.atualizarVariavelSistema(chave, valor); }
}
exports.AdminFinanceiroService = AdminFinanceiroService;
