import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AuthRepository } from '../repositories/AuthRepository';

export class EnderecoController extends BaseController {
  private repo = new AuthRepository();

  public listar = async (req: Request, res: Response): Promise<void> => {
    await this.executar(res, async () => {
      const usuarioId = this.getUsuarioId(req);
      const enderecos = await this.repo.buscarEnderecosUsuario(usuarioId);
      const ativo = await this.repo.buscarEnderecoAtivo(usuarioId);
      this.sucesso(res, { enderecos, ativo });
    });
  };

  public criar = async (req: Request, res: Response): Promise<void> => {
    await this.executar(res, async () => {
      const usuarioId = this.getUsuarioId(req);
      const novo = await this.repo.criarEnderecoUsuario(usuarioId, req.body);
      this.criado(res, novo, 'endereco');
    });
  };

  public ativar = async (req: Request, res: Response): Promise<void> => {
    await this.executar(res, async () => {
      const usuarioId = this.getUsuarioId(req);
      const enderecoId = parseInt(req.params.id);
      const ativo = await this.repo.ativarEnderecoUsuario(enderecoId, usuarioId);
      this.sucesso(res, { endereco: ativo });
    });
  };

  public atualizar = async (req: Request, res: Response): Promise<void> => {
    await this.executar(res, async () => {
      const usuarioId = this.getUsuarioId(req);
      const enderecoId = parseInt(req.params.id);
      const atualizado = await this.repo.atualizarEnderecoUsuario(enderecoId, usuarioId, req.body);
      this.sucesso(res, { endereco: atualizado });
    });
  };

  public deletar = async (req: Request, res: Response): Promise<void> => {
    await this.executar(res, async () => {
      const usuarioId = this.getUsuarioId(req);
      const enderecoId = parseInt(req.params.id);
      await this.repo.deletarEnderecoUsuario(enderecoId, usuarioId);
      this.sucesso(res, {}, 200, 'Endereço removido');
    });
  };

  public verificarTrampo = async (req: Request, res: Response): Promise<void> => {
    await this.executar(res, async () => {
      const usuarioId = this.getUsuarioId(req);
      const result = await this.repo.verificarTrampoEmAndamento(usuarioId);
      this.sucesso(res, result as any);
    });
  };
}
