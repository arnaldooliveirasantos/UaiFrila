import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { BaseRepository } from './repositories/BaseRepository';

import { AuthController } from './controllers/AuthController';
import { SolicitarCodigoController } from './controllers/SolicitarCodigoController';
import { ValidarCodigoController } from './controllers/ValidarCodigoController';
import { UsuarioController } from './controllers/UsuarioController';
import { VagaController } from './controllers/VagaController';
import { CidadeController } from './controllers/CidadeController';
import { EstadoController } from './controllers/EstadoController';
import { EnderecoController } from './controllers/EnderecoController';
import { CandidaturaController } from './controllers/CandidaturaController';
import { TrampoController } from './controllers/TrampoController';
import { TransacaoController } from './controllers/TransacaoController';
import { AvaliacaoController } from './controllers/AvaliacaoController';
import { VariavelSistemaController } from './controllers/VariavelSistemaController';
import { ExpansaoCidadeController } from './controllers/ExpansaoCidadeController';
import { PermissaoController } from './controllers/PermissaoController';
import { GanhosController } from './controllers/GanhosController';
import { CandidatoController } from './controllers/CandidatoController';

// @ts-ignore - pode ser CatalogosController ou TiposUsuarioController
let PaisController: any, TipoUsuarioController: any, StatusUsuarioController: any, FuncaoController: any, TipoEnderecoController: any;
try {
  const catalog = require('./controllers/CatalogosController');
  PaisController = catalog.PaisController;
  TipoUsuarioController = catalog.TipoUsuarioController;
  StatusUsuarioController = catalog.StatusUsuarioController;
  FuncaoController = catalog.FuncaoController;
  TipoEnderecoController = catalog.TipoEnderecoController;
} catch {}

if (!TipoUsuarioController) {
  try {
    const mod = require('./controllers/TiposUsuarioController');
    TipoUsuarioController = mod.TiposUsuarioController || mod.default;
  } catch {}
}

// @ts-ignore
let EnderecoVagaController: any;
try {
  const mod = require('./controllers/EnderecoVagaController');
  EnderecoVagaController = mod.EnderecoVagaController;
} catch {
  EnderecoVagaController = class { vincular = (req: any, res: any) => res.json({ success: true }); listarPorVaga = (req: any, res: any) => res.json({ success: true, data: [] }); listarPorEndereco = (req: any, res: any) => res.json({ success: true, data: [] }); listar = (req: any, res: any) => res.json({ success: true, data: [] }); desvincular = (req: any, res: any) => res.json({ success: true }); };
}

const JWT_SECRET = process.env.JWT_SECRET || 'uaifrila-secret-2024';
let globalPool: Pool | null = null;

export function setAuthPool(pool: Pool) { globalPool = pool; }

export function authMiddleware(req: any, res: any, next: any) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ success: false, message: 'Token não fornecido' });
  const token = header.replace('Bearer ', '');
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (globalPool) {
      globalPool.query(`SELECT u.id, u.email, u.tipo_usuario_id, tu.chave as tipo_chave, tu.nivel_permissao FROM usuarios u LEFT JOIN tipos_usuario tu ON tu.id = u.tipo_usuario_id WHERE u.id = $1 LIMIT 1`, [decoded.id]).then((result: any) => {
        if (result.rows && result.rows[0]) {
          const row = result.rows[0];
          req.usuario = { id: row.id, email: row.email, tipoUsuarioId: row.tipo_usuario_id, tipoChave: row.tipo_chave, tipo_chave: row.tipo_chave, nivelPermissao: row.nivel_permissao, nivel_permissao: row.nivel_permissao, isAdmin: (row.nivel_permissao || 0) >= 80 || ['ADMIN','SUPER_ADMIN'].includes((row.tipo_chave || '').toUpperCase()) };
          next();
        } else {
          req.usuario = { id: decoded.id, email: decoded.email, tipoUsuarioId: decoded.tipoUsuarioId, tipoChave: decoded.tipoChave || decoded.tipo_chave || 'FREELA', nivelPermissao: decoded.nivelPermissao || 0, isAdmin: false };
          next();
        }
      }).catch(() => {
        req.usuario = { id: decoded.id, email: decoded.email, tipoUsuarioId: decoded.tipoUsuarioId, tipoChave: decoded.tipoChave || 'FREELA', nivelPermissao: decoded.nivelPermissao || 0, isAdmin: false };
        next();
      });
      return;
    }
    req.usuario = { id: decoded.id, email: decoded.email, tipoUsuarioId: decoded.tipoUsuarioId, tipoChave: decoded.tipoChave || 'FREELA', nivelPermissao: decoded.nivelPermissao || 0, isAdmin: false };
    next();
  } catch { return res.status(401).json({ success: false, message: 'Token inválido' }); }
}

export function optionalAuthMiddleware(req: any, _res: any, next: any) {
  const header = req.headers.authorization;
  if (header) { try { const token = header.replace('Bearer ', ''); const decoded: any = jwt.verify(token, JWT_SECRET); req.usuario = decoded; } catch {} }
  next();
}

export class App {
  public expressApp: express.Application;
  private pool: Pool;
  constructor() {
    this.expressApp = express();
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      this.pool = new Pool({ connectionString: databaseUrl, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
    } else {
      this.pool = new Pool({ user: process.env.DB_USER || 'postgres', password: process.env.DB_PASSWORD || 'postgres', host: process.env.DB_HOST || 'localhost', port: parseInt(process.env.DB_PORT || '5432'), database: process.env.DB_NAME || 'uaifrila' });
    }
    BaseRepository.setPool(this.pool);
    setAuthPool(this.pool);
    globalPool = this.pool;
    this.expressApp.use(cors());
    this.expressApp.use(express.json({ limit: '10mb' }));
    this.routes();
  }
  public getApp() { return this.expressApp; }
  private routes() {
    const authCtrl: any = new AuthController();
    const solicitarCtrl: any = new SolicitarCodigoController();
    const validarCtrl: any = new ValidarCodigoController();
    const usuarioCtrl: any = new UsuarioController();
    const vagaCtrl: any = new VagaController();
    const cidadeCtrl: any = new CidadeController();
    const estadoCtrl: any = new EstadoController();
    const enderecoCtrl: any = new EnderecoController();
    const enderecoVagaCtrl: any = new EnderecoVagaController();
    const candidaturaCtrl: any = new CandidaturaController();
    const trampoCtrl: any = new TrampoController();
    const transacaoCtrl: any = new TransacaoController();
    const avaliacaoCtrl: any = new AvaliacaoController();
    const paisCtrl: any = PaisController ? new PaisController() : null;
    const tipoUsuarioCtrl: any = TipoUsuarioController ? new TipoUsuarioController() : null;
    const statusUsuarioCtrl: any = StatusUsuarioController ? new StatusUsuarioController() : null;
    const funcaoCtrl: any = FuncaoController ? new FuncaoController() : null;
    const tipoEnderecoCtrl: any = TipoEnderecoController ? new TipoEnderecoController() : null;
    const variavelCtrl: any = new VariavelSistemaController();
    const expansaoCtrl: any = new ExpansaoCidadeController();
    const permissaoCtrl: any = new PermissaoController();
    const ganhosCtrl: any = new GanhosController();
    const candidatoCtrl: any = new CandidatoController();

    this.expressApp.post('/api/auth/register', (req, res) => authCtrl.register(req, res));
    this.expressApp.post('/api/auth/login', (req, res) => authCtrl.login(req, res));
    // SEM MOCK: login por código vai DIRETO para os controllers REAIS, não passa pelo AuthController.
    // ANTES: authCtrl.solicitarCodigo/validarCodigo eram mock ({ message: 'Código enviado (mock)' }) -
    // o front recebia "sucesso" falso, sem código no banco, sem token, sem usuário.
    // O AuthController também foi corrigido para delegar, mas a rota direta é a garantia:
    // mesmo que alguém volte a colar o mock no AuthController, a rota não usa ele.
    this.expressApp.post('/api/auth/solicitar-codigo', (req, res) => solicitarCtrl.solicitarCodigo(req, res));
    this.expressApp.post('/api/auth/validar-codigo', (req, res) => validarCtrl.validarCodigo(req, res));
    this.expressApp.post('/api/auth/reenviar-codigo', (req, res) => solicitarCtrl.reenviarCodigo(req, res));

    if (paisCtrl) this.expressApp.get('/api/paises', (req, res) => paisCtrl.listar(req, res));
    if (funcaoCtrl) this.expressApp.get('/api/funcoes', (req, res) => funcaoCtrl.listar(req, res));
    if (tipoEnderecoCtrl) this.expressApp.get('/api/tipos-endereco', (req, res) => tipoEnderecoCtrl.listar(req, res));
    this.expressApp.get('/api/estados', (req, res) => estadoCtrl.listar(req, res));
    this.expressApp.get('/api/estados/ativos', (req, res) => estadoCtrl.listarAtivos(req, res));
    this.expressApp.get('/api/estados/:sigla', (req, res) => estadoCtrl.buscarPorSigla(req, res));
    this.expressApp.get('/api/cidades/estado/:estadoId', (req, res) => cidadeCtrl.listarPorEstado(req, res));
    this.expressApp.get('/api/cidades/por-estado/:sigla', (req, res) => cidadeCtrl.listarPorEstadoSigla(req, res));

    this.expressApp.get('/api/vagas/abertas', optionalAuthMiddleware, (req, res) => vagaCtrl.listar(req, res));
    this.expressApp.get('/api/vagas/mural', optionalAuthMiddleware, (req, res) => vagaCtrl.listar(req, res));

    // GET /api/tipos-usuario é PÚBLICO (tem que ficar ANTES do authMiddleware).
    // ANTES: só existia na linha 233, DEPOIS do `use('/api', authMiddleware)`.
    // O front chama com apiGetPublic (SEM token) via useTiposUsuario() no Perfil / Cadastro.
    // Resultado: GET /tipos-usuario -> 401, hook caía no fallback hardcoded (FREELA/CONTRATANTE/DUAL).
    // AGORA: GET público antes do middleware. POST continua protegido (depois do middleware).
    // Express casa a PRIMEIRA rota que bate, então esse GET público ganha do GET protegido de baixo.
    if (tipoUsuarioCtrl) this.expressApp.get('/api/tipos-usuario', (req, res) => tipoUsuarioCtrl.listar(req, res));

    this.expressApp.use('/api', authMiddleware);

    this.expressApp.get('/api/auth/me', (req, res) => authCtrl.me(req, res));
    this.expressApp.get('/api/usuarios', (req, res) => usuarioCtrl.listar(req, res));
    this.expressApp.get('/api/usuarios/freelas', (req, res) => usuarioCtrl.listarFreelas(req, res));
    this.expressApp.get('/api/usuarios/:id/completo', (req, res) => usuarioCtrl.buscarPorIdCompleto(req, res));
    this.expressApp.get('/api/usuarios/:id', (req, res) => usuarioCtrl.buscarPorId(req, res));
    this.expressApp.put('/api/usuarios/:id', (req, res) => usuarioCtrl.atualizar(req, res));
    this.expressApp.delete('/api/usuarios/:id', (req, res) => usuarioCtrl.deletar(req, res));

    this.expressApp.get('/api/cidades', optionalAuthMiddleware, (req, res) => cidadeCtrl.listar(req, res));
    this.expressApp.get('/api/cidades/todas', optionalAuthMiddleware, (req, res) => cidadeCtrl.listarTodas(req, res));
    this.expressApp.get('/api/cidades/:id', (req, res) => cidadeCtrl.buscarPorId(req, res));
    this.expressApp.post('/api/cidades', (req, res) => cidadeCtrl.criar(req, res));
    this.expressApp.put('/api/cidades/:id', (req, res) => cidadeCtrl.atualizar(req, res));
    this.expressApp.delete('/api/cidades/:id', (req, res) => cidadeCtrl.deletar(req, res));

    this.expressApp.get('/api/estados/todos', (req, res) => estadoCtrl.listarTodos(req, res));
    this.expressApp.get('/api/estados/id/:id', (req, res) => estadoCtrl.buscarPorId(req, res));
    this.expressApp.post('/api/estados', (req, res) => estadoCtrl.criar(req, res));
    this.expressApp.put('/api/estados/:id', (req, res) => estadoCtrl.atualizar(req, res));
    this.expressApp.delete('/api/estados/:id', (req, res) => estadoCtrl.deletar(req, res));

    this.expressApp.get('/api/enderecos/meus', (req, res) => enderecoCtrl.meusEnderecos(req, res));
    this.expressApp.get('/api/enderecos/ativo', (req: any, res: any) => {
      if (enderecoCtrl.buscarAtivo) return enderecoCtrl.buscarAtivo(req, res);
      return enderecoCtrl.meusEnderecos(req, res);
    });
    this.expressApp.get('/api/enderecos/usuario/:usuarioId', (req, res) => enderecoCtrl.listarPorUsuario(req, res));
    this.expressApp.get('/api/enderecos/todos', (req, res) => enderecoCtrl.listarTodos(req, res));
    this.expressApp.get('/api/enderecos/:id', (req, res) => enderecoCtrl.buscarPorId(req, res));
    this.expressApp.post('/api/enderecos', (req, res) => enderecoCtrl.criar(req, res));
    this.expressApp.put('/api/enderecos/:id', (req, res) => enderecoCtrl.atualizar(req, res));
    this.expressApp.put('/api/enderecos/:id/ativo', (req, res) => enderecoCtrl.definirAtivo(req, res));
    this.expressApp.put('/api/enderecos/:id/ativar', (req, res) => enderecoCtrl.definirAtivo(req, res));
    this.expressApp.post('/api/enderecos/:id/ativo', (req, res) => enderecoCtrl.definirAtivo(req, res));
    this.expressApp.post('/api/enderecos/:id/ativar', (req, res) => enderecoCtrl.definirAtivo(req, res));
    this.expressApp.delete('/api/enderecos/:id', (req, res) => enderecoCtrl.deletar(req, res));

    this.expressApp.post('/api/enderecos-vaga', (req, res) => enderecoVagaCtrl.vincular(req, res));
    this.expressApp.post('/api/enderecos/vincular-vaga', (req, res) => enderecoVagaCtrl.vincular(req, res));
    this.expressApp.get('/api/enderecos-vaga/vaga/:vagaId', (req, res) => enderecoVagaCtrl.listarPorVaga(req, res));
    this.expressApp.get('/api/enderecos/vaga/:vagaId', (req, res) => enderecoVagaCtrl.listarPorVaga(req, res));
    this.expressApp.get('/api/enderecos-vaga/endereco/:enderecoId', (req, res) => enderecoVagaCtrl.listarPorEndereco(req, res));
    this.expressApp.get('/api/enderecos-vaga', (req, res) => enderecoVagaCtrl.listar(req, res));
    this.expressApp.delete('/api/enderecos-vaga', (req, res) => enderecoVagaCtrl.desvincular(req, res));

    // VAGAS - ORDEM FIXA
    this.expressApp.get('/api/vagas/abertas', (req, res) => vagaCtrl.listar(req, res));
    this.expressApp.get('/api/vagas/mural', (req, res) => vagaCtrl.listar(req, res));
    this.expressApp.get('/api/vagas/minhas', (req, res) => vagaCtrl.minhasVagas(req, res));
    this.expressApp.get('/api/vagas/minhas-publicadas', (req, res) => vagaCtrl.minhasPublicadas ? vagaCtrl.minhasPublicadas(req, res) : vagaCtrl.minhasVagas(req, res));
    this.expressApp.get('/api/vagas/todas', (req, res) => vagaCtrl.listarTodas(req, res));
    this.expressApp.get('/api/vagas/contratante/:contratanteId', (req, res) => vagaCtrl.listarPorContratante(req, res));
    this.expressApp.post('/api/vagas/calcular', (req, res) => vagaCtrl.calcular ? vagaCtrl.calcular(req, res) : res.json({ success: true, calculo: {} }));
    this.expressApp.post('/api/vagas/criar', (req, res) => vagaCtrl.criar(req, res));
    this.expressApp.post('/api/vagas', (req, res) => vagaCtrl.criar(req, res));
    this.expressApp.get('/api/vagas/:id', (req, res) => vagaCtrl.buscarPorId(req, res));
    this.expressApp.put('/api/vagas/:id', (req, res) => vagaCtrl.atualizar(req, res));
    this.expressApp.delete('/api/vagas/:id', (req, res) => vagaCtrl.deletar(req, res));
    this.expressApp.put('/api/vagas/:id/fechar', (req, res) => vagaCtrl.fecharVaga(req, res));
    this.expressApp.post('/api/vagas/:id/fechar', (req, res) => vagaCtrl.fecharVaga(req, res));
    this.expressApp.put('/api/vagas/:id/cancelar', (req, res) => vagaCtrl.cancelarVaga(req, res));
    this.expressApp.post('/api/vagas/:id/cancelar', (req, res) => vagaCtrl.cancelarVaga(req, res));

    this.expressApp.get('/api/candidaturas/minhas', (req, res) => candidaturaCtrl.minhasCandidaturas(req, res));
    this.expressApp.get('/api/candidaturas/vaga/:vagaId', (req, res) => candidaturaCtrl.listarPorVaga(req, res));
    this.expressApp.get('/api/candidaturas/todas', (req, res) => candidaturaCtrl.listarTodas(req, res));
    this.expressApp.post('/api/candidaturas', (req, res) => candidaturaCtrl.candidatar(req, res));
    this.expressApp.put('/api/candidaturas/:id/status', (req, res) => candidaturaCtrl.atualizarStatus(req, res));
    this.expressApp.delete('/api/candidaturas/:id', (req, res) => candidaturaCtrl.deletar(req, res));

    this.expressApp.get('/api/trampos/meus', (req, res) => trampoCtrl.meusTrampos(req, res));
    this.expressApp.get('/api/trampos/todos', (req, res) => trampoCtrl.listarTodos(req, res));
    this.expressApp.get('/api/trampos/:id', (req, res) => trampoCtrl.buscarPorId(req, res));
    this.expressApp.post('/api/trampos', (req, res) => trampoCtrl.criar(req, res));
    this.expressApp.put('/api/trampos/:id', (req, res) => trampoCtrl.atualizar(req, res));
    this.expressApp.post('/api/trampos/:id/iniciar', (req, res) => trampoCtrl.iniciar(req, res));
    this.expressApp.post('/api/trampos/:id/finalizar', (req, res) => trampoCtrl.finalizar(req, res));

    this.expressApp.get('/api/transacoes/minhas', (req, res) => transacaoCtrl.minhasTransacoes(req, res));
    this.expressApp.get('/api/transacoes/todas', (req, res) => transacaoCtrl.listarTodas(req, res));
    this.expressApp.get('/api/transacoes/:id', (req, res) => transacaoCtrl.buscarPorId(req, res));
    this.expressApp.post('/api/transacoes', (req, res) => transacaoCtrl.criar(req, res));
    this.expressApp.put('/api/transacoes/:id/status', (req, res) => transacaoCtrl.atualizarStatus(req, res));

    this.expressApp.get('/api/avaliacoes', (req, res) => avaliacaoCtrl.listar(req, res));
    this.expressApp.get('/api/avaliacoes/avaliado/:avaliadoId', (req, res) => avaliacaoCtrl.listarPorAvaliado(req, res));
    this.expressApp.get('/api/avaliacoes/minhas', (req, res) => avaliacaoCtrl.minhasAvaliacoes(req, res));
    this.expressApp.post('/api/avaliacoes', (req, res) => avaliacaoCtrl.criar(req, res));
    this.expressApp.delete('/api/avaliacoes/:id', (req, res) => avaliacaoCtrl.deletar(req, res));

    if (tipoUsuarioCtrl) {
      this.expressApp.get('/api/tipos-usuario', (req, res) => tipoUsuarioCtrl.listar(req, res));
      this.expressApp.post('/api/tipos-usuario', (req, res) => tipoUsuarioCtrl.criar(req, res));
    }
    if (statusUsuarioCtrl) this.expressApp.get('/api/status-usuario', (req, res) => statusUsuarioCtrl.listar(req, res));
    if (tipoEnderecoCtrl) this.expressApp.get('/api/tipos-endereco/todos', (req, res) => tipoEnderecoCtrl.listarTodos(req, res));

    this.expressApp.get('/api/variaveis', (req, res) => variavelCtrl.listar(req, res));
    this.expressApp.get('/api/variaveis/categoria/:categoria', (req, res) => variavelCtrl.listarPorCategoria(req, res));
    this.expressApp.get('/api/variaveis/:chave', (req, res) => variavelCtrl.buscarPorChave(req, res));
    this.expressApp.put('/api/variaveis/:chave', (req, res) => variavelCtrl.atualizarPorChave(req, res));

    this.expressApp.post('/api/expansao/solicitar', (req, res) => expansaoCtrl.solicitar(req, res));
    this.expressApp.get('/api/expansao', (req, res) => expansaoCtrl.listar(req, res));
    this.expressApp.get('/api/expansao/status/:status', (req, res) => expansaoCtrl.listarPorStatus(req, res));
    this.expressApp.get('/api/expansao/dashboard', (req, res) => expansaoCtrl.dashboard(req, res));
    this.expressApp.put('/api/expansao/:id/status', (req, res) => expansaoCtrl.atualizarStatus(req, res));
    this.expressApp.delete('/api/expansao/:id', (req, res) => expansaoCtrl.deletar(req, res));

    this.expressApp.get('/api/ganhos/meus', (req, res) => ganhosCtrl.meusGanhos(req, res));
    this.expressApp.get('/api/candidatos/vaga/:vagaId', (req, res) => candidatoCtrl.listarCandidatosPorVaga(req, res));
    this.expressApp.get('/api/permissoes', (req, res) => permissaoCtrl.listar(req, res));
    this.expressApp.get('/api/permissoes/categorias', (req, res) => permissaoCtrl.categorias(req, res));
    this.expressApp.get('/api/permissoes/matriz', (req, res) => permissaoCtrl.matriz(req, res));
    this.expressApp.get('/api/permissoes/meu-tipo', (req, res) => permissaoCtrl.meuTipo(req, res));
    this.expressApp.post('/api/permissoes', (req, res) => permissaoCtrl.criar(req, res));
    this.expressApp.put('/api/permissoes/:id', (req, res) => permissaoCtrl.atualizar(req, res));

    this.expressApp.get('/health', (_req, res) => res.json({ status: 'ok' }));
    this.expressApp.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  }
}

export default App;
export function getApp() { const inst = new App(); return inst.getApp(); }
