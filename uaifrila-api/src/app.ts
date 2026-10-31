import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';

import { VagaController } from './controllers/VagaController';
import { AuthController } from './controllers/AuthController';
import { CandidaturaController } from './controllers/CandidaturaController';
import { MuralVagasController } from './controllers/MuralVagasController';
import { TransacaoController } from './controllers/TransacaoController';
import { ExpansaoController } from './controllers/ExpansaoController';
import { CidadeController } from './controllers/CidadeController';
import { VariaveisController } from './controllers/VariaveisController';
import { EnderecoVagaController } from './controllers/EnderecoVagaController';
import { TiposUsuarioController } from './controllers/TiposUsuarioController';

import { AuthMiddleware } from './middlewares/AuthMiddleware';
import { BaseRepository } from './repositories/BaseRepository';

let pool: Pool | null = null;

export class App {
  public expressApp: express.Application;
  constructor() {
    this.expressApp = express();
    this.configurarMiddleware();
    this.configurarBanco();
    this.configurarRotas();
  }

  private configurarMiddleware() {
    this.expressApp.use(cors({ origin: true, credentials: true, methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'], allowedHeaders: ['Content-Type','Authorization'] }));
    const limiter = rateLimit({ windowMs: 60*1000, max: 200 });
    const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 50 });
    this.expressApp.use('/api/', limiter);
    this.expressApp.use('/api/auth/', authLimiter);
    this.expressApp.use(express.json({ limit: '2mb' }));
  }

  private configurarBanco() {
    const conn = process.env.DATABASE_URL;
    if (conn) pool = new Pool({ connectionString: conn });
    else pool = new Pool({ user: process.env.DB_USER||'postgres', password: process.env.DB_PASSWORD||'postgres', host: process.env.DB_HOST||'localhost', port: parseInt(process.env.DB_PORT||'5432'), database: process.env.DB_NAME||'uaifrila' });
    if (pool) pool.on('connect', (c:any)=>{ c.query("SET TIME ZONE 'UTC'"); });
    BaseRepository.setPool(pool as any);
  }

  private configurarRotas() {
    const auth = AuthMiddleware.verificar;
    const vagaCtrl = new VagaController();
    const authCtrl = new AuthController();
    const candCtrl = new CandidaturaController();
    const muralCtrl = new MuralVagasController();
    const transacaoCtrl = new TransacaoController();
    const expansaoCtrl = new ExpansaoController();
    const cidadeCtrl = new CidadeController();
    const variaveisCtrl = new VariaveisController();
    const enderecoVagaCtrl = new EnderecoVagaController();
    const tiposUsuarioCtrl = new TiposUsuarioController();

    this.expressApp.get('/api/health', (req,res)=>res.json({ status:'ok', version:'20-FIXED-ALL', time:new Date().toISOString() }));

    this.expressApp.post('/api/auth/cadastro', (req,res)=>authCtrl.cadastro(req,res));
    this.expressApp.post('/api/auth/cadastrar', (req,res)=>authCtrl.cadastro(req,res));
    this.expressApp.post('/api/auth/login', (req,res)=>authCtrl.login(req,res));
    this.expressApp.post('/api/auth/login-com-senha', (req,res)=>authCtrl.loginComSenha(req,res));
    this.expressApp.post('/api/auth/codigo', (req,res)=>authCtrl.validarCodigo(req,res));
    this.expressApp.post('/api/auth/validar-codigo', (req,res)=>authCtrl.validarCodigo(req,res));
    this.expressApp.post('/api/auth/reenviar-codigo', (req,res)=>authCtrl.reenviarCodigo(req,res));
    this.expressApp.post('/api/auth/cancelar-cadastro', (req,res)=>authCtrl.cancelarCadastro(req,res));

    this.expressApp.get('/api/cidades', (req,res)=>cidadeCtrl.listar(req,res));
    this.expressApp.get('/api/cidades/ativas', (req,res)=>cidadeCtrl.listar(req,res));
    this.expressApp.get('/api/cidades/listar', (req,res)=>cidadeCtrl.listar(req,res));
    this.expressApp.get('/api/variaveis', (req,res)=>variaveisCtrl.listar(req,res));

    // Usuários - aliases para compatibilidade com frontend antigo
    this.expressApp.get('/api/usuarios/me', auth, (req,res)=>authCtrl.me ? authCtrl.me(req,res) : res.json({ usuario: (req as any).usuario }));
    this.expressApp.post('/api/usuarios/atualizar', auth, (req,res)=>authCtrl.atualizarPerfil ? authCtrl.atualizarPerfil(req,res) : authCtrl.cadastro(req,res));
    this.expressApp.put('/api/usuarios/atualizar', auth, (req,res)=>authCtrl.atualizarPerfil ? authCtrl.atualizarPerfil(req,res) : authCtrl.cadastro(req,res));
    this.expressApp.post('/api/usuarios/me', auth, (req,res)=>authCtrl.me ? authCtrl.me(req,res) : res.json({ usuario: (req as any).usuario }));


    this.expressApp.get('/api/tipos-usuario', (req,res)=>tiposUsuarioCtrl.listar(req,res));
    this.expressApp.get('/api/tipos-usuario/:id', (req,res)=>tiposUsuarioCtrl.buscarPorId(req,res));
    this.expressApp.get('/api/tipos-usuario/chave/:chave', (req,res)=>tiposUsuarioCtrl.buscarPorChave(req,res));

    this.expressApp.get('/api/vagas/mural', auth, (req,res)=>muralCtrl.obterMural(req,res));
    this.expressApp.post('/api/vagas/mural', auth, (req,res)=>muralCtrl.obterMural(req,res));
    this.expressApp.post('/api/vagas/criar', auth, (req,res)=>vagaCtrl.criar(req,res));
    this.expressApp.post('/api/vagas', auth, (req,res)=>vagaCtrl.criar(req,res));
    this.expressApp.get('/api/vagas/minhas', auth, (req,res)=>vagaCtrl.minhasPublicadas(req,res));
    this.expressApp.get('/api/vagas/minhas-publicadas', auth, (req,res)=>vagaCtrl.minhasPublicadas(req,res));
    this.expressApp.get('/api/vagas/contratante', auth, (req,res)=>vagaCtrl.listarPorContratante(req,res));
    this.expressApp.get('/api/vagas/:id', auth, (req,res)=>vagaCtrl.buscarPorId(req,res));
    this.expressApp.put('/api/vagas/:id', auth, (req,res)=>vagaCtrl.atualizar(req,res));
    this.expressApp.patch('/api/vagas/:id', auth, (req,res)=>vagaCtrl.atualizar(req,res));
    this.expressApp.delete('/api/vagas/:id', auth, (req,res)=>vagaCtrl.cancelar(req,res));

    this.expressApp.post('/api/endereco-vaga', auth, (req,res)=>enderecoVagaCtrl.criar(req,res));

    this.expressApp.post('/api/vagas/candidatar', auth, (req,res)=>candCtrl.candidatar(req,res));
    this.expressApp.get('/api/candidaturas/minhas', auth, (req,res)=>candCtrl.listarMinhas(req,res));
    this.expressApp.get('/api/vagas/:id/candidaturas', auth, (req,res)=>candCtrl.listarPorVaga(req,res));
    this.expressApp.post('/api/vagas/:id/aceitar/:candidaturaId', auth, (req,res)=>candCtrl.aceitar(req,res));

    this.expressApp.get('/api/transacoes', auth, (req,res)=>transacaoCtrl.listar(req,res));
    this.expressApp.get('/api/transacoes/minhas', auth, (req,res)=>transacaoCtrl.listar(req,res));

    this.expressApp.get('/api/expansao', auth, (req,res)=>expansaoCtrl.listar(req,res));
    this.expressApp.post('/api/expansao/solicitar', auth, (req,res)=>expansaoCtrl.solicitar(req,res));
  }
}
