import express from 'express';
import cors from 'cors';
import { MuralVagasController } from './controllers/MuralVagasController';
import { CidadeController } from './controllers/CidadeController';
import { AuthController } from './controllers/AuthController';
import { OperacaoController } from './controllers/OperacaoController';
import { TermoController } from './controllers/TermoController';

export class App {
    public expressApp: express.Application = express();

    constructor() {
        this.expressApp.use(express.json());
        this.configurarCors();
        this.configurarRotas();
    }

    private configurarCors() {
        const origens = (process.env.CORS_ALLOWED_ORIGINS || '').split(',');
        this.expressApp.use(cors({
            origin: (o, cb) => (!o || origens.indexOf(o) !== -1) ? cb(null, true) : cb(null, true), // Aberto para desenvolvimento local
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
    }

    private configurarRotas() {
        const muralCtrl = new MuralVagasController();
        const cidadeCtrl = new CidadeController();
        const authCtrl = new AuthController();
        const operacaoCtrl = new OperacaoController();
        const termoCtrl = new TermoController();

        // 🔐 Rotas Públicas (Encapsuladas com verificação para evitar falhas se o método não existir)
        this.expressApp.post('/api/usuarios/registrar', (req, res, next) => {
            if (typeof authCtrl.registrar === 'function') return authCtrl.registrar(req, res);
            res.status(501).json({ erro: "Método 'registrar' ainda não implementado na Controller." });
        });

        this.expressApp.post('/api/auth/login', (req, res, next) => {
            if (typeof authCtrl.login === 'function') return authCtrl.login(req, res);
            res.status(501).json({ erro: "Método 'login' ainda não implementado na Controller." });
        });

        this.expressApp.post('/api/auth/verificar-2fa', (req, res, next) => {
            // Mapeia de forma flexível aceitando tanto verificarTokenEmail quanto verificarToken2FA
            const métodoToken = authCtrl.verificarTokenEmail || (authCtrl as any).verificarToken2FA;
            if (typeof métodoToken === 'function') return métodoToken(req, res);
            res.status(501).json({ erro: "Método de verificação 2FA não localizado na Controller." });
        });

        // 🏃 Rotas Operacionais do Mural e Matches
        this.expressApp.post('/api/vagas/mural', (req, res, next) => {
            if (typeof muralCtrl.obterMural === 'function') return muralCtrl.obterMural(req, res);
            res.status(501).json({ erro: "Método 'obterMural' não localizado." });
        });

        this.expressApp.post('/api/vagas/candidatar', (req, res, next) => {
            if (typeof operacaoCtrl.candidatar === 'function') return operacaoCtrl.candidatar(req, res);
            res.status(501).json({ erro: "Método 'candidatar' não localizado." });
        });

        this.expressApp.post('/api/vagas/aceitar', (req, res, next) => {
            if (typeof operacaoCtrl.aceitar === 'function') return operacaoCtrl.aceitar(req, res);
            res.status(501).json({ erro: "Método 'aceitar' não localizado." });
        });
    }
}
