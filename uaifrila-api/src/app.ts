import express from 'express';
import cors from 'cors';
import { VagaController } from './controllers/VagaController';
import { MuralVagasController } from './controllers/MuralVagasController';
import { CidadeController } from './controllers/CidadeController';
import { AdminFinanceiroController } from './controllers/AdminFinanceiroController';
import { AuthController } from './controllers/AuthController';
import { OperacaoController } from './controllers/OperacaoController';
import { TermoController } from './controllers/TermoController';
import { SSOController } from './controllers/SSOController';
import { authMiddleware } from './middlewares/AuthMiddleware';
import { loggerMiddleware } from './middlewares/LoggerMiddleware';

export class App {
  public expressApp: express.Application = express();
  constructor(){
    this.expressApp.use(express.json({ limit: '10mb' }));
    this.expressApp.use(express.urlencoded({ extended: true }));
    this.expressApp.use(loggerMiddleware);
    this.expressApp.use(cors({ 
      origin: (origin, callback) => { callback(null, true); },
      methods: ['GET','POST','PUT','DELETE','OPTIONS'], 
      allowedHeaders: ['Content-Type','Authorization'],
      credentials: true
    }));
    this.configurarRotas();
    this.expressApp.use((err:any, req:any, res:any, next:any) => {
      console.error('🔥 UNHANDLED ERROR:', err);
      res.status(500).json({ erro: err.message, stack: err.stack?.substring(0,500) });
    });
  }
  private configurarRotas(){
    const vagaCtrl = new VagaController();
    const muralCtrl = new MuralVagasController();
    const cidadeCtrl = new CidadeController();
    const finCtrl = new AdminFinanceiroController();
    const authCtrl = new AuthController();
    const operacaoCtrl = new OperacaoController();
    const termoCtrl = new TermoController();
    const ssoCtrl = new SSOController();

    this.expressApp.post('/api/usuarios/registrar', (req,res)=>authCtrl.registrar(req,res));
    this.expressApp.post('/api/auth/login', (req,res)=>authCtrl.login(req,res));
    this.expressApp.post('/api/auth/verificar-2fa', (req,res)=>authCtrl.verificarToken2FA(req,res));
    this.expressApp.post('/api/auth/verificar-email', (req,res)=>authCtrl.verificarTokenEmail(req,res));
    this.expressApp.get('/api/termos/vigente/:tipoId', (req,res)=>termoCtrl.obterTermoVigente(req,res));
    this.expressApp.get('/health', (req,res)=>res.json({ status:'ok', version:'13.5 fix 500 sem whatsapp' }));
    this.expressApp.get('/', (req,res)=>res.json({ status:'UAI FRILA API v13.5 rodando - apenas e-mail' }));
    
    this.expressApp.post('/api/vagas/mural', authMiddleware, (req,res)=>muralCtrl.obterMural(req,res));
    this.expressApp.post('/api/vagas/candidatar', authMiddleware, (req,res)=>operacaoCtrl.candidatar(req,res));
    this.expressApp.post('/api/vagas/aceitar', authMiddleware, (req,res)=>operacaoCtrl.aceitar(req,res));
    this.expressApp.post('/api/vagas/criar', authMiddleware, (req,res)=>vagaCtrl.criar(req,res));
    this.expressApp.get('/api/chat/historico/:vagaId', authMiddleware, (req,res)=>operacaoCtrl.historicoChat(req,res));
    this.expressApp.post('/api/admin/geografia', authMiddleware, (req,res)=>cidadeCtrl.listarGeografia(req,res));
    this.expressApp.put('/api/admin/cidade/:id', authMiddleware, (req,res)=>cidadeCtrl.atualizarStatus(req,res));
    this.expressApp.post('/api/admin/variaveis', authMiddleware, (req,res)=>finCtrl.obterVariaveis(req,res));
    this.expressApp.put('/api/admin/variaveis', authMiddleware, (req,res)=>finCtrl.salvarVariavel(req,res));
    this.expressApp.get('/api/admin/transacoes', authMiddleware, (req,res)=>finCtrl.relatorioTransacoes(req,res));
  }
}