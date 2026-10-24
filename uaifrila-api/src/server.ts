import http from 'http';
import { Server } from 'socket.io';
import { App } from './app';
import { OperacaoService } from './services/OperacaoService';

const PORT = 3000;
const expressApp = new App().expressApp;
const httpServer = http.createServer(expressApp);
const io = new Server(httpServer, { cors: { origin: "*", methods: ["GET", "POST"] } });
const operacaoService = new OperacaoService();

io.on('connection', (socket) => {
    socket.on('entrar_chat_vaga', ({ vagaId }) => { socket.join(`vaga_${vagaId}`); });
    socket.on('enviar_mensagem', async (dados) => {
        try {
            const msgSalva = await operacaoService.salvarMensagem(dados.vagaId, dados.remetenteId, dados.conteudo);
            io.to(`vaga_${dados.vagaId}`).emit('receber_mensagem', msgSalva);
        } catch (err) { console.error(err); }
    });
});

httpServer.listen(PORT, '0.0.0.0', () => { console.log(`🚀 API escutando em 0.0.0.0:${PORT}`); });
