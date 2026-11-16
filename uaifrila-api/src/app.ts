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
import { UsuarioController } from './controllers/UsuarioController';
import { VagaController } from './controllers/VagaController';
import { VagaTurnoController } from './controllers/VagaTurnoController';
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
import { CategoriaFuncaoController } from './controllers/CategoriaFuncaoController';
import { UsuarioFuncaoController } from './controllers/UsuarioFuncaoController';
import { UsuarioPixController } from './controllers/UsuarioPixController';
import { PaisController } from './controllers/PaisController';
import { TipoUsuarioController } from './controllers/TipoUsuarioController';
import { StatusUsuarioController } from './controllers/StatusUsuarioController';
import { FuncaoController } from './controllers/FuncaoController';
import { TipoEnderecoController } from './controllers/TipoEnderecoController';
import { ConversaController } from './controllers/ConversaController';
import { MensagemController } from './controllers/MensagemController';
import { NotificacaoController } from './controllers/NotificacaoController';
import { VagaTemplateController } from './controllers/VagaTemplateController';
import { EnderecoVagaController } from './controllers/EnderecoVagaController';

export class App {
  public expressApp: express.Application;
  constructor() {
    this.expressApp = express();
    BaseRepository.setPool(pool);
    this.expressApp.use(cors());
    this.expressApp.use(express.json({ limit: '10mb' }));
    this.expressApp.use(loggerMiddleware);
    // Transacao unica por request (BEGIN/COMMIT/ROLLBACK). Nenhum controller/service/repository abre transacao.
    this.expressApp.use('/api', transactionMiddleware(pool));
    this.routes();
  }
  public getApp() { return this.expressApp; }
  private routes() {
    const authCtrl: any = new AuthController();
    const solicitarCtrl: any = new SolicitarCodigoController();
    const validarCtrl: any = new ValidarCodigoController();
    const usuarioCtrl: any = new UsuarioController();
    const vagaCtrl: any = new VagaController();
    const vagaTurnoCtrl: any = new VagaTurnoController();
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
    const ganhosCtrl: any = new GanhosController();
    const categoriaFuncaoCtrl: any = new CategoriaFuncaoController();
    const usuarioFuncaoCtrl: any = new UsuarioFuncaoController();
    const usuarioPixCtrl: any = new UsuarioPixController();
    const conversaCtrl: any = new ConversaController();
    const mensagemCtrl: any = new MensagemController();
    const notificacaoCtrl: any = new NotificacaoController();
    const vagaTemplateCtrl: any = new VagaTemplateController();

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

    this.expressApp.get('/api/paises', (req, res) => paisCtrl.listar(req, res));
    this.expressApp.get('/api/funcoes', (req, res) => funcaoCtrl.listar(req, res));
    this.expressApp.get('/api/tipos-endereco', (req, res) => tipoEnderecoCtrl.listar(req, res));
    this.expressApp.get('/api/estados', (req, res) => estadoCtrl.listar(req, res));
    this.expressApp.get('/api/estados/ativos', (req, res) => estadoCtrl.listarAtivos(req, res));
    this.expressApp.get('/api/estados/:sigla', (req, res) => estadoCtrl.buscarPorSigla(req, res));
    this.expressApp.get('/api/cidades/estado/:estadoId', (req, res) => cidadeCtrl.listarPorEstado(req, res));
    this.expressApp.get('/api/cidades/por-estado/:sigla', (req, res) => cidadeCtrl.listarPorEstadoSigla(req, res));
    // Cidades de selecao sao PUBLICAS (front chama com apiGetPublic, sem token).
    // ANTES ficavam DEPOIS do use('/api', authMiddleware) -> todo GET /cidades caia em 401
    // (CadastroEndereco, CidadeService, PainelConfiguracaoCidades). :id/POST/PUT/DELETE ficam protegidos abaixo.
    this.expressApp.get('/api/cidades', (req, res) => cidadeCtrl.listar(req, res));
    this.expressApp.get('/api/cidades/todas', (req, res) => cidadeCtrl.listarTodas(req, res));
    this.expressApp.get('/api/cidades/ativas', (req, res) => cidadeCtrl.listarAtivas(req, res));

    this.expressApp.get('/api/vagas/abertas', optionalAuthMiddleware, (req, res) => vagaCtrl.listar(req, res));

    // GET /api/tipos-usuario é PÚBLICO (tem que ficar ANTES do authMiddleware).
    // ANTES: só existia na linha 233, DEPOIS do `use('/api', authMiddleware)`.
    // O front chama com apiGetPublic (SEM token) via useTiposUsuario() no Perfil / Cadastro.
    // Resultado: GET /tipos-usuario -> 401, hook caía no fallback hardcoded (FREELA/CONTRATANTE/DUAL).
    // AGORA: GET público antes do middleware. POST continua protegido (depois do middleware).
    // Express casa a PRIMEIRA rota que bate, então esse GET público ganha do GET protegido de baixo.
    this.expressApp.get('/api/tipos-usuario', (req, res) => tipoUsuarioCtrl.listar(req, res));

    this.expressApp.use('/api', authMiddleware);

    this.expressApp.get('/api/auth/me', (req, res) => authCtrl.me(req, res));
    this.expressApp.get('/api/usuarios', (req, res) => usuarioCtrl.listar(req, res));
    this.expressApp.get('/api/usuarios/freelas', (req, res) => usuarioCtrl.listarFreelas(req, res));
    this.expressApp.get('/api/usuarios/:id/completo', (req, res) => usuarioCtrl.buscarPorIdCompleto(req, res));
    this.expressApp.get('/api/usuarios/:id', (req, res) => usuarioCtrl.buscarPorId(req, res));
    this.expressApp.put('/api/usuarios/:id', (req, res) => usuarioCtrl.atualizar(req, res));
    this.expressApp.delete('/api/usuarios/:id', (req, res) => usuarioCtrl.deletar(req, res));

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
      return enderecoCtrl.buscarAtivo(req, res);
    });
    this.expressApp.get('/api/enderecos/usuario/:usuarioId', (req, res) => enderecoCtrl.listarPorUsuario(req, res));
    this.expressApp.get('/api/enderecos/todos', (req, res) => enderecoCtrl.listarTodos(req, res));
    this.expressApp.get('/api/enderecos/:id', (req, res) => enderecoCtrl.buscarPorId(req, res));
    this.expressApp.post('/api/enderecos', (req, res) => enderecoCtrl.criar(req, res));
    this.expressApp.put('/api/enderecos/:id', (req, res) => enderecoCtrl.atualizar(req, res));
    this.expressApp.put('/api/enderecos/:id/ativo', (req, res) => enderecoCtrl.definirAtivo(req, res));
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
    this.expressApp.get('/api/vagas/minhas', (req, res) => vagaCtrl.minhasVagas(req, res));
    this.expressApp.get('/api/vagas/todas', (req, res) => vagaCtrl.listarTodas(req, res));
    this.expressApp.get('/api/vagas/contratante/:contratanteId', (req, res) => vagaCtrl.listarPorContratante(req, res));
    this.expressApp.post('/api/vagas/calcular', (req, res) => vagaCtrl.calcular(req, res));
    this.expressApp.post('/api/vagas/criar', (req, res) => vagaCtrl.criar(req, res));
    this.expressApp.post('/api/vagas', (req, res) => vagaCtrl.criar(req, res));
    // Turnos da vaga (agenda: dias + periodos + valor por turno)
    this.expressApp.get('/api/vagas/:vagaId/turnos', (req, res) => vagaTurnoCtrl.listarPorVaga(req, res));
    this.expressApp.get('/api/vagas/:vagaId/turnos/resumo', (req, res) => vagaTurnoCtrl.resumo(req, res));
    this.expressApp.put('/api/vagas/:vagaId/turnos', (req, res) => vagaTurnoCtrl.substituirAgenda(req, res));
    this.expressApp.post('/api/vagas/:vagaId/turnos', (req, res) => vagaTurnoCtrl.criar(req, res));
    this.expressApp.put('/api/vagas/turnos/:id', (req, res) => vagaTurnoCtrl.atualizar(req, res));
    this.expressApp.delete('/api/vagas/turnos/:id', (req, res) => vagaTurnoCtrl.deletar(req, res));
    this.expressApp.get('/api/vagas/:id', (req, res) => vagaCtrl.buscarPorId(req, res));
    this.expressApp.put('/api/vagas/:id', (req, res) => vagaCtrl.atualizar(req, res));
    this.expressApp.delete('/api/vagas/:id', (req, res) => vagaCtrl.deletar(req, res));
    this.expressApp.put('/api/vagas/:id/fechar', (req, res) => vagaCtrl.fecharVaga(req, res));
    this.expressApp.put('/api/vagas/:id/cancelar', (req, res) => vagaCtrl.cancelarVaga(req, res));

    this.expressApp.get('/api/candidaturas/minhas', (req, res) => candidaturaCtrl.minhasCandidaturas(req, res));
    this.expressApp.get('/api/candidaturas/vaga/:vagaId', (req, res) => candidaturaCtrl.listarPorVaga(req, res));
    this.expressApp.get('/api/candidaturas/todas', (req, res) => candidaturaCtrl.listarTodas(req, res));
    this.expressApp.post('/api/candidaturas', (req, res) => candidaturaCtrl.candidatar(req, res));
    // Fases 1: seleção em lote, confirmar/recusar seleção, visto, resumo, prazos.
    // (Ordem importa: rotas literais antes de /api/candidaturas/:id/...)
    this.expressApp.post('/api/candidaturas/processar-prazos', (req, res) => candidaturaCtrl.processarPrazos(req, res));
    this.expressApp.post('/api/candidaturas/vaga/:vagaId/selecionar', (req, res) => candidaturaCtrl.selecionarEmLote(req, res));
    this.expressApp.get('/api/candidaturas/vaga/:vagaId/selecao', (req, res) => candidaturaCtrl.resumoSelecao(req, res));
    this.expressApp.post('/api/candidaturas/:id/confirmar-selecao', (req, res) => candidaturaCtrl.confirmarSelecao(req, res));
    this.expressApp.post('/api/candidaturas/:id/recusar-selecao', (req, res) => candidaturaCtrl.recusarSelecao(req, res));
    this.expressApp.post('/api/candidaturas/:id/recusar', (req, res) => candidaturaCtrl.recusar(req, res));
    this.expressApp.post('/api/candidaturas/:id/cancelar', (req, res) => candidaturaCtrl.cancelar(req, res));
    this.expressApp.post('/api/candidaturas/:id/visto', (req, res) => candidaturaCtrl.marcarVisto(req, res));
    this.expressApp.put('/api/candidaturas/:id/status', (req, res) => candidaturaCtrl.atualizarStatus(req, res));
    this.expressApp.delete('/api/candidaturas/:id', (req, res) => candidaturaCtrl.deletar(req, res));

    this.expressApp.get('/api/trampos/meus', (req, res) => trampoCtrl.meusTrampos(req, res));
    this.expressApp.get('/api/trampos/todos', (req, res) => trampoCtrl.listarTodos(req, res));
    this.expressApp.get('/api/trampos/:id', (req, res) => trampoCtrl.buscarPorId(req, res));
    this.expressApp.post('/api/trampos', (req, res) => trampoCtrl.criar(req, res));
    this.expressApp.put('/api/trampos/:id', (req, res) => trampoCtrl.atualizar(req, res));
    this.expressApp.post('/api/trampos/:id/iniciar', (req, res) => trampoCtrl.iniciar(req, res));
    this.expressApp.post('/api/trampos/:id/confirmar-presenca', (req, res) => trampoCtrl.confirmarPresenca(req, res));
    this.expressApp.post('/api/trampos/:id/finalizar', (req, res) => trampoCtrl.finalizar(req, res));

    this.expressApp.get('/api/transacoes/minhas', (req, res) => transacaoCtrl.minhasTransacoes(req, res));
    this.expressApp.get('/api/transacoes/todas', (req, res) => transacaoCtrl.listarTodas(req, res));
    this.expressApp.get('/api/transacoes/:id', (req, res) => transacaoCtrl.buscarPorId(req, res));
    this.expressApp.post('/api/transacoes', (req, res) => transacaoCtrl.criar(req, res));
    this.expressApp.put('/api/transacoes/:id/status', (req, res) => transacaoCtrl.atualizarStatus(req, res));

    this.expressApp.get('/api/avaliacoes', (req, res) => avaliacaoCtrl.listar(req, res));
    this.expressApp.get('/api/avaliacoes/avaliado/:avaliadoId', (req, res) => avaliacaoCtrl.listarPorAvaliado(req, res));
    this.expressApp.get('/api/avaliacoes/minhas', (req, res) => avaliacaoCtrl.minhasAvaliacoes(req, res));
    this.expressApp.get('/api/avaliacoes/pendentes', (req, res) => avaliacaoCtrl.pendentes(req, res));
    this.expressApp.post('/api/avaliacoes', (req, res) => avaliacaoCtrl.criar(req, res));
    this.expressApp.delete('/api/avaliacoes/:id', (req, res) => avaliacaoCtrl.deletar(req, res));

    this.expressApp.post('/api/tipos-usuario', (req, res) => tipoUsuarioCtrl.criar(req, res));
    this.expressApp.get('/api/status-usuario', (req, res) => statusUsuarioCtrl.listar(req, res));
    this.expressApp.get('/api/tipos-endereco/todos', (req, res) => tipoEnderecoCtrl.listarTodos(req, res));

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
    // Dados PIX do usuário logado - CORRIGIDO: rotas não existiam, DadosPix.tsx chamava e tomava 404.
    // Padrão do arquivo: depois do use('/api', authMiddleware), sem authMiddleware por rota.
    this.expressApp.get('/api/usuario/pix', (req, res) => usuarioPixCtrl.buscarMeu(req, res));
    this.expressApp.get('/api/usuario/pix/historico', (req, res) => usuarioPixCtrl.listarHistorico(req, res));
    this.expressApp.post('/api/usuario/pix', (req, res) => usuarioPixCtrl.salvar(req, res));
    this.expressApp.delete('/api/usuario/pix', (req, res) => usuarioPixCtrl.excluir(req, res));

    // Funções / categorias / experiência do freela
    this.expressApp.get('/api/categorias-funcao', (req, res) => categoriaFuncaoCtrl.listar(req, res));
    this.expressApp.get('/api/categorias-funcao/com-funcoes', (req, res) => categoriaFuncaoCtrl.listarComFuncoes(req, res));
    this.expressApp.get('/api/minhas-funcoes', (req, res) => usuarioFuncaoCtrl.minhas(req, res));
    this.expressApp.post('/api/minhas-funcoes', (req, res) => usuarioFuncaoCtrl.salvar(req, res));
    this.expressApp.delete('/api/minhas-funcoes/:funcaoId', (req, res) => usuarioFuncaoCtrl.remover(req, res));
    this.expressApp.get('/api/permissoes', (req, res) => permissaoCtrl.listar(req, res));
    this.expressApp.get('/api/permissoes/categorias', (req, res) => permissaoCtrl.categorias(req, res));
    this.expressApp.get('/api/permissoes/matriz', (req, res) => permissaoCtrl.matriz(req, res));
    this.expressApp.get('/api/permissoes/meu-tipo', (req, res) => permissaoCtrl.meuTipo(req, res));
    this.expressApp.post('/api/permissoes', (req, res) => permissaoCtrl.criar(req, res));
    this.expressApp.put('/api/permissoes/:id', (req, res) => permissaoCtrl.atualizar(req, res));

    this.expressApp.get('/api/conversas/minhas', (req, res) => conversaCtrl.listarMinhas(req, res));
    // Fase 3: templates de vaga (publicar em 30 segundos).
    this.expressApp.get('/api/vaga-templates', (req, res) => vagaTemplateCtrl.listar(req, res));
    // Notificacoes: existiam service/controller/tela, mas NENHUMA rota — a tela
    // sempre caia em erro e o sino do Navbar nunca tinha contador.
    this.expressApp.get('/api/notificacoes/minhas', (req, res) => notificacaoCtrl.listarMinhas(req, res));
    this.expressApp.get('/api/notificacoes/nao-lidas', (req, res) => notificacaoCtrl.contarNaoLidas(req, res));
    this.expressApp.put('/api/notificacoes/lidas/todas', (req, res) => notificacaoCtrl.marcarTodasComoLidas(req, res));
    this.expressApp.put('/api/notificacoes/:id/lida', (req, res) => notificacaoCtrl.marcarComoLida(req, res));
    this.expressApp.post('/api/conversas', (req, res) => conversaCtrl.buscarOuCriar(req, res));
    this.expressApp.get('/api/conversas/:conversaId/mensagens', (req, res) => mensagemCtrl.listarPorConversa(req, res));
    this.expressApp.post('/api/conversas/:conversaId/mensagens', (req, res) => mensagemCtrl.enviar(req, res));
    this.expressApp.post('/api/conversas/:conversaId/lida', (req, res) => mensagemCtrl.marcarComoLida(req, res));

    this.expressApp.get('/health', (_req, res) => res.json({ status: 'ok' }));
    this.expressApp.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  }
}

export default App;
export function getApp() { const inst = new App(); return inst.getApp(); }
