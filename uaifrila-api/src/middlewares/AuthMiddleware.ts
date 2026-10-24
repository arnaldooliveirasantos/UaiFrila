import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ erro: 'Token de acesso não fornecido.' });
        return;
    }

    const [, token] = authHeader.split(' ');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'UaiFrila_SecretDefault_2026') as any;
        req.body.usuarioId = decoded.id;
        req.body.usuario_is_admin = decoded.is_admin;
        req.body.usuario_perfis = decoded.perfis; // Injeta o array relacional limpo no body da requisição
        next();
    } catch (err) {
        res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }
};
