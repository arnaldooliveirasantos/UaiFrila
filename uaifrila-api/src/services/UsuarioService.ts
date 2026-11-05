
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { UsuarioModel } from '../models/UsuarioModel';
import { BaseService } from './BaseService';

export class UsuarioService extends BaseService<UsuarioModel> {
  protected repository: UsuarioRepository;

  constructor() {
    super();
    this.repository = new UsuarioRepository();
  }

  async buscarPorEmail(email: string): Promise<UsuarioModel | null> {
    try {
      this.validateRequired({ email }, ['email']);
      this.validateEmail(email);
      return await this.repository.buscarPorEmail(email);
    } catch (e: any) {
      this.handleError(e, 'UsuarioService.buscarPorEmail');
    }
  }

  async buscarPorCpf(cpf: string): Promise<UsuarioModel | null> {
    try {
      return await this.repository.buscarPorCpf(cpf);
    } catch (e: any) {
      this.handleError(e, 'UsuarioService.buscarPorCpf');
    }
  }

  async buscarPorIdCompleto(id: number): Promise<UsuarioModel | null> {
    try {
      return await this.repository.buscarPorIdCompleto(id);
    } catch (e: any) {
      this.handleError(e, 'UsuarioService.buscarPorIdCompleto');
    }
  }

  async listar(): Promise<UsuarioModel[]> {
    try {
      return await this.repository.listarComFiltro();
    } catch (e: any) {
      this.handleError(e, 'UsuarioService.listar');
    }
  }

  async listarFreelas(): Promise<UsuarioModel[]> {
    try {
      return await this.repository.listarComFiltro({ tipoUsuarioId: 1 } as any);
    } catch (e: any) {
      // Fallback: busca todos e filtra
      const todos = await this.repository.buscarTodos();
      return todos.filter((u: any) => u.tipoUsuarioId === 1 || u.tipo_usuario_id === 1);
    }
  }

  async listarComFiltro(filtro?: any): Promise<UsuarioModel[]> {
    try {
      return await this.repository.listarComFiltro(filtro);
    } catch (e: any) {
      this.handleError(e, 'UsuarioService.listarComFiltro');
    }
  }
}
