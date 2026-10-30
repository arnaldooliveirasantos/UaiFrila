
import { TiposUsuarioRepository, TipoUsuario } from '../repositories/TiposUsuarioRepository';

export class TiposUsuarioService {
  private repo: TiposUsuarioRepository;

  constructor() {
    this.repo = new TiposUsuarioRepository();
  }

  async listarTodos(): Promise<TipoUsuario[]> {
    const tipos = await this.repo.listarTodos();
    console.log(`[TiposUsuarioService] Listando ${tipos.length} tipos`);
    return tipos;
  }

  async buscarPorId(id: number): Promise<TipoUsuario | null> {
    return await this.repo.buscarPorId(id);
  }

  async buscarPorChave(chave: string): Promise<TipoUsuario | null> {
    return await this.repo.buscarPorChave(chave);
  }
}
