"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerMiddleware = loggerMiddleware;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function loggerMiddleware(req, res, next) {
    const ambiente = process.env.NODE_ENV;
    const logsAtivos = process.env.LOGS_ATIVOS; // 'true' ou 'false' extraído do ambiente de forma pura
    // Se estiver em produção e os logs estiverem ativos, processa a escrita física de arquivos diários
    if (ambiente === 'production' && logsAtivos === 'true') {
        const pastaLogs = path_1.default.join(__dirname, '..', '..', 'logs');
        // Garante a existência da pasta de logs de forma síncrona estrutural
        if (!fs_1.default.existsSync(pastaLogs)) {
            fs_1.default.mkdirSync(pastaLogs, { recursive: true });
        }
        const dataAtual = new Date().toISOString().split('T')[0]; // Formato: YYYY-MM-DD
        const arquivoLog = path_1.default.join(pastaLogs, `${dataAtual}.log`);
        // Intercepta a finalização da resposta para computar o status code real entregue
        res.on('finish', () => {
            const logLinha = `[${new Date().toISOString()}] [${req.method}] ${req.originalUrl} - Status: ${res.statusCode} - IP: ${req.ip}\n`;
            fs_1.default.appendFile(arquivoLog, logLinha, (erro) => {
                if (erro)
                    console.error('Falha ao escrever log físico em disco:', erro.message);
            });
        });
    }
    next();
}
