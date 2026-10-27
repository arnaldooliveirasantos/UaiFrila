import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { VagaController } from './controllers/VagaController';
import { MuralVagasController } from './controllers/MuralVagasController';
import { CidadeController } from './controllers/CidadeController';
import { EnderecoController } from './controllers/EnderecoController';
import { AdminFinanceiroController } from './controllers/AdminFinanceiroController';
import { AuthController } from './controllers/AuthController';
import { OperacaoController } from './controllers/OperacaoController';
import { TermoController } from './controllers/TermoController';
import { SSOController } from './controllers/SSOController';
import { TransacaoController } from './controllers/TransacaoController';
import { ExpansaoController } from './controllers/ExpansaoController';
import { authMiddleware, isAdminMiddleware } from './middlewares/AuthMiddleware';
import { loggerMiddleware } from './middlewares/LoggerMiddleware';

export class App {
  public expressApp: express.Application = express();
  constructor(){
    this.expressApp.use(express.json({ limit: '10mb' }));
    this.expressApp.use(express.urlencoded({ extended: true }));
    this.expressApp.use(loggerMiddleware);
    
    // FIX CORS: libera localhost + 192.168.* + 10.* + domínios configurados
    const envOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s=>s.trim()).filter(Boolean);
    
    this.expressApp.use(cors({ 
      origin: (origin, cb) => {
        // Permite requisições sem origin (mobile, curl, postman)
        if (!origin) return cb(null, true);
        
        // Libera se está na lista env
        if (envOrigins.includes('*') || envOrigins.includes(origin)) {
          return cb(null, true);
        }
        
        // Libera localhost em qualquer porta
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return cb(null, true);
        }
        
        // FIX PRINCIPAL: libera IP de rede local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
        if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
          return cb(null, true);
        }
        
        // Libera domínios do projeto
        if (origin.includes('uaifrila.com.br') || origin.includes('vercel.app') || origin.includes('fly.dev')) {
          return cb(null, true);
        }
        
        console.warn(`⚠️ CORS bloqueado para origin: ${origin} - Adicione em CORS_ORIGINS se for legítimo`);
        cb(null, true); // Em dev, libera mesmo se não listou pra não travar - em prod, troque para cb(new Error...)
      },
      methods: ['GET','POST','PUT','DELETE','OPTIONS'], 
      allowedHeaders: ['Content-Type','Authorization'],
      credentials: true
    }));

    this.configurarRotas();
    this.expressApp.use((err:any, req:any, res:any, next:any) => {
      console.error('🔥 UNHANDLED ERROR:', err);
      res.status(500).json({ erro: err.message });
    });
  }

  private configurarRotas(){
    const vagaCtrl = new VagaController();
    const muralCtrl = new MuralVagasController();
    const cidadeCtrl = new CidadeController();
    const enderecoCtrl = new EnderecoController();
    const finCtrl = new AdminFinanceiroController();
    const authCtrl = new AuthController();
    const operacaoCtrl = new OperacaoController();
    const termoCtrl = new TermoController();
    const ssoCtrl = new SSOController();
    const transacaoCtrl = new TransacaoController();
    const expansaoCtrl = new ExpansaoController();

    const loginLimiter = rateLimit({ windowMs: 15*60*1000, max: 20, message: { erro: 'Muitas tentativas, aguarde 15 min' } });
    const codigoLimiter = rateLimit({ windowMs: 5*60*1000, max: 10, message: { erro: 'Muitas tentativas de código' } });

    this.expressApp.post('/api/usuarios/registrar', (req,res)=>authCtrl.registrar(req,res));
    this.expressApp.post('/api/auth/cadastro', (req,res)=>authCtrl.registrar(req,res));
    this.expressApp.post('/api/auth/registrar', (req,res)=>authCtrl.registrar(req,res));
    this.expressApp.post('/api/auth/login', loginLimiter, (req,res)=>authCtrl.login(req,res));
    this.expressApp.post('/api/auth/verificar-2fa', codigoLimiter, (req,res)=>authCtrl.verificarToken2FA(req,res));
    this.expressApp.post('/api/auth/verificar-email', codigoLimiter, (req,res)=>authCtrl.verificarTokenEmail(req,res));
    this.expressApp.post('/api/auth/validar-codigo', codigoLimiter, (req,res)=>authCtrl.verificarTokenEmail(req,res));
    this.expressApp.post('/api/auth/verificar-codigo', codigoLimiter, (req,res)=>authCtrl.verificarTokenEmail(req,res));
    this.expressApp.post('/api/auth/reenviar-codigo', loginLimiter, (req,res)=>authCtrl.reenviarCodigo(req,res));
    this.expressApp.post('/api/auth/reenviar', loginLimiter, (req,res)=>authCtrl.reenviarCodigo(req,res));
    this.expressApp.get('/api/usuarios/me', authMiddleware, (req,res)=>authCtrl.buscarMe(req,res));
    this.expressApp.put('/api/usuarios/:id', authMiddleware, (req,res)=>authCtrl.atualizarUsuario(req,res));
    this.expressApp.get('/api/tipos-usuario', (req,res)=>authCtrl.listarTiposUsuario(req,res));
    this.expressApp.get('/api/termos/vigente/:tipoId', (req,res)=>termoCtrl.obterTermoVigente(req,res));
    this.expressApp.get('/health', (req,res)=>res.json({ status:'ok', version:'14.2 cors fix rede local' }));
    this.expressApp.get('/', (req,res)=>res.json({ status:'UAI FRILA API v14.2 - CORS liberado para rede local' }));
    
    this.expressApp.post('/api/vagas/mural', authMiddleware, (req,res)=>muralCtrl.obterMural(req,res));
    this.expressApp.get('/api/vagas/mural', authMiddleware, (req,res)=>muralCtrl.obterMural(req,res));
    this.expressApp.post('/api/vagas/candidatar', authMiddleware, (req,res)=>operacaoCtrl.candidatar(req,res));
    this.expressApp.post('/api/vagas/aceitar', authMiddleware, (req,res)=>operacaoCtrl.aceitar(req,res));
    this.expressApp.post('/api/vagas/criar', authMiddleware, (req,res)=>vagaCtrl.criar(req,res));
    this.expressApp.get('/api/chat/historico/:vagaId', authMiddleware, (req,res)=>operacaoCtrl.historicoChat(req,res));
    this.expressApp.post('/api/admin/geografia', authMiddleware, isAdminMiddleware, (req,res)=>cidadeCtrl.listarGeografia(req,res));
    this.expressApp.put('/api/admin/cidade/:id', authMiddleware, isAdminMiddleware, (req,res)=>cidadeCtrl.atualizarStatus(req,res));
    this.expressApp.get('/api/cidades/ativas', (req,res)=>cidadeCtrl.listarAtivas(req,res));
    this.expressApp.get('/api/cidades/geografia', authMiddleware, (req,res)=>cidadeCtrl.listarGeografia(req,res));
    this.expressApp.post('/api/cidades/validar-endereco', (req,res)=>cidadeCtrl.validarEndereco(req,res));
    this.expressApp.get('/api/enderecos', authMiddleware, (req,res)=>enderecoCtrl.listar(req,res));
    this.expressApp.post('/api/enderecos', authMiddleware, (req,res)=>enderecoCtrl.criar(req,res));
    this.expressApp.put('/api/enderecos/:id', authMiddleware, (req,res)=>enderecoCtrl.atualizar(req,res));
    this.expressApp.put('/api/enderecos/:id/ativar', authMiddleware, (req,res)=>enderecoCtrl.ativar(req,res));
    this.expressApp.delete('/api/enderecos/:id', authMiddleware, (req,res)=>enderecoCtrl.deletar(req,res));
    this.expressApp.get('/api/enderecos/verificar-trampo', authMiddleware, (req,res)=>enderecoCtrl.verificarTrampo(req,res));
    this.expressApp.post('/api/admin/variaveis', authMiddleware, isAdminMiddleware, (req,res)=>finCtrl.obterVariaveis(req,res));
    this.expressApp.put('/api/admin/variaveis', authMiddleware, isAdminMiddleware, (req,res)=>finCtrl.salvarVariavel(req,res));
    this.expressApp.get('/api/admin/transacoes', authMiddleware, isAdminMiddleware, (req,res)=>finCtrl.relatorioTransacoes(req,res));
    this.expressApp.get('/api/transacoes', authMiddleware, isAdminMiddleware, (req,res)=>transacaoCtrl.relatorio(req,res));
    this.expressApp.get('/api/transacoes/estatisticas', authMiddleware, isAdminMiddleware, (req,res)=>transacaoCtrl.estatisticas(req,res));
    this.expressApp.get('/api/transacoes/variaveis', authMiddleware, isAdminMiddleware, (req,res)=>transacaoCtrl.variaveis(req,res));
    this.expressApp.put('/api/transacoes/variaveis', authMiddleware, isAdminMiddleware, (req,res)=>transacaoCtrl.salvarVariavel(req,res));
    this.expressApp.get('/api/admin/transacoes-periodo', authMiddleware, isAdminMiddleware, (req,res)=>transacaoCtrl.relatorio(req,res));
    this.expressApp.get('/api/expansao', authMiddleware, isAdminMiddleware, (req,res)=>expansaoCtrl.listar(req,res));
    this.expressApp.get('/api/expansao/hierarquia', authMiddleware, (req,res)=>expansaoCtrl.hierarquia(req,res));
    this.expressApp.get('/api/expansao/bairros/:cidadeId', authMiddleware, (req,res)=>expansaoCtrl.bairros(req,res));
    this.expressApp.post('/api/expansao', authMiddleware, (req,res)=>expansaoCtrl.solicitar(req,res));
    this.expressApp.put('/api/expansao/:id/status', authMiddleware, isAdminMiddleware, (req,res)=>expansaoCtrl.atualizarStatus(req,res));
    this.expressApp.get('/api/expansao/estatisticas', authMiddleware, isAdminMiddleware, (req,res)=>expansaoCtrl.estatisticas(req,res));
    this.expressApp.get('/api/admin/expansao', authMiddleware, isAdminMiddleware, (req,res)=>expansaoCtrl.listar(req,res));
    this.expressApp.get('/api/cidades/hierarquia', authMiddleware, (req,res)=>expansaoCtrl.hierarquia(req,res));
  }
}
