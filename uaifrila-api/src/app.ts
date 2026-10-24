import express from 'express';
import cors from 'cors';
import { VagaController } from './controllers/VagaController';
import { CidadeController } from './controllers/CidadeController';
import { AdminFinanceiroController } from './controllers/AdminFinanceiroController';
import { AuthController } from './controllers/AuthController';
import { OperacaoController } from './controllers/OperacaoController';
import { TermoController } from './controllers/TermoController';
import { authMiddleware } from './middlewares/AuthMiddleware';

export class App {
    public expressApp: express.Application = express();

    constructor() {
        this.expressApp.use(express.json());
        this.configurarCorsEstrito();
        this.configurarRotas();
    }

    private configurarCorsEstrito() {
        const origensConfiguradas = process.env.CORS_ALLOWED_ORIGINS;
        const listaOrigens = origensConfiguradas.split(',');

        this.expressApp.use(cors({
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (listaOrigens.indexOf(origin) !== -1) {
                    callback(null, true);
                } else {
                    callback(new Error('Bloqueado por restrição estrita de ambiente CORS'));
                }
            },
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
        }));
    }

    private configurarRotas() {
        const vagaCtrl = new VagaController();
        const cidadeCtrl = new CidadeController();
        const finCtrl = new AdminFinanceiroController();
        const authCtrl = new AuthController();
        const operacaoCtrl = new OperacaoController();
        const termoCtrl = new TermoController();

        // 🔐 Rotas Públicas (Livres de token para registro e validação de credenciais)
        this.expressApp.post('/api/usuarios/registrar', (req, res) => authCtrl.registrar(req, res));
        this.expressApp.post('/api/auth/login', (req, res) => authCtrl.login(req, res));
        this.expressApp.post('/api/auth/verificar-2fa', (req, res) => authCtrl.verificarToken2FA(req, res));
        this.expressApp.get('/api/termos/vigente/:tipoId', (req, res) => termoCtrl.obterTermoVigente(req, res));

        // 🏃 Rotas do Mural e Candidaturas Protegidas
        this.expressApp.post('/api/vagas/mural', authMiddleware, (req, res) => vagaCtrl.listarMural(req, res));
        this.expressApp.post('/api/vagas/candidatar', authMiddleware, (req, res) => operacaoCtrl.candidatar(req, res));
        this.expressApp.post('/api/vagas/aceitar', authMiddleware, (req, res) => operacaoCtrl.aceitar(req, res));
        this.expressApp.get('/api/chat/historico/:vagaId', authMiddleware, (req, res) => operacaoCtrl.historicoChat(req, res));

        // ⚙️ Rotas Administrativas de Controle
        this.expressApp.post('/api/admin/geografia', authMiddleware, (req, res) => cidadeCtrl.listarGeografia(req, res));
        this.expressApp.put('/api/admin/cidade/:id', authMiddleware, (req, res) => cidadeCtrl.atualizarStatus(req, res));
        this.expressApp.post('/api/admin/variaveis', authMiddleware, (req, res) => finCtrl.obterVariaveis(req, res));
        this.expressApp.put('/api/admin/variaveis', authMiddleware, (req, res) => finCtrl.salvarVariavel(req, res));
        this.expressApp.get('/api/admin/transacoes', authMiddleware, (req, res) => finCtrl.relatorioTransacoes(req, res));
        this.expressApp.post('/api/admin/termos/salvar', authMiddleware, (req, res) => termoCtrl.salvarNovaVersaoTermo(req, res));
    }
}
