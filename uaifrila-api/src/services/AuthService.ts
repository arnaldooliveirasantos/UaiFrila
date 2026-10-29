import { AuthRepository } from '../repositories/AuthRepository';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export class AuthService {
  private repo = new AuthRepository();

  async login(email: string, senha: string) {
    const usuario = await this.repo.buscarPorEmail(email);
    if (!usuario) throw new Error('Usuário não encontrado');

    // Se senha_hash for bcrypt, compara, senão compara direto (compatibilidade)
    let senhaValida = false;
    try {
      if (usuario.senha_hash.startsWith('$2')) {
        senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
      } else {
        senhaValida = usuario.senha_hash === senha;
      }
    } catch {
      senhaValida = usuario.senha_hash === senha;
    }

    if (!senhaValida) throw new Error('Senha inválida');

    const token = jwt.sign({ id: usuario.id, email: usuario.email, tipo: usuario.tipo }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    return { token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo } };
  }

  async cadastro(dados: { nome: string; email: string; senha: string; tipo?: string }) {
    const existente = await this.repo.buscarPorEmail(dados.email);
    if (existente) throw new Error('Email já cadastrado');

    let senhaHash = dados.senha;
    try {
      senhaHash = await bcrypt.hash(dados.senha, 10);
    } catch {}

    const usuario = await this.repo.criarUsuario({ nome: dados.nome, email: dados.email, senha_hash: senhaHash, tipo: dados.tipo });
    const token = jwt.sign({ id: usuario.id, email: usuario.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    return { token, usuario };
  }
}
