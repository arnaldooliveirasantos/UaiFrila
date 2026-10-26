"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// FORÇA O CARREGAMENTO IMEDIATO DAS VARIÁVEIS ANTES DOS IMPORTS ESTÁTICOS
require('dotenv').config();
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = require("./app");
const OperacaoService_1 = require("./services/OperacaoService");
const env_1 = require("./config/env");
const PORT = env_1.config.PORT;
const expressApp = new app_1.App().expressApp;
const httpServer = http_1.default.createServer(expressApp);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const operacaoService = new OperacaoService_1.OperacaoService();
io.on('connection', (socket) => {
    socket.on('entrar_chat_vaga', ({ vagaId }) => {
        socket.join(`vaga_${vagaId}`);
    });
    socket.on('enviar_mensagem', async (dados) => {
        try {
            const msgSalva = await operacaoService.salvarMensagem(dados.vagaId, dados.remetenteId, dados.conteudo);
            io.to(`vaga_${dados.vagaId}`).emit('receber_mensagem', msgSalva);
        }
        catch (err) {
            console.error("❌ Erro ao transmitir mensagem via WebSocket:", err);
        }
    });
});
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor HTTP e WebSockets UAI FRILA rodando na porta ${PORT} - SEM FALLBACK, .env obrigatório`);
});
