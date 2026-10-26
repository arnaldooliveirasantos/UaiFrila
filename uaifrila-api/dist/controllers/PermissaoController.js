"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissaoController = void 0;
const PermissaoRepository_1 = require("../repositories/PermissaoRepository");
class PermissaoController {
    repo = new PermissaoRepository_1.PermissaoRepository();
    listarMatriz = async (req, res) => {
        try {
            if (!req.body.usuario_is_admin) {
                res.status(403).json({ erro: 'Acesso restrito a administradores.' });
                return;
            }
            res.status(200).json(await this.repo.buscarRolesComPermissoes());
        }
        catch (error) {
            res.status(500).json({ erro: error.message });
        }
    };
    atualizarVinculo = async (req, res) => {
        try {
            if (!req.body.usuario_is_admin) {
                res.status(403).json({ erro: 'Acesso restrito.' });
                return;
            }
            const { roleId, permissaoId, associar } = req.body;
            await this.repo.sincronizarPermissao(Number(roleId), Number(permissaoId), Boolean(associar));
            res.status(200).json({ sucesso: true });
        }
        catch (error) {
            res.status(500).json({ erro: error.message });
        }
    };
}
exports.PermissaoController = PermissaoController;
