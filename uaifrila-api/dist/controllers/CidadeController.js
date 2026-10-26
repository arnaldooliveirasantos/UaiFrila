"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CidadeController = void 0;
const AuthRepository_1 = require("../repositories/AuthRepository");
const CidadeRepository_1 = require("../repositories/CidadeRepository");
class CidadeController {
    authRepo = new AuthRepository_1.AuthRepository();
    cidadeRepo = new CidadeRepository_1.CidadeRepository();
    listarAtivas = async (req, res) => {
        try {
            const cidades = await this.cidadeRepo.buscarAtivas();
            res.status(200).json({ sucesso: true, cidades, total: cidades.length, tabela: 'cidades' });
        }
        catch (e) {
            // fallback para AuthRepository
            try {
                const cidades = await this.authRepo.buscarCidadesAtivas();
                res.status(200).json({ sucesso: true, cidades, fallback: true });
            }
            catch {
                res.status(500).json({ erro: e.message, cidades: [{ id: 1, nome: 'Uberlândia', estado: 'MG' }] });
            }
        }
    };
    listarGeografia = async (req, res) => {
        try {
            const cidades = await this.cidadeRepo.buscarTodasComHierarquia();
            res.status(200).json({ sucesso: true, cidades });
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
    atualizarStatus = async (req, res) => {
        try {
            const id = Number(req.params.id);
            const { ativa, ativo } = req.body;
            const status = ativa ?? ativo;
            const cidade = await this.cidadeRepo.atualizarStatus(id, !!status);
            res.status(200).json({ sucesso: true, cidade });
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
    validarEndereco = async (req, res) => {
        try {
            const { cidade, lat, lng } = req.body;
            if (!cidade) {
                res.status(400).json({ erro: 'Cidade obrigatória' });
                return;
            }
            const cidades = await this.cidadeRepo.buscarAtivas();
            const existe = cidades.some((c) => c.nome.toLowerCase() === cidade.toLowerCase());
            if (!existe) {
                res.status(400).json({ valido: false, erro: `Cidade ${cidade} não está ativa. Cidades ativas: ${cidades.map((c) => c.nome).join(', ')}` });
                return;
            }
            if (lat && lng) {
                const valido = await this.authRepo.validarEnderecoNaCidadeAtiva(cidade, Number(lat), Number(lng));
                if (!valido) {
                    res.status(400).json({ valido: false, erro: 'Endereço fora do raio da cidade ativa' });
                    return;
                }
            }
            res.status(200).json({ valido: true, mensagem: 'Endereço dentro da cidade ativa (tabela cidades)' });
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
}
exports.CidadeController = CidadeController;
