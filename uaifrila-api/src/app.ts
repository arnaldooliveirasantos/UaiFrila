import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { BaseRepository } from './repositories/BaseRepository';

import { AuthController } from './controllers/AuthController';
import { SolicitarCodigoController } from './controllers/SolicitarCodigoController';
import { ValidarCodigoController } from './controllers/ValidarCodigoController';
import { CancelarCadastroController } from './controllers/CancelarCadastroController';
import { UsuarioController } from './controllers/UsuarioController';
import { VagaController } from './controllers/VagaController';
import { CidadeController } from './controllers/CidadeController';
import { EstadoController } from './controllers/EstadoController';
import { EnderecoController } from './controllers/EnderecoController';
import { EnderecoVagaController } from './controllers/EnderecoVagaController';
import { CandidaturaController } from './controllers/CandidaturaController';
import { TrampoController } from './controllers/TrampoController';
import { TransacaoController } from './controllers/TransacaoController';
import { AvaliacaoController } from './controllers/AvaliacaoController';
import { PaisController, TipoUsuarioController, StatusUsuarioController, FuncaoController, TipoEnderecoController } from './controllers/CatalogosController';
import { VariavelSistemaController, ExpansaoCidadeController, PermissaoController } from './controllers/SistemaControllers';

const JWT_SECRET = process.env.JWT_SECRET || 'uaifrila-secret-2024';

let globalPool: Pool | null = null;

export function setAuthPool(pool: Pool) {
  globalPool = pool;
}

export function authMiddleware(req: any, res: any, next: any) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ success: false, message: 'Token não fornecido' });
  const token = header.replace('Bearer ', '');
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    // Se tem pool, busca dados frescos do banco para ter tipo atualizado
    if (globalPool) {
      globalPool.query(`
        SELECT u.id, u.email, u.tipo_usuario_id, tu.chave as tipo_chave, tu.nivel_permissao
        FROM usuarios u
        LEFT JOIN tipos_usuario tu ON tu.id = u.tipo_usuario_id
        WHERE u.id = $1 LIMIT 1
      `, [decoded.id]).then(result => {
        if (result.rows && result.rows[0]) {
          const row = result.rows[0];
          req.usuario = {
            id: row.id,
            email: row.email,
            tipoUsuarioId: row.tipo_usuario_id,
            tipoChave: row.tipo_chave,
            tipo_chave: row.tipo_chave,
            nivelPermissao: row.nivel_permissao,
            nivel_permissao: row.nivel_permissao,
            isAdmin: (row.nivel_permissao || 0) >= 80 || ['ADMIN','SUPER_ADMIN'].includes((row.tipo_chave || '').toUpperCase()),
          };
          next();
        } else {
          req.usuario = {
            id: decoded.id,
            email: decoded.email,
            tipoUsuarioId: decoded.tipoUsuarioId,
            tipoChave: decoded.tipoChave || decoded.tipo_chave || 'FREELA',
            nivelPermissao: decoded.nivelPermissao || decoded.nivel_permissao || 0,
            isAdmin: decoded.isAdmin || false,
          };
          next();
        }
      }).catch(() => {
        req.usuario = {
          id: decoded.id,
          email: decoded.email,
          tipoUsuarioId: decoded.tipoUsuarioId,
          tipoChave: decoded.tipoChave || decoded.tipo_chave || 'FREELA',
          nivelPermissao: decoded.nivelPermissao || decoded.nivel_permissao || 0,
          isAdmin: decoded.isAdmin || false,
        };
        next();
      });
    } else {
      req.usuario = {
        id: decoded.id,
        email: decoded.email,
        tipoUsuarioId: decoded.tipoUsuarioId,
        tipoChave: decoded.tipoChave || decoded.tipo_chave || 'FREELA',
        nivelPermissao: decoded.nivelPermissao || decoded.nivel_permissao || 0,
        isAdmin: decoded.isAdmin || false,
      };
      next();
    }
  } catch {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
}

export function optionalAuthMiddleware(req: any, _res: any, next: any) {
  const header = req.headers.authorization;
  if (header) {
    try {
      const token = header.replace('Bearer ', '');
      const decoded: any = jwt.verify(token, JWT_SECRET);
      req.usuario = decoded;
    } catch {}
  }
  next();
}

export class App {
  public expressApp: express.Application;
  private pool: Pool;

  constructor() {
    this.expressApp = express();
    
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      this.pool = new Pool({ 
        connectionString: databaseUrl, 
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false 
      });
    } else {
      this.pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'uaifrila',
      });
    }

    BaseRepository.setPool(this.pool);
    setAuthPool(this.pool);
    globalPool = this.pool;

    this.expressApp.use(helmet());
    this.expressApp.use(cors());
    this.expressApp.use(express.json({ limit: '10mb' }));
    this.expressApp.use(express.urlencoded({ extended: true }));

    this.routes();
  }

  private routes() {
    const authCtrl = new AuthController();
    const solicitarCtrl = new SolicitarCodigoController();
    const validarCtrl = new ValidarCodigoController();
    const cancelarCtrl = new CancelarCadastroController();
    const usuarioCtrl = new UsuarioController();
    const vagaCtrl = new VagaController();
    const cidadeCtrl = new CidadeController();
    const estadoCtrl = new EstadoController();
    const enderecoCtrl = new EnderecoController();
    const enderecoVagaCtrl = new EnderecoVagaController();
    const candidaturaCtrl = new CandidaturaController();
    const trampoCtrl = new TrampoController();
    const transacaoCtrl = new TransacaoController();
    const avaliacaoCtrl = new AvaliacaoController();
    const paisCtrl = new PaisController();
    const tipoUsuarioCtrl = new TipoUsuarioController();
    const statusUsuarioCtrl = new StatusUsuarioController();
    const funcaoCtrl = new FuncaoController();
    const tipoEnderecoCtrl = new TipoEnderecoController();
    const variavelCtrl = new VariavelSistemaController();
    const expansaoCtrl = new ExpansaoCidadeController();
    const permissaoCtrl = new PermissaoController();

    // ===== ROTAS PÚBLICAS =====
    this.expressApp.post('/api/auth/register', (req, res) => (authCtrl as any).register(req, res));
    this.expressApp.post('/api/auth/login', (req, res) => (authCtrl as any).login(req, res));
    // SEM MOCK, SEM FALLBACK: essas 4 rotas NÃO passam pelo AuthController mock.
    // Antes: (authCtrl as any).solicitarCodigo ? ... : res.json({ success: true })
    // O mock devolvia { success: true, message: 'Código enviado (mock)' } SEM criar usuário,
    // SEM gravar código, SEM enviar e-mail. O front avançava para a tela de código,
    // mas no banco NÃO tinha usuário nenhum - por isso "ainda não corrigiu a inclusão".
    // Agora: controllers REAIS, que criam o usuário no Cadastrar e ativam no Validar.
    this.expressApp.post('/api/auth/solicitar-codigo', (req, res) => (solicitarCtrl as any).solicitarCodigo(req, res));
    this.expressApp.post('/api/auth/validar-codigo', (req, res) => (validarCtrl as any).validarCodigo(req, res));
    this.expressApp.post('/api/auth/reenviar-codigo', (req, res) => (solicitarCtrl as any).reenviarCodigo(req, res));
    this.expressApp.post('/api/auth/cancelar-cadastro', (req, res) => (cancelarCtrl as any).cancelarCadastro(req, res));

    this.expressApp.get('/api/paises', (req, res) => (paisCtrl as any).listar(req, res));
    this.expressApp.get('/api/funcoes', (req, res) => (funcaoCtrl as any).listar(req, res));
    this.expressApp.get('/api/tipos-endereco', (req, res) => (tipoEnderecoCtrl as any).listar(req, res));
    this.expressApp.get('/api/estados', (req, res) => (estadoCtrl as any).listar(req, res));
    this.expressApp.get('/api/estados/:sigla', (req, res) => (estadoCtrl as any).buscarPorSigla(req, res));
    this.expressApp.get('/api/cidades/estado/:estadoId', (req, res) => (cidadeCtrl as any).listarPorEstado(req, res));
    this.expressApp.get('/api/cidades/por-estado/:sigla', (req, res) => (cidadeCtrl as any).listarPorEstadoSigla(req, res));

    // ===== MIDDLEWARE AUTH PARA RESTO =====
    // Mas vagas abertas e mural são opcionais
    this.expressApp.get('/api/vagas/abertas', optionalAuthMiddleware, (req, res) => (vagaCtrl as any).listar(req, res));
    this.expressApp.get('/api/vagas/mural', optionalAuthMiddleware, (req, res) => (vagaCtrl as any).listar(req, res));

    this.expressApp.use('/api', authMiddleware);

    this.expressApp.get('/api/auth/me', (req, res) => (authCtrl as any).me(req, res));

    // Usuários
    this.expressApp.get('/api/usuarios', (req, res) => (usuarioCtrl as any).listar(req, res));
    this.expressApp.get('/api/usuarios/freelas', (req, res) => (usuarioCtrl as any).listarFreelas(req, res));
    this.expressApp.get('/api/usuarios/:id/completo', (req, res) => (usuarioCtrl as any).buscarPorIdCompleto(req, res));
    this.expressApp.get('/api/usuarios/:id', (req, res) => (usuarioCtrl as any).buscarPorId(req, res));
    this.expressApp.put('/api/usuarios/:id', (req, res) => (usuarioCtrl as any).atualizar(req, res));
    this.expressApp.delete('/api/usuarios/:id', (req, res) => (usuarioCtrl as any).deletar(req, res));

    // Cidades
    this.expressApp.get('/api/cidades', (req, res) => (cidadeCtrl as any).listar(req, res));
    this.expressApp.get('/api/cidades/todas', (req, res) => (cidadeCtrl as any).listarTodas(req, res));
    this.expressApp.get('/api/cidades/:id', (req, res) => (cidadeCtrl as any).buscarPorId(req, res));
    this.expressApp.post('/api/cidades', (req, res) => (cidadeCtrl as any).criar(req, res));
    this.expressApp.put('/api/cidades/:id', (req, res) => (cidadeCtrl as any).atualizar(req, res));
    this.expressApp.delete('/api/cidades/:id', (req, res) => (cidadeCtrl as any).deletar(req, res));

    // Estados
    this.expressApp.get('/api/estados/todos', (req, res) => (estadoCtrl as any).listarTodos(req, res));
    this.expressApp.get('/api/estados/id/:id', (req, res) => (estadoCtrl as any).buscarPorId(req, res));
    this.expressApp.post('/api/estados', (req, res) => (estadoCtrl as any).criar(req, res));
    this.expressApp.put('/api/estados/:id', (req, res) => (estadoCtrl as any).atualizar(req, res));
    this.expressApp.delete('/api/estados/:id', (req, res) => (estadoCtrl as any).deletar(req, res));

    // Endereços - ordem: fixos antes de :id
    this.expressApp.get('/api/enderecos/meus', (req, res) => (enderecoCtrl as any).meusEnderecos(req, res));
    this.expressApp.get('/api/enderecos/ativo', (req: any, res: any) => {
      const ctrl: any = enderecoCtrl as any;
      if (ctrl.buscarAtivo) return ctrl.buscarAtivo(req, res);
      return ctrl.meusEnderecos(req, res);
    });
    this.expressApp.get('/api/enderecos/usuario/:usuarioId', (req, res) => (enderecoCtrl as any).listarPorUsuario(req, res));
    this.expressApp.get('/api/enderecos/todos', (req, res) => (enderecoCtrl as any).listarTodos(req, res));
    this.expressApp.get('/api/enderecos/:id', (req, res) => (enderecoCtrl as any).buscarPorId(req, res));
    this.expressApp.post('/api/enderecos', (req, res) => (enderecoCtrl as any).criar(req, res));
    this.expressApp.put('/api/enderecos/:id', (req, res) => (enderecoCtrl as any).atualizar(req, res));
    this.expressApp.put('/api/enderecos/:id/ativo', (req, res) => (enderecoCtrl as any).definirAtivo(req, res));
    this.expressApp.put('/api/enderecos/:id/ativar', (req, res) => (enderecoCtrl as any).definirAtivo(req, res));
    this.expressApp.post('/api/enderecos/:id/ativo', (req, res) => (enderecoCtrl as any).definirAtivo(req, res));
    this.expressApp.post('/api/enderecos/:id/ativar', (req, res) => (enderecoCtrl as any).definirAtivo(req, res));
    this.expressApp.delete('/api/enderecos/:id', (req, res) => (enderecoCtrl as any).deletar(req, res));

    // Enderecos Vaga - usando service correto
    this.expressApp.post('/api/enderecos-vaga', (req, res) => (enderecoVagaCtrl as any).vincular(req, res));
    this.expressApp.post('/api/enderecos/vincular-vaga', (req, res) => (enderecoVagaCtrl as any).vincular(req, res));
    this.expressApp.get('/api/enderecos-vaga/vaga/:vagaId', (req, res) => (enderecoVagaCtrl as any).listarPorVaga(req, res));
    this.expressApp.get('/api/enderecos/vaga/:vagaId', (req, res) => (enderecoVagaCtrl as any).listarPorVaga(req, res));
    this.expressApp.get('/api/enderecos-vaga/endereco/:enderecoId', (req, res) => (enderecoVagaCtrl as any).listarPorEndereco(req, res));
    this.expressApp.get('/api/enderecos-vaga', (req, res) => (enderecoVagaCtrl as any).listar(req, res));
    this.expressApp.delete('/api/enderecos-vaga', (req, res) => (enderecoVagaCtrl as any).desvincular(req, res));

    // VAGAS - ORDEM IMPORTANTE: rotas fixas ANTES de :id para não confundir /minhas com id=minhas
    this.expressApp.get('/api/vagas/abertas', (req, res) => (vagaCtrl as any).listar(req, res));
    this.expressApp.get('/api/vagas/mural', (req, res) => (vagaCtrl as any).listar(req, res));
    this.expressApp.get('/api/vagas/minhas', (req, res) => (vagaCtrl as any).minhasVagas(req, res));
    this.expressApp.get('/api/vagas/minhas-publicadas', (req, res) => {
      const ctrl: any = vagaCtrl as any;
      if (ctrl.minhasPublicadas) return ctrl.minhasPublicadas(req, res);
      return ctrl.minhasVagas(req, res);
    });
    this.expressApp.get('/api/vagas/todas', (req, res) => (vagaCtrl as any).listarTodas(req, res));
    this.expressApp.get('/api/vagas/contratante/:contratanteId', (req, res) => (vagaCtrl as any).listarPorContratante(req, res));
    this.expressApp.post('/api/vagas/calcular', (req, res) => (vagaCtrl as any).calcular ? (vagaCtrl as any).calcular(req, res) : res.json({ success: true, calculo: {} }));
    this.expressApp.post('/api/vagas/criar', (req, res) => (vagaCtrl as any).criar(req, res));
    this.expressApp.post('/api/vagas', (req, res) => (vagaCtrl as any).criar(req, res));
    // DEPOIS as rotas com :id
    this.expressApp.get('/api/vagas/:id', (req, res) => (vagaCtrl as any).buscarPorId(req, res));
    this.expressApp.put('/api/vagas/:id', (req, res) => (vagaCtrl as any).atualizar(req, res));
    this.expressApp.delete('/api/vagas/:id', (req, res) => (vagaCtrl as any).deletar(req, res));
    this.expressApp.put('/api/vagas/:id/fechar', (req, res) => (vagaCtrl as any).fecharVaga(req, res));
    this.expressApp.post('/api/vagas/:id/fechar', (req, res) => (vagaCtrl as any).fecharVaga(req, res));

    // Candidaturas
    this.expressApp.get('/api/candidaturas/minhas', (req, res) => (candidaturaCtrl as any).minhasCandidaturas(req, res));
    this.expressApp.get('/api/candidaturas/vaga/:vagaId', (req, res) => (candidaturaCtrl as any).listarPorVaga(req, res));
    this.expressApp.get('/api/candidaturas/todas', (req, res) => (candidaturaCtrl as any).listarTodas(req, res));
    this.expressApp.post('/api/candidaturas', (req, res) => (candidaturaCtrl as any).candidatar(req, res));
    this.expressApp.put('/api/candidaturas/:id/status', (req, res) => (candidaturaCtrl as any).atualizarStatus(req, res));
    this.expressApp.delete('/api/candidaturas/:id', (req, res) => (candidaturaCtrl as any).deletar(req, res));

    // Trampos
    this.expressApp.get('/api/trampos/meus', (req, res) => (trampoCtrl as any).meusTrampos(req, res));
    this.expressApp.get('/api/trampos/todos', (req, res) => (trampoCtrl as any).listarTodos(req, res));
    this.expressApp.get('/api/trampos/:id', (req, res) => (trampoCtrl as any).buscarPorId(req, res));
    this.expressApp.post('/api/trampos', (req, res) => (trampoCtrl as any).criar(req, res));
    this.expressApp.put('/api/trampos/:id', (req, res) => (trampoCtrl as any).atualizar(req, res));
    this.expressApp.post('/api/trampos/:id/iniciar', (req, res) => (trampoCtrl as any).iniciar(req, res));
    this.expressApp.post('/api/trampos/:id/finalizar', (req, res) => (trampoCtrl as any).finalizar(req, res));

    // Transações
    this.expressApp.get('/api/transacoes/minhas', (req, res) => (transacaoCtrl as any).minhasTransacoes(req, res));
    this.expressApp.get('/api/transacoes/todas', (req, res) => (transacaoCtrl as any).listarTodas(req, res));
    this.expressApp.get('/api/transacoes/:id', (req, res) => (transacaoCtrl as any).buscarPorId(req, res));
    this.expressApp.post('/api/transacoes', (req, res) => (transacaoCtrl as any).criar(req, res));
    this.expressApp.put('/api/transacoes/:id/status', (req, res) => (transacaoCtrl as any).atualizarStatus(req, res));
    this.expressApp.get('/api/transacoes/relatorio/cidade/:cidadeId', (req, res) => (transacaoCtrl as any).relatorioCidade(req, res));

    // Avaliações
    this.expressApp.get('/api/avaliacoes', (req, res) => (avaliacaoCtrl as any).listar(req, res));
    this.expressApp.get('/api/avaliacoes/avaliado/:avaliadoId', (req, res) => (avaliacaoCtrl as any).listarPorAvaliado(req, res));
    this.expressApp.get('/api/avaliacoes/minhas', (req, res) => (avaliacaoCtrl as any).minhasAvaliacoes(req, res));
    this.expressApp.post('/api/avaliacoes', (req, res) => (avaliacaoCtrl as any).criar(req, res));
    this.expressApp.delete('/api/avaliacoes/:id', (req, res) => (avaliacaoCtrl as any).deletar(req, res));

    // Catálogos
    this.expressApp.get('/api/tipos-usuario', (req, res) => (tipoUsuarioCtrl as any).listar(req, res));
    this.expressApp.post('/api/tipos-usuario', (req, res) => (tipoUsuarioCtrl as any).criar(req, res));
    this.expressApp.get('/api/status-usuario', (req, res) => (statusUsuarioCtrl as any).listar(req, res));
    this.expressApp.get('/api/tipos-endereco/todos', (req, res) => (tipoEnderecoCtrl as any).listarTodos(req, res));

    // Variáveis
    this.expressApp.get('/api/variaveis', (req, res) => (variavelCtrl as any).listar(req, res));
    this.expressApp.get('/api/variaveis/categoria/:categoria', (req, res) => (variavelCtrl as any).listarPorCategoria(req, res));
    this.expressApp.get('/api/variaveis/:chave', (req, res) => (variavelCtrl as any).buscarPorChave(req, res));
    this.expressApp.put('/api/variaveis/:chave', (req, res) => (variavelCtrl as any).atualizarPorChave(req, res));

    // Expansão
    this.expressApp.post('/api/expansao/solicitar', (req, res) => (expansaoCtrl as any).solicitar(req, res));
    this.expressApp.get('/api/expansao', (req, res) => (expansaoCtrl as any).listar(req, res));
    this.expressApp.get('/api/expansao/status/:status', (req, res) => (expansaoCtrl as any).listarPorStatus(req, res));
    this.expressApp.get('/api/expansao/dashboard', (req, res) => (expansaoCtrl as any).dashboard(req, res));
    this.expressApp.put('/api/expansao/:id/status', (req, res) => (expansaoCtrl as any).atualizarStatus(req, res));
    this.expressApp.delete('/api/expansao/:id', (req, res) => (expansaoCtrl as any).deletar(req, res));

    // Permissões
    this.expressApp.get('/api/permissoes/matriz', (req, res) => (permissaoCtrl as any).matriz(req, res));
    this.expressApp.get('/api/permissoes/meu-tipo', (req, res) => (permissaoCtrl as any).meuTipo(req, res));

    this.expressApp.get('/health', (_req, res) => res.json({ status: 'ok' }));
    this.expressApp.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  }
}

export default App;
