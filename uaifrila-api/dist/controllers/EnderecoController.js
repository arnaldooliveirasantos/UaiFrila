"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnderecoController = void 0;
const AuthRepository_1 = require("../repositories/AuthRepository");
class EnderecoController {
    repo = new AuthRepository_1.AuthRepository();
    listar = async (req, res) => {
        try {
            const usuarioId = req.user?.id;
            if (!usuarioId) {
                res.status(401).json({ erro: 'Não autenticado' });
                return;
            }
            const enderecos = await this.repo.buscarEnderecosUsuario(usuarioId);
            const ativo = await this.repo.buscarEnderecoAtivo(usuarioId);
            res.status(200).json({ sucesso: true, enderecos, ativo });
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
    criar = async (req, res) => {
        try {
            const usuarioId = req.user?.id;
            if (!usuarioId) {
                res.status(401).json({ erro: 'Não autenticado' });
                return;
            }
            const { endereco_completo, endereco, bairro, cidade_id, cidade_nome, cidade, lat, lng, endereco_lat, endereco_lng } = req.body;
            if (!endereco_completo && !endereco) {
                res.status(400).json({ erro: 'Endereço completo obrigatório' });
                return;
            }
            const novo = await this.repo.criarEnderecoUsuario(usuarioId, {
                endereco_completo: endereco_completo || endereco,
                bairro,
                cidade_id,
                cidade_nome: cidade_nome || cidade,
                cidade: cidade_nome || cidade,
                lat: lat || endereco_lat,
                lng: lng || endereco_lng,
                endereco_lat: endereco_lat || lat,
                endereco_lng: endereco_lng || lng,
            });
            res.status(201).json({ sucesso: true, endereco: novo, mensagem: 'Endereço criado e ativado. Apenas um pode ficar ativo.' });
        }
        catch (e) {
            const status = e.message.includes('trampo em andamento') ? 423 : 400;
            res.status(status).json({ erro: e.message });
        }
    };
    ativar = async (req, res) => {
        try {
            const usuarioId = req.user?.id;
            const enderecoId = Number(req.params.id);
            if (!usuarioId) {
                res.status(401).json({ erro: 'Não autenticado' });
                return;
            }
            const ativo = await this.repo.ativarEnderecoUsuario(enderecoId, usuarioId);
            res.status(200).json({ sucesso: true, endereco: ativo, mensagem: 'Endereço ativado. Os demais foram desativados.' });
        }
        catch (e) {
            const status = e.message.includes('trampo em andamento') ? 423 : 400;
            res.status(status).json({ erro: e.message });
        }
    };
    atualizar = async (req, res) => {
        try {
            const usuarioId = req.user?.id;
            const enderecoId = Number(req.params.id);
            if (!usuarioId) {
                res.status(401).json({ erro: 'Não autenticado' });
                return;
            }
            const atualizado = await this.repo.atualizarEnderecoUsuario(enderecoId, usuarioId, req.body);
            res.status(200).json({ sucesso: true, endereco: atualizado });
        }
        catch (e) {
            const status = e.message.includes('trampo em andamento') ? 423 : 400;
            res.status(status).json({ erro: e.message });
        }
    };
    deletar = async (req, res) => {
        try {
            const usuarioId = req.user?.id;
            const enderecoId = Number(req.params.id);
            if (!usuarioId) {
                res.status(401).json({ erro: 'Não autenticado' });
                return;
            }
            await this.repo.deletarEnderecoUsuario(enderecoId, usuarioId);
            res.status(200).json({ sucesso: true, mensagem: 'Endereço deletado' });
        }
        catch (e) {
            const status = e.message.includes('trampo em andamento') ? 423 : 400;
            res.status(status).json({ erro: e.message });
        }
    };
    verificarTrampo = async (req, res) => {
        try {
            const usuarioId = req.user?.id;
            if (!usuarioId) {
                res.status(401).json({ erro: 'Não autenticado' });
                return;
            }
            const result = await this.repo.verificarTrampoEmAndamento(usuarioId);
            res.status(200).json(result);
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
}
exports.EnderecoController = EnderecoController;
