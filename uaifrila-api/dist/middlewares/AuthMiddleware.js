"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ erro: 'Token não fornecido - Authorization header obrigatório' });
            return;
        }
        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ erro: 'Token não fornecido - Bearer token vazio' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.JWT_SECRET);
        req.user = decoded;
        req.usuarioId = decoded.id;
        next();
    }
    catch (e) {
        res.status(401).json({ erro: `Token inválido: ${e.message} - verifique JWT_SECRET no .env` });
    }
};
exports.authMiddleware = authMiddleware;
