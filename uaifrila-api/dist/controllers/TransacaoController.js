"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransacaoController = void 0;
const TransacaoRepository_1 = require("../repositories/TransacaoRepository");
class TransacaoController {
    repo = new TransacaoRepository_1.TransacaoRepository();
    // OOP: Validação usando tipos_usuario nivel_permissao
    async validarAcessoAdmin(req) {
        const user = req.user;
        if (!user)
            return false;
        const nivel = user.nivel_permissao || 0;
        const chave = (user.tipo_chave || user.role || '').toUpperCase();
        return nivel >= 50 || ['FINANCEIRO', 'ADMIN', 'SUPER_ADMIN', 'MODERADOR'].includes(chave);
    }
    relatorio = async (req, res) => {
        try {
            if (!await this.validarAcessoAdmin(req)) {
                res.status(403).json({ erro: 'Acesso negado: apenas admin/financeiro' });
                return;
            }
            const { inicio, fim, status, cidade, page, limit } = req.query;
            const resultado = await this.repo.listarPorPeriodo({
                inicio: inicio,
                fim: fim,
                status: status,
                cidade: cidade,
                page: parseInt(page) || 1,
                limit: parseInt(limit) || 20
            });
            res.status(200).json({ sucesso: true, ...resultado });
        }
        catch (e) {
            console.error('Erro relatorio transacoes:', e);
            res.status(500).json({ erro: e.message });
        }
    };
    estatisticas = async (req, res) => {
        try {
            if (!await this.validarAcessoAdmin(req)) {
                res.status(403).json({ erro: 'Acesso negado' });
                return;
            }
            const stats = await this.repo.obterEstatisticas();
            const porStatus = await this.repo.obterPorStatus();
            const porCidade = await this.repo.obterPorCidade();
            res.status(200).json({
                sucesso: true,
                estatisticas: stats,
                porStatus,
                porCidade
            });
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
    variaveis = async (req, res) => {
        try {
            if (!await this.validarAcessoAdmin(req)) {
                res.status(403).json({ erro: 'Acesso negado' });
                return;
            }
            const variaveis = await this.repo.query(`
        SELECT * FROM variaveis_sistema ORDER BY categoria, chave
      `);
            res.status(200).json({ sucesso: true, variaveis });
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
    salvarVariavel = async (req, res) => {
        try {
            if (!await this.validarAcessoAdmin(req)) {
                res.status(403).json({ erro: 'Acesso negado: apenas super_admin' });
                return;
            }
            const { chave, valor, valor_numerico } = req.body;
            if (!chave || valor === undefined) {
                res.status(400).json({ erro: 'Chave e valor obrigatórios' });
                return;
            }
            const result = await this.repo.query(`
        UPDATE variaveis_sistema 
        SET valor = $2, valor_numerico = $3, atualizado_em = NOW()
        WHERE chave = $1
        RETURNING *
      `, [chave, valor, valor_numerico || null]);
            res.status(200).json({ sucesso: true, variavel: result[0] });
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
}
exports.TransacaoController = TransacaoController;
