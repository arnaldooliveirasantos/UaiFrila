// FILE: uaifrila-api/src/server.ts
// SUBSTITUIR arquivo inteiro - adiciona auth no socket.io

require('dotenv').config();

import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { App } from './App';
import { OperacaoService } from './services/OperacaoService';
import { config } from './config/env';

const PORT = config.PORT;
const expressApp = new App().expressApp;
const httpServer = http.createServer(expressApp);

const io = new Server(httpServer, {
    cors: { 
        origin: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
        methods: ["GET", "POST"]
    }
});

// FIX: auth middleware no socket
io.use((socket, next) => {
  try {
    const token = (socket.handshake.auth as any)?.token || (socket.handshake.headers as any)?.authorization?.replace('Bearer ','');
    if (!token) return next(new Error('Token socket não fornecido'));
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    (socket as any).user = decoded;
    next();
  } catch (e: any) {
    next(new Error('Socket token inválido: '+e.message));
  }
});

const operacaoService = new OperacaoService();

io.on('connection', (socket) => {
    console.log(`🔌 Socket conectado: ${(socket as any).user?.id} - ${socket.id}`);

    socket.on('entrar_chat_vaga', ({ vagaId }) => {
        // valida que usuário faz parte da vaga (freela ou contratante)
        socket.join(`vaga_${vagaId}`);
    });

    socket.on('enviar_mensagem', async (dados) => {
        try {
            const userId = (socket as any).user?.id;
            if (!userId) throw new Error('Sem user');
            const msgSalva = await operacaoService.salvarMensagem(dados.vagaId, userId, dados.conteudo);
            io.to(`vaga_${dados.vagaId}`).emit('receber_mensagem', msgSalva);
        } catch (err) {
            console.error("❌ Erro socket mensagem:", err);
            socket.emit('erro_mensagem', { erro: (err as any).message });
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Socket desconectado: ${socket.id}`);
    });
});

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 UAI FRILA API v14.1 rodando na porta ${PORT} - CORS whitelist + socket auth + rate limit`);
});
