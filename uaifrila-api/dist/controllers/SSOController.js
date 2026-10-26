"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSOController = void 0;
class SSOController {
    login = async (req, res) => {
        res.status(501).json({ erro: 'SSO não implementado' });
    };
}
exports.SSOController = SSOController;
