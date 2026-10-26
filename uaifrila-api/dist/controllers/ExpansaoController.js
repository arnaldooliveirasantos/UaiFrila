"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpansaoController = void 0;
const ExpansaoRepository_1 = require("../repositories/ExpansaoRepository");
class ExpansaoController {
    repo = new ExpansaoRepository_1.ExpansaoRepository();
    async validarAcesso(req) {
        const user = req.user;
        if (!user)
            return false;
        return user.is_admin || user.is_super_admin || ['super_admin', 'admin'].includes(user.role);
    }
    listar = async (req, res) => {
        try {
            if (!await this.validarAcesso(req)) {
                res.status(403).json({ erro: 'Acesso negado: apenas admin' });
                return;
            }
            const { status, prioridade, search } = req.query;
            const expansoes = await this.repo.listarExpansao({
                status: status,
                prioridade: prioridade !== undefined ? parseInt(prioridade) : undefined,
                search: search
            });
            const estatisticas = await this.repo.obterEstatisticas();
            res.status(200).json({ sucesso: true, expansoes, estatisticas });
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
    hierarquia = async (req, res) => {
        try {
            const hierarquia = await this.repo.listarCidadesHierarquia();
            res.status(200).json({ sucesso: true, hierarquia });
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
    bairros = async (req, res) => {
        try {
            const cidadeId = parseInt(req.params.cidadeId);
            const bairros = await this.repo.listarBairros(cidadeId);
            res.status(200).json({ sucesso: true, bairros });
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
    solicitar = async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ erro: 'Não autenticado' });
                return;
            }
            const { cidade_nome, estado_sigla, populacao, motivo } = req.body;
            if (!cidade_nome || !estado_sigla) {
                res.status(400).json({ erro: 'cidade_nome e estado_sigla obrigatórios' });
                return;
            }
            const result = await this.repo.criarSolicitacao({
                cidade_nome,
                estado_sigla,
                populacao,
                motivo,
                solicitado_por: userId
            });
            res.status(201).json({ sucesso: true, expansao: result[0] });
        }
        catch (e) {
            res.status(400).json({ erro: e.message });
        }
    };
    atualizarStatus = async (req, res) => {
        try {
            if (!await this.validarAcesso(req)) {
                res.status(403).json({ erro: 'Acesso negado: apenas admin' });
                return;
            }
            const id = parseInt(req.params.id);
            const { status, motivo } = req.body;
            const userId = req.user?.id;
            if (!status) {
                res.status(400).json({ erro: 'Status obrigatório' });
                return;
            }
            const result = await this.repo.atualizarStatus(id, status, userId, motivo);
            res.status(200).json({ sucesso: true, expansao: result[0] });
        }
        catch (e) {
            res.status(400).json({ erro: e.message });
        }
    };
    estatisticas = async (req, res) => {
        try {
            if (!await this.validarAcesso(req)) {
                res.status(403).json({ erro: 'Acesso negado' });
                return;
            }
            const stats = await this.repo.obterEstatisticas();
            res.status(200).json({ sucesso: true, ...stats });
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
}
exports.ExpansaoController = ExpansaoController;
