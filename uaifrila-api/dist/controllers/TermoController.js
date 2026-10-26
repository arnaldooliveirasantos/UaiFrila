"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TermoController = void 0;
const BaseRepository_1 = require("../repositories/BaseRepository");
class TermoRepository extends BaseRepository_1.BaseRepository {
    async buscarVigente(tipoId) {
        return await this.query(`SELECT * FROM termos WHERE tipo_usuario_id = $1 AND vigente = true LIMIT 1`, [tipoId]);
    }
}
class TermoController {
    repo = new TermoRepository();
    obterTermoVigente = async (req, res) => {
        try {
            const tipoId = Number(req.params.tipoId);
            const termo = await this.repo.buscarVigente(tipoId);
            res.json({ termo: termo[0] || null });
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
}
exports.TermoController = TermoController;
