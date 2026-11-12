import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { pool } from './config/Database';
import { BaseRepository } from './repositories/BaseRepository';
import { authMiddleware, optionalAuthMiddleware } from './middlewares/AuthMiddleware';
import { transactionMiddleware } from './middlewares/TransactionMiddleware';
import { loggerMiddleware } from './middlewares/LoggerMiddleware';
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
import { VariavelSistemaController } from './controllers/VariavelSistemaController';
import { ExpansaoCidadeController, PermissaoController } from './controllers/SistemaControllers';
import { PaisController } from './controllers/PaisController';
import { FuncaoController } from './controllers/FuncaoController';
import { TipoEnderecoController } from './controllers/TipoEnderecoController';
import { StatusUsuarioController } from './controllers/StatusUsuarioController';
import { TipoUsuarioController } from './controllers/TipoUsuarioController';
// REMOVIDO: require() dinamico com try/catch, fallback de EnderecoVagaController que retornava {success:true} fake,
// authMiddleware duplicado dentro de App.ts, segundo Pool. Se um controller nao existir, o build quebra — e e para quebrar.
export class App {
  public expressApp: express.Application;
  constructor() {
    this.expressApp = express();
    BaseRepository.setPool(pool);
    this.expressApp.use(cors());
    this.expressApp.use(express.json({ limit: '10mb' }));
    this.expressApp.use(loggerMiddleware);
    // Transacao unica por request, ANTES de qualquer controller.
    this.expressApp.use('/api', transactionMiddleware(pool));
    this.routes();
  }
  public getApp() { return this.expressApp; }
  private routes() {
    const authCtrl: any = new AuthController();
    const solicitarCtrl: any = new SolicitarCodigoController();
    const validarCtrl: any = new ValidarCodigoController();
    const cancelarCtrl: any = new CancelarCadastroController();
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
    const paisCtrl: any = new PaisController();
    const tipoUsuarioCtrl: any = new TipoUsuarioController();
    const statusUsuarioCtrl: any = new StatusUsuarioController();
    const funcaoCtrl: any = new FuncaoController();
    const tipoEnderecoCtrl: any = new TipoEnderecoController();
    const variavelCtrl: any = new VariavelSistemaController();
    const expansaoCtrl: any = new ExpansaoCidadeController();
    const permissaoCtrl: any = new PermissaoController();
    const r = this.expressApp;
    // ---- PUBLICAS ----
    r.post('/api/auth/register', (req, res) => authCtrl.register(req, res));
    r.post('/api/auth/login', (req, res) => authCtrl.login(req, res));
    r.post('/api/auth/solicitar-codigo', (req, res) => solicitarCtrl.solicitarCodigo(req, res));
    r.post('/api/auth/validar-codigo', (req, res) => validarCtrl.validarCodigo(req, res));
    r.post('/api/auth/reenviar-codigo', (req, res) => solicitarCtrl.reenviarCodigo(req, res));
    r.post('/api/auth/cancelar-cadastro', (req, res) => cancelarCtrl.cancelarCadastro(req, res)); // ESTAVA SEM ROTA — controller existia e nunca era chamado
    r.get('/api/paises', (req, res) => paisCtrl.listar(req, res));
    r.get('/api/paises/:id', (req, res) => paisCtrl.buscarPorId(req, res));
    r.get('/api/paises/sigla/:sigla', (req, res) => paisCtrl.buscarPorSigla(req, res));
    r.get('/api/funcoes', (req, res) => funcaoCtrl.listar(req, res));
    r.get('/api/funcoes/ativas', (req, res) => funcaoCtrl.listarAtivas(req, res));
    r.get('/api/funcoes/:id', (req, res) => funcaoCtrl.buscarPorId(req, res));
    r.get('/api/funcoes/nome/:nome', (req, res) => funcaoCtrl.buscarPorNome(req, res));
    r.get('/api/tipos-endereco', (req, res) => tipoEnderecoCtrl.listar(req, res));
    r.get('/api/tipos-endereco/ativos', (req, res) => tipoEnderecoCtrl.listarAtivos(req, res));
    r.get('/api/tipos-endereco/chave/:chave', (req, res) => tipoEnderecoCtrl.buscarPorChave(req, res));
    r.get('/api/tipos-endereco/:id', (req, res) => tipoEnderecoCtrl.buscarPorId(req, res));
    r.get('/api/tipos-usuario', (req, res) => tipoUsuarioCtrl.listar(req, res)); // UNICA rota GET — remover a duplicata que estava apos o auth
    r.get('/api/estados', (req, res) => estadoCtrl.listar(req, res));
    r.get('/api/estados/:sigla', (req, res) => estadoCtrl.buscarPorSigla(req, res));
    r.get('/api/cidades/estado/:estadoId', (req, res) => cidadeCtrl.listarPorEstado(req, res));
    r.get('/api/cidades/por-estado/:sigla', (req, res) => cidadeCtrl.listarPorEstadoSigla(req, res));
    r.get('/api/vagas/abertas', optionalAuthMiddleware, (req, res) => vagaCtrl.listar(req, res)); // UNICA — remover duplicata apos auth
    r.get('/api/vagas/mural', optionalAuthMiddleware, (req, res) => vagaCtrl.listar(req, res)); // UNICA — remover duplicata apos auth
    // ---- PROTEGIDAS (auth em TODAS, sem excecao) ----
    r.use('/api', authMiddleware);
    r.get('/api/auth/me', (req, res) => authCtrl.me(req, res));
    r.get('/api/usuarios', (req, res) => usuarioCtrl.listar(req, res));
    r.get('/api/usuarios/freelas', (req, res) => usuarioCtrl.listarFreelas(req, res));
    r.get('/api/usuarios/:id/completo', (req, res) => usuarioCtrl.buscarPorIdCompleto(req, res));
    r.get('/api/usuarios/:id', (req, res) => usuarioCtrl.buscarPorId(req, res));
    r.put('/api/usuarios/:id', (req, res) => usuarioCtrl.atualizar(req, res));
    r.delete('/api/usuarios/:id', (req, res) => usuarioCtrl.deletar(req, res));
    r.get('/api/cidades', (req, res) => cidadeCtrl.listar(req, res));
    r.get('/api/cidades/todas', (req, res) => cidadeCtrl.listarTodas(req, res));
    r.get('/api/cidades/:id', (req, res) => cidadeCtrl.buscarPorId(req, res));
    r.post('/api/cidades', (req, res) => cidadeCtrl.criar(req, res));
    r.put('/api/cidades/:id', (req, res) => cidadeCtrl.atualizar(req, res));
    r.delete('/api/cidades/:id', (req, res) => cidadeCtrl.deletar(req, res));
    r.get('/api/estados/todos', (req, res) => estadoCtrl.listarTodos(req, res));
    r.get('/api/estados/id/:id', (req, res) => estadoCtrl.buscarPorId(req, res));
    r.post('/api/estados', (req, res) => estadoCtrl.criar(req, res));
    r.put('/api/estados/:id', (req, res) => estadoCtrl.atualizar(req, res));
    r.delete('/api/estados/:id', (req, res) => estadoCtrl.deletar(req, res));
    // Enderecos — ROTA CANONICA: PUT /api/enderecos/:id/ativo. REMOVER: /ativar (PUT e POST) e POST /:id/ativo.
    r.get('/api/enderecos/meus', (req, res) => enderecoCtrl.meusEnderecos(req, res));
    r.get('/api/enderecos/ativo', (req, res) => enderecoCtrl.buscarAtivo ? enderecoCtrl.buscarAtivo(req, res) : enderecoCtrl.meusEnderecos(req, res));
    r.get('/api/enderecos/usuario/:usuarioId', (req, res) => enderecoCtrl.listarPorUsuario(req, res));
    r.get('/api/enderecos/todos', (req, res) => enderecoCtrl.listarTodos(req, res));
    r.get('/api/enderecos/:id', (req, res) => enderecoCtrl.buscarPorId(req, res));
    r.post('/api/enderecos', (req, res) => enderecoCtrl.criar(req, res));
    r.put('/api/enderecos/:id', (req, res) => enderecoCtrl.atualizar(req, res));
    r.put('/api/enderecos/:id/ativo', (req, res) => enderecoCtrl.definirAtivo(req, res));
    r.delete('/api/enderecos/:id', (req, res) => enderecoCtrl.deletar(req, res));
    // Enderecos-vaga — ROTA CANONICA: /api/enderecos-vaga. REMOVER: /api/enderecos/vincular-vaga e /api/enderecos/vaga/:vagaId.
    r.post('/api/enderecos-vaga', (req, res) => enderecoVagaCtrl.vincular(req, res));
    r.get('/api/enderecos-vaga/vaga/:vagaId', (req, res) => enderecoVagaCtrl.listarPorVaga(req, res));
    r.get('/api/enderecos-vaga/endereco/:enderecoId', (req, res) => enderecoVagaCtrl.listarPorEndereco(req, res));
    r.get('/api/enderecos-vaga', (req, res) => enderecoVagaCtrl.listar(req, res));
    r.delete('/api/enderecos-vaga', (req, res) => enderecoVagaCtrl.desvincular(req, res));
    // Vagas — CANONICA: POST /api/vagas (criar), PUT /api/vagas/:id/fechar. REMOVER: POST /api/vagas/criar, POST /:id/fechar.
    r.get('/api/vagas/minhas', (req, res) => vagaCtrl.minhasVagas(req, res));
    r.get('/api/vagas/minhas-publicadas', (req, res) => vagaCtrl.minhasPublicadas ? vagaCtrl.minhasPublicadas(req, res) : vagaCtrl.minhasVagas(req, res));
    r.get('/api/vagas/todas', (req, res) => vagaCtrl.listarTodas(req, res));
    r.get('/api/vagas/contratante/:contratanteId', (req, res) => vagaCtrl.listarPorContratante(req, res));
    r.post('/api/vagas/calcular', (req, res) => vagaCtrl.calcular(req, res)); // se VagaController.calcular nao existir, criar — sem fallback {calculo:{}} fake no App.ts
    r.post('/api/vagas', (req, res) => vagaCtrl.criar(req, res));
    r.get('/api/vagas/:id', (req, res) => vagaCtrl.buscarPorId(req, res));
    r.put('/api/vagas/:id', (req, res) => vagaCtrl.atualizar(req, res));
    r.delete('/api/vagas/:id', (req, res) => vagaCtrl.deletar(req, res));
    r.put('/api/vagas/:id/fechar', (req, res) => vagaCtrl.fecharVaga(req, res));
    r.get('/api/candidaturas/minhas', (req, res) => candidaturaCtrl.minhasCandidaturas(req, res));
    r.get('/api/candidaturas/vaga/:vagaId', (req, res) => candidaturaCtrl.listarPorVaga(req, res));
    r.get('/api/candidaturas/todas', (req, res) => candidaturaCtrl.listarTodas(req, res));
    r.post('/api/candidaturas', (req, res) => candidaturaCtrl.candidatar(req, res));
    r.put('/api/candidaturas/:id/status', (req, res) => candidaturaCtrl.atualizarStatus(req, res));
    r.delete('/api/candidaturas/:id', (req, res) => candidaturaCtrl.deletar(req, res));
    r.get('/api/trampos/meus', (req, res) => trampoCtrl.meusTrampos(req, res));
    r.get('/api/trampos/todos', (req, res) => trampoCtrl.listarTodos(req, res));
    r.get('/api/trampos/:id', (req, res) => trampoCtrl.buscarPorId(req, res));
    r.post('/api/trampos', (req, res) => trampoCtrl.criar(req, res));
    r.put('/api/trampos/:id', (req, res) => trampoCtrl.atualizar(req, res));
    r.post('/api/trampos/:id/iniciar', (req, res) => trampoCtrl.iniciar(req, res));
    r.post('/api/trampos/:id/finalizar', (req, res) => trampoCtrl.finalizar(req, res));
    r.get('/api/transacoes/minhas', (req, res) => transacaoCtrl.minhasTransacoes(req, res));
    r.get('/api/transacoes/todas', (req, res) => transacaoCtrl.listarTodas(req, res));
    r.get('/api/transacoes/:id', (req, res) => transacaoCtrl.buscarPorId(req, res));
    r.post('/api/transacoes', (req, res) => transacaoCtrl.criar(req, res));
    r.put('/api/transacoes/:id/status', (req, res) => transacaoCtrl.atualizarStatus(req, res));
    r.get('/api/avaliacoes', (req, res) => avaliacaoCtrl.listar(req, res));
    r.get('/api/avaliacoes/avaliado/:avaliadoId', (req, res) => avaliacaoCtrl.listarPorAvaliado(req, res));
    r.get('/api/avaliacoes/minhas', (req, res) => avaliacaoCtrl.minhasAvaliacoes(req, res));
    r.post('/api/avaliacoes', (req, res) => avaliacaoCtrl.criar(req, res));
    r.delete('/api/avaliacoes/:id', (req, res) => avaliacaoCtrl.deletar(req, res));
    r.get('/api/tipos-usuario/chave/:chave', (req, res) => tipoUsuarioCtrl.buscarPorChave(req, res));
    r.get('/api/tipos-usuario/:id', (req, res) => tipoUsuarioCtrl.buscarPorId(req, res));
    r.post('/api/tipos-usuario', (req, res) => tipoUsuarioCtrl.criar(req, res));
    r.put('/api/tipos-usuario/:id', (req, res) => tipoUsuarioCtrl.atualizar(req, res));
    r.delete('/api/tipos-usuario/:id', (req, res) => tipoUsuarioCtrl.deletar(req, res));
    r.get('/api/status-usuario/chave/:chave', (req, res) => statusUsuarioCtrl.buscarPorChave(req, res));
    r.get('/api/status-usuario/:id', (req, res) => statusUsuarioCtrl.buscarPorId(req, res));
    r.post('/api/status-usuario', (req, res) => statusUsuarioCtrl.criar(req, res));
    r.put('/api/status-usuario/:id', (req, res) => statusUsuarioCtrl.atualizar(req, res));
    r.delete('/api/status-usuario/:id', (req, res) => statusUsuarioCtrl.deletar(req, res));
    r.get('/api/paises', (req, res) => paisCtrl.listar(req, res));
    r.post('/api/paises', (req, res) => paisCtrl.criar(req, res));
    r.put('/api/paises/:id', (req, res) => paisCtrl.atualizar(req, res));
    r.delete('/api/paises/:id', (req, res) => paisCtrl.deletar(req, res));
    r.post('/api/funcoes', (req, res) => funcaoCtrl.criar(req, res));
    r.put('/api/funcoes/:id', (req, res) => funcaoCtrl.atualizar(req, res));
    r.delete('/api/funcoes/:id', (req, res) => funcaoCtrl.deletar(req, res));
    r.post('/api/tipos-endereco', (req, res) => tipoEnderecoCtrl.criar(req, res));
    r.put('/api/tipos-endereco/:id', (req, res) => tipoEnderecoCtrl.atualizar(req, res));
    r.delete('/api/tipos-endereco/:id', (req, res) => tipoEnderecoCtrl.deletar(req, res));
    r.get('/api/status-usuario', (req, res) => statusUsuarioCtrl.listar(req, res));
    r.get('/api/tipos-endereco/todos', (req, res) => tipoEnderecoCtrl.listarTodos(req, res));
    r.get('/api/variaveis', (req, res) => variavelCtrl.listar(req, res));
    r.get('/api/variaveis/categoria/:categoria', (req, res) => variavelCtrl.listarPorCategoria(req, res));
    r.get('/api/variaveis/:chave', (req, res) => variavelCtrl.buscarPorChave(req, res));
    r.put('/api/variaveis/:chave', (req, res) => variavelCtrl.atualizarPorChave(req, res));
    r.post('/api/expansao/solicitar', (req, res) => expansaoCtrl.solicitar(req, res));
    r.get('/api/expansao', (req, res) => expansaoCtrl.listar(req, res));
    r.get('/api/expansao/status/:status', (req, res) => expansaoCtrl.listarPorStatus(req, res));
    r.get('/api/expansao/dashboard', (req, res) => expansaoCtrl.dashboard(req, res));
    r.put('/api/expansao/:id/status', (req, res) => expansaoCtrl.atualizarStatus(req, res));
    r.delete('/api/expansao/:id', (req, res) => expansaoCtrl.deletar(req, res));
    r.get('/api/permissoes/matriz', (req, res) => permissaoCtrl.matriz(req, res));
    r.get('/api/permissoes/meu-tipo', (req, res) => permissaoCtrl.meuTipo(req, res));
    r.get('/health', (_req, res) => res.json({ status: 'ok' }));
    r.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  }
}
export default App;
export function getApp() { const inst = new App(); return inst.getApp(); }
