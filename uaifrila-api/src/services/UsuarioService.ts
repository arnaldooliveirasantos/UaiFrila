import { BaseService } from './BaseService';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { UsuarioModel } from '../models/UsuarioModel';
import { TipoUsuarioRepository } from '../repositories/TipoUsuarioRepository';
import { StatusUsuarioRepository } from '../repositories/StatusUsuarioRepository';
// SEM pool.query: tudo passa pelo repository (que usa a transacao do middleware).
// SEM JOIN com tu.nome / su.nome (essas colunas nao existem).
export class UsuarioService extends BaseService<UsuarioModel> {
  private tipoRepo = new TipoUsuarioRepository();
  private statusRepo = new StatusUsuarioRepository();
  constructor() { super(new UsuarioRepository()); }
  protected get usuarioRepo(): UsuarioRepository { return this.getRepo() as UsuarioRepository; }
  async buscarPorEmail(email: string): Promise<any | null> {
    this.validateRequired({ email }, ['email']); this.validateEmail(email);
    return await this.usuarioRepo.buscarPorEmail(String(email).trim().toLowerCase());
  }
  async buscarPorEmailComStatus(email: string): Promise<any | null> {
    return await this.usuarioRepo.buscarPorEmailComStatus(String(email).trim().toLowerCase());
  }
  async buscarPorCpf(cpf: string): Promise<any | null> { return await this.usuarioRepo.buscarPorCpf(cpf); }
  async buscarPorIdComRelacoes(id: number): Promise<any | null> {
    const row: any = await this.usuarioRepo.buscarPorId(id);
    if (!row) return null;
    try {
      if (row.tipo_usuario_id) { const t: any = await this.tipoRepo.buscarPorId(row.tipo_usuario_id); if (t) { row.tipo_chave = t.chave; row.tipo_descricao = t.descricao; row.nivel_permissao = t.nivel_permissao ?? t.nivelPermissao; } }
    } catch {}
    try {
      if (row.status_usuario_id) { const s: any = await this.statusRepo.buscarPorId(row.status_usuario_id); if (s) { row.status_chave = s.chave; row.status_descricao = s.descricao; } }
    } catch {}
    row.toRaw = () => row;
    row.toPublic = () => { const { senha_hash, senhaHash, ...rest } = row; return rest; };
    return row;
  }
  async buscarPorIdCompleto(id: number): Promise<any | null> { return this.buscarPorIdComRelacoes(id); }
  async buscarCompletoPorId(id: number): Promise<any | null> { return this.buscarPorIdComRelacoes(id); }
  async listarComFiltro(filtro: any): Promise<any[]> { return await this.listar(); }
  // ---- Fluxo de codigo ----
  async criarCadastro(payload: any): Promise<any> { return await this.usuarioRepo.criarGenerico(payload); }
  async atualizarCadastro(id: number, payload: any): Promise<any> { return await this.usuarioRepo.atualizarGenerico(id, payload); }
  async ativar(id: number, statusAtivoId: number): Promise<void> { await this.usuarioRepo.atualizarStatus(id, statusAtivoId); }
  async anonimizarCancelar(id: number, statusCanceladoId: number): Promise<void> { await this.usuarioRepo.anonimizarCancelar(id, statusCanceladoId); }
  static semSenha(usuario: any): any {
    if (!usuario) return null;
    const { senha_hash, senha, senhaHash, ...resto } = usuario as any;
    return resto;
  }
}
