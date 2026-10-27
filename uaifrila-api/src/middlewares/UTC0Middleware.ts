// uaifrila-api/src/middlewares/UTC0Middleware.ts
// Garante que toda resposta da API tenha timestamps em UTC0

import { Request, Response, NextFunction } from 'express';

function convertDatesToUTC0(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertDatesToUTC0);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (['data_inicio', 'data_fim', 'criado_em', 'atualizado_em', 'data_criacao', 'data_atualizacao'].includes(key)) {
          const val = obj[key];
          if (val) {
            try {
              const d = new Date(val);
              if (!isNaN(d.getTime())) {
                converted[key] = d.toISOString();
              } else {
                converted[key] = convertDatesToUTC0(val);
              }
            } catch {
              converted[key] = convertDatesToUTC0(val);
            }
          } else {
            converted[key] = val;
          }
        } else {
          converted[key] = convertDatesToUTC0(obj[key]);
        }
      }
    }
    return converted;
  }
  
  return obj;
}

export function utc0Middleware(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);
  
  (res as any).json = function(body: any): Response {
    const converted = convertDatesToUTC0(body);
    return originalJson(converted);
  };
  
  next();
}
