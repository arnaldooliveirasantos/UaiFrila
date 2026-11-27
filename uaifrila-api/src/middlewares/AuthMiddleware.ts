import { Request, Response, NextFunction } from "express";

// Rotas que NAO exigem JWT
const ROTAS_PUBLICAS = [
  "/api/health",
  "/api/auth/solicitar-codigo",
  "/api/auth/validar-codigo",
];

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const path = req.path;
    const fullPath = `/api${path === "/" ? "" : path}`;

    // 1. Health e auth publicos - libera sem token
    if (ROTAS_PUBLICAS.includes(fullPath) || fullPath === "/api/health" || req.originalUrl.startsWith("/api/health")) {
      return next();
    }

    // 2. Worker - libera com WORKER_SECRET (header)
    const workerSecret = req.headers["x-worker-secret"] as string | undefined;
    const expected = process.env.WORKER_SECRET;
    if (expected && workerSecret && workerSecret === expected) {
      return next();
    }

    // 3. JWT normal
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Token não fornecido" });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ success: false, message: "Token não fornecido" });
    }

    // Valida o JWT aqui com o seu codigo existente (jwt.verify)
    // Se o seu projeto ja tinha essa validacao, mantenha ela aqui.
    // Exemplo:
    // const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    // (req as any).usuario = payload;
    // return next();

    // Se voce ja tinha a validacao, substitua este bloco por ela.
    // Por seguranca, se nao houver validacao configurada, nao libera.
    return res.status(401).json({ success: false, message: "Token inválido" });
  } catch (error) {
    console.error("[authMiddleware] Erro:", error);
    return res.status(401).json({ success: false, message: "Token inválido" });
  }
}
