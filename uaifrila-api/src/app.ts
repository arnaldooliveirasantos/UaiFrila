import express from 'express';
import cors from 'cors';
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
    const enderecoCtrl = new EnderecoController();
    const finCtrl = new AdminFinanceiroController();
    const authCtrl = new AuthController();
    const operacaoCtrl = new OperacaoController();
    const termoCtrl = new TermoController();
    const ssoCtrl = new SSOController();
    const transacaoCtrl = new TransacaoController();
    const expansaoCtrl = new ExpansaoController();

    this.expressApp.post('/api/usuarios/registrar', (req,res)=>authCtrl.registrar(req,res));
    // Compatibilidade - frontend novo chama /auth/cadastro e /auth/validar-codigo
    this.expressApp.post('/api/auth/cadastro', (req,res)=>authCtrl.registrar(req,res));
    this.expressApp.post('/api/auth/registrar', (req,res)=>authCtrl.registrar(req,res));
    this.expressApp.post('/api/auth/login', (req,res)=>authCtrl.login(req,res));
    this.expressApp.post('/api/auth/verificar-2fa', (req,res)=>authCtrl.verificarToken2FA(req,res));
    this.expressApp.post('/api/auth/verificar-email', (req,res)=>authCtrl.verificarTokenEmail(req,res));
    // Compatibilidade para ValidacaoCodigo.tsx que chama validar-codigo e reenviar-codigo
    this.expressApp.post('/api/auth/validar-codigo', (req,res)=>authCtrl.verificarTokenEmail(req,res));
    this.expressApp.post('/api/auth/verificar-codigo', (req,res)=>authCtrl.verificarTokenEmail(req,res));
    this.expressApp.post('/api/auth/reenviar-codigo', (req,res)=>authCtrl.reenviarCodigo(req,res));
    this.expressApp.post('/api/auth/reenviar', (req,res)=>authCtrl.reenviarCodigo(req,res));
    this.expressApp.get('/api/usuarios/me', authMiddleware, (req,res)=>authCtrl.buscarMe(req,res));
    this.expressApp.put('/api/usuarios/:id', authMiddleware, (req,res)=>authCtrl.atualizarUsuario(req,res));
    this.expressApp.get('/api/tipos-usuario', (req,res)=>authCtrl.listarTiposUsuario(req,res));
    this.expressApp.get('/api/termos/vigente/:tipoId', (req,res)=>termoCtrl.obterTermoVigente(req,res));
    this.expressApp.get('/health', (req,res)=>res.json({ status:'ok', version:'14.0 transacoes + expansao + super_admin uaifrila@gmail.com' }));
    this.expressApp.get('/', (req,res)=>res.json({ status:'UAI FRILA API v14.0 rodando - transacoes periodo + expansao cidades + super_admin' }));
    
    this.expressApp.post('/api/vagas/mural', authMiddleware, (req,res)=>muralCtrl.obterMural(req,res));
    this.expressApp.get('/api/vagas/mural', authMiddleware, (req,res)=>muralCtrl.obterMural(req,res));
    this.expressApp.post('/api/vagas/candidatar', authMiddleware, (req,res)=>operacaoCtrl.candidatar(req,res));
    this.expressApp.post('/api/vagas/aceitar', authMiddleware, (req,res)=>operacaoCtrl.aceitar(req,res));
    this.expressApp.post('/api/vagas/criar', authMiddleware, (req,res)=>vagaCtrl.criar(req,res));
    this.expressApp.get('/api/chat/historico/:vagaId', authMiddleware, (req,res)=>operacaoCtrl.historicoChat(req,res));
    this.expressApp.post('/api/admin/geografia', authMiddleware, (req,res)=>cidadeCtrl.listarGeografia(req,res));
    this.expressApp.put('/api/admin/cidade/:id', authMiddleware, (req,res)=>cidadeCtrl.atualizarStatus(req,res));
    this.expressApp.get('/api/cidades/ativas', (req,res)=>cidadeCtrl.listarAtivas(req,res));
    this.expressApp.get('/api/cidades/geografia', authMiddleware, (req,res)=>cidadeCtrl.listarGeografia(req,res));
    this.expressApp.post('/api/cidades/validar-endereco', (req,res)=>cidadeCtrl.validarEndereco(req,res));
    this.expressApp.get('/api/enderecos', authMiddleware, (req,res)=>enderecoCtrl.listar(req,res));
    this.expressApp.post('/api/enderecos', authMiddleware, (req,res)=>enderecoCtrl.criar(req,res));
    this.expressApp.put('/api/enderecos/:id', authMiddleware, (req,res)=>enderecoCtrl.atualizar(req,res));
    this.expressApp.put('/api/enderecos/:id/ativar', authMiddleware, (req,res)=>enderecoCtrl.ativar(req,res));
    this.expressApp.delete('/api/enderecos/:id', authMiddleware, (req,res)=>enderecoCtrl.deletar(req,res));
    this.expressApp.get('/api/enderecos/verificar-trampo', authMiddleware, (req,res)=>enderecoCtrl.verificarTrampo(req,res));
    this.expressApp.post('/api/admin/variaveis', authMiddleware, (req,res)=>finCtrl.obterVariaveis(req,res));
    this.expressApp.put('/api/admin/variaveis', authMiddleware, (req,res)=>finCtrl.salvarVariavel(req,res));
    this.expressApp.get('/api/admin/transacoes', authMiddleware, (req,res)=>finCtrl.relatorioTransacoes(req,res));

    // NOVO: Transacoes Periodo (item 2)
    this.expressApp.get('/api/transacoes', authMiddleware, (req,res)=>transacaoCtrl.relatorio(req,res));
    this.expressApp.get('/api/transacoes/estatisticas', authMiddleware, (req,res)=>transacaoCtrl.estatisticas(req,res));
    this.expressApp.get('/api/transacoes/variaveis', authMiddleware, (req,res)=>transacaoCtrl.variaveis(req,res));
    this.expressApp.put('/api/transacoes/variaveis', authMiddleware, (req,res)=>transacaoCtrl.salvarVariavel(req,res));
    this.expressApp.get('/api/admin/transacoes-periodo', authMiddleware, (req,res)=>transacaoCtrl.relatorio(req,res));

    // NOVO: Expansao Cidades (item 3)
    this.expressApp.get('/api/expansao', authMiddleware, (req,res)=>expansaoCtrl.listar(req,res));
    this.expressApp.get('/api/expansao/hierarquia', authMiddleware, (req,res)=>expansaoCtrl.hierarquia(req,res));
    this.expressApp.get('/api/expansao/bairros/:cidadeId', authMiddleware, (req,res)=>expansaoCtrl.bairros(req,res));
    this.expressApp.post('/api/expansao', authMiddleware, (req,res)=>expansaoCtrl.solicitar(req,res));
    this.expressApp.put('/api/expansao/:id/status', authMiddleware, (req,res)=>expansaoCtrl.atualizarStatus(req,res));
    this.expressApp.get('/api/expansao/estatisticas', authMiddleware, (req,res)=>expansaoCtrl.estatisticas(req,res));
    this.expressApp.get('/api/admin/expansao', authMiddleware, (req,res)=>expansaoCtrl.listar(req,res));
    this.expressApp.get('/api/cidades/hierarquia', authMiddleware, (req,res)=>expansaoCtrl.hierarquia(req,res));
  }
}
