import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

export function loggerMiddleware(req: Request, res: Response, next: NextFunction) {
    const ambiente = process.env.NODE_ENV;
    const logsAtivos = process.env.LOGS_ATIVOS; // 'true' ou 'false' extraído do ambiente de forma pura

    // Se estiver em produção e os logs estiverem ativos, processa a escrita física de arquivos diários
    if (ambiente === 'production' && logsAtivos === 'true') {
        const pastaLogs = path.join(__dirname, '..', '..', 'logs');
        
        // Garante a existência da pasta de logs de forma síncrona estrutural
        if (!fs.existsSync(pastaLogs)) {
            fs.mkdirSync(pastaLogs, { recursive: true });
        }

        const dataAtual = new Date().toISOString().split('T')[0]; // Formato: YYYY-MM-DD
        const arquivoLog = path.join(pastaLogs, `${dataAtual}.log`);

        // Intercepta a finalização da resposta para computar o status code real entregue
        res.on('finish', () => {
            const logLinha = `[${new Date().toISOString()}] [${req.method}] ${req.originalUrl} - Status: ${res.statusCode} - IP: ${req.ip}\n`;
            fs.appendFile(arquivoLog, logLinha, (erro) => {
                if (erro) console.error('Falha ao escrever log físico em disco:', erro.message);
            });
        });
    }

    next();
}
