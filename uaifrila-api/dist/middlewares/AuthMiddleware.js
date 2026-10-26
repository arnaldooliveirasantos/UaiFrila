"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.authOpcionalMiddleware = authOpcionalMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log('❌ Sem Authorization header em', req.path);
        return res.status(401).json({ erro: 'Token não fornecido - faça login' });
    }
    const token = authHeader.replace('Bearer ', '');
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
        console.log('✅ Token válido para usuario:', decoded.email, 'status_usuario_id:', decoded.status_usuario_id);
        // Se usuario ainda está AGUARDANDO_VALIDACAO, bloqueia acesso ao mural mas permite validar
        if (decoded.status_usuario_id === 1) {
            // Permite apenas rotas de validação
            if (req.path.includes('/verificar') || req.path.includes('/validar')) {
                req.user = decoded;
                return next();
            }
            console.log('⚠️ Usuario com status AGUARDANDO_VALIDACAO tentando acessar', req.path);
            return res.status(401).json({
                erro: 'Usuário aguardando validação - valide seu e-mail',
                status_usuario_id: 1,
                status_chave: 'AGUARDANDO_VALIDACAO',
                precisa_validar: true
            });
        }
        req.user = decoded;
        next();
    }
    catch (e) {
        console.log('❌ Token inválido:', e.message, 'token:', token.substring(0, 20));
        return res.status(401).json({ erro: 'Token inválido ou expirado', detalhe: e.message });
    }
}
// Middleware opcional - não bloqueia, apenas decodifica se tiver token
function authOpcionalMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        try {
            const token = authHeader.replace('Bearer ', '');
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = decoded;
        }
        catch { }
    }
    next();
}
