"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const VagaController_1 = require("./controllers/VagaController");
const MuralVagasController_1 = require("./controllers/MuralVagasController");
const CidadeController_1 = require("./controllers/CidadeController");
const EnderecoController_1 = require("./controllers/EnderecoController");
const AdminFinanceiroController_1 = require("./controllers/AdminFinanceiroController");
const AuthController_1 = require("./controllers/AuthController");
const OperacaoController_1 = require("./controllers/OperacaoController");
const TermoController_1 = require("./controllers/TermoController");
const SSOController_1 = require("./controllers/SSOController");
const TransacaoController_1 = require("./controllers/TransacaoController");
const ExpansaoController_1 = require("./controllers/ExpansaoController");
const AuthMiddleware_1 = require("./middlewares/AuthMiddleware");
const LoggerMiddleware_1 = require("./middlewares/LoggerMiddleware");
class App {
    expressApp = (0, express_1.default)();
    constructor() {
        this.expressApp.use(express_1.default.json({ limit: '10mb' }));
        this.expressApp.use(express_1.default.urlencoded({ extended: true }));
        this.expressApp.use(LoggerMiddleware_1.loggerMiddleware);
        this.expressApp.use((0, cors_1.default)({
            origin: (origin, callback) => { callback(null, true); },
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true
        }));
        this.configurarRotas();
        this.expressApp.use((err, req, res, next) => {
            console.error('🔥 UNHANDLED ERROR:', err);
            res.status(500).json({ erro: err.message, stack: err.stack?.substring(0, 500) });
        });
    }
    configurarRotas() {
        const vagaCtrl = new VagaController_1.VagaController();
        const muralCtrl = new MuralVagasController_1.MuralVagasController();
        const cidadeCtrl = new CidadeController_1.CidadeController();
        const enderecoCtrl = new EnderecoController_1.EnderecoController();
        const finCtrl = new AdminFinanceiroController_1.AdminFinanceiroController();
        const authCtrl = new AuthController_1.AuthController();
        const operacaoCtrl = new OperacaoController_1.OperacaoController();
        const termoCtrl = new TermoController_1.TermoController();
        const ssoCtrl = new SSOController_1.SSOController();
        const transacaoCtrl = new TransacaoController_1.TransacaoController();
        const expansaoCtrl = new ExpansaoController_1.ExpansaoController();
        this.expressApp.post('/api/usuarios/registrar', (req, res) => authCtrl.registrar(req, res));
        // Compatibilidade - frontend novo chama /auth/cadastro e /auth/validar-codigo
        this.expressApp.post('/api/auth/cadastro', (req, res) => authCtrl.registrar(req, res));
        this.expressApp.post('/api/auth/registrar', (req, res) => authCtrl.registrar(req, res));
        this.expressApp.post('/api/auth/login', (req, res) => authCtrl.login(req, res));
        this.expressApp.post('/api/auth/verificar-2fa', (req, res) => authCtrl.verificarToken2FA(req, res));
        this.expressApp.post('/api/auth/verificar-email', (req, res) => authCtrl.verificarTokenEmail(req, res));
        // Compatibilidade para ValidacaoCodigo.tsx que chama validar-codigo e reenviar-codigo
        this.expressApp.post('/api/auth/validar-codigo', (req, res) => authCtrl.verificarTokenEmail(req, res));
        this.expressApp.post('/api/auth/verificar-codigo', (req, res) => authCtrl.verificarTokenEmail(req, res));
        this.expressApp.post('/api/auth/reenviar-codigo', (req, res) => authCtrl.reenviarCodigo(req, res));
        this.expressApp.post('/api/auth/reenviar', (req, res) => authCtrl.reenviarCodigo(req, res));
        this.expressApp.get('/api/usuarios/me', AuthMiddleware_1.authMiddleware, (req, res) => authCtrl.buscarMe(req, res));
        this.expressApp.put('/api/usuarios/:id', AuthMiddleware_1.authMiddleware, (req, res) => authCtrl.atualizarUsuario(req, res));
        this.expressApp.get('/api/tipos-usuario', (req, res) => authCtrl.listarTiposUsuario(req, res));
        this.expressApp.get('/api/termos/vigente/:tipoId', (req, res) => termoCtrl.obterTermoVigente(req, res));
        this.expressApp.get('/health', (req, res) => res.json({ status: 'ok', version: '14.0 transacoes + expansao + super_admin uaifrila@gmail.com' }));
        this.expressApp.get('/', (req, res) => res.json({ status: 'UAI FRILA API v14.0 rodando - transacoes periodo + expansao cidades + super_admin' }));
        this.expressApp.post('/api/vagas/mural', AuthMiddleware_1.authMiddleware, (req, res) => muralCtrl.obterMural(req, res));
        this.expressApp.get('/api/vagas/mural', AuthMiddleware_1.authMiddleware, (req, res) => muralCtrl.obterMural(req, res));
        this.expressApp.post('/api/vagas/candidatar', AuthMiddleware_1.authMiddleware, (req, res) => operacaoCtrl.candidatar(req, res));
        this.expressApp.post('/api/vagas/aceitar', AuthMiddleware_1.authMiddleware, (req, res) => operacaoCtrl.aceitar(req, res));
        this.expressApp.post('/api/vagas/criar', AuthMiddleware_1.authMiddleware, (req, res) => vagaCtrl.criar(req, res));
        this.expressApp.get('/api/chat/historico/:vagaId', AuthMiddleware_1.authMiddleware, (req, res) => operacaoCtrl.historicoChat(req, res));
        this.expressApp.post('/api/admin/geografia', AuthMiddleware_1.authMiddleware, (req, res) => cidadeCtrl.listarGeografia(req, res));
        this.expressApp.put('/api/admin/cidade/:id', AuthMiddleware_1.authMiddleware, (req, res) => cidadeCtrl.atualizarStatus(req, res));
        this.expressApp.get('/api/cidades/ativas', (req, res) => cidadeCtrl.listarAtivas(req, res));
        this.expressApp.get('/api/cidades/geografia', AuthMiddleware_1.authMiddleware, (req, res) => cidadeCtrl.listarGeografia(req, res));
        this.expressApp.post('/api/cidades/validar-endereco', (req, res) => cidadeCtrl.validarEndereco(req, res));
        this.expressApp.get('/api/enderecos', AuthMiddleware_1.authMiddleware, (req, res) => enderecoCtrl.listar(req, res));
        this.expressApp.post('/api/enderecos', AuthMiddleware_1.authMiddleware, (req, res) => enderecoCtrl.criar(req, res));
        this.expressApp.put('/api/enderecos/:id', AuthMiddleware_1.authMiddleware, (req, res) => enderecoCtrl.atualizar(req, res));
        this.expressApp.put('/api/enderecos/:id/ativar', AuthMiddleware_1.authMiddleware, (req, res) => enderecoCtrl.ativar(req, res));
        this.expressApp.delete('/api/enderecos/:id', AuthMiddleware_1.authMiddleware, (req, res) => enderecoCtrl.deletar(req, res));
        this.expressApp.get('/api/enderecos/verificar-trampo', AuthMiddleware_1.authMiddleware, (req, res) => enderecoCtrl.verificarTrampo(req, res));
        this.expressApp.post('/api/admin/variaveis', AuthMiddleware_1.authMiddleware, (req, res) => finCtrl.obterVariaveis(req, res));
        this.expressApp.put('/api/admin/variaveis', AuthMiddleware_1.authMiddleware, (req, res) => finCtrl.salvarVariavel(req, res));
        this.expressApp.get('/api/admin/transacoes', AuthMiddleware_1.authMiddleware, (req, res) => finCtrl.relatorioTransacoes(req, res));
        // NOVO: Transacoes Periodo (item 2)
        this.expressApp.get('/api/transacoes', AuthMiddleware_1.authMiddleware, (req, res) => transacaoCtrl.relatorio(req, res));
        this.expressApp.get('/api/transacoes/estatisticas', AuthMiddleware_1.authMiddleware, (req, res) => transacaoCtrl.estatisticas(req, res));
        this.expressApp.get('/api/transacoes/variaveis', AuthMiddleware_1.authMiddleware, (req, res) => transacaoCtrl.variaveis(req, res));
        this.expressApp.put('/api/transacoes/variaveis', AuthMiddleware_1.authMiddleware, (req, res) => transacaoCtrl.salvarVariavel(req, res));
        this.expressApp.get('/api/admin/transacoes-periodo', AuthMiddleware_1.authMiddleware, (req, res) => transacaoCtrl.relatorio(req, res));
        // NOVO: Expansao Cidades (item 3)
        this.expressApp.get('/api/expansao', AuthMiddleware_1.authMiddleware, (req, res) => expansaoCtrl.listar(req, res));
        this.expressApp.get('/api/expansao/hierarquia', AuthMiddleware_1.authMiddleware, (req, res) => expansaoCtrl.hierarquia(req, res));
        this.expressApp.get('/api/expansao/bairros/:cidadeId', AuthMiddleware_1.authMiddleware, (req, res) => expansaoCtrl.bairros(req, res));
        this.expressApp.post('/api/expansao', AuthMiddleware_1.authMiddleware, (req, res) => expansaoCtrl.solicitar(req, res));
        this.expressApp.put('/api/expansao/:id/status', AuthMiddleware_1.authMiddleware, (req, res) => expansaoCtrl.atualizarStatus(req, res));
        this.expressApp.get('/api/expansao/estatisticas', AuthMiddleware_1.authMiddleware, (req, res) => expansaoCtrl.estatisticas(req, res));
        this.expressApp.get('/api/admin/expansao', AuthMiddleware_1.authMiddleware, (req, res) => expansaoCtrl.listar(req, res));
        this.expressApp.get('/api/cidades/hierarquia', AuthMiddleware_1.authMiddleware, (req, res) => expansaoCtrl.hierarquia(req, res));
    }
}
exports.App = App;
