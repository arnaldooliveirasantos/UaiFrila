import { Response } from 'express';
import { EnderecoService } from '../services/EnderecoService';
import { BaseController, AuthRequest } from './BaseController';

export class EnderecoController extends BaseController {
  private service: EnderecoService;
  constructor() { super(); this.service = new EnderecoService(); }

  meusEnderecos = async (req: AuthRequest, res: Response) => {
    try {
      // ERRO DA ENTREGA 29: o front chama /api/enderecos/meus, que cai AQUI —
      // nao no listarPorUsuario. Sem o cidade aninhado, end.cidade.estadoId
      // era undefined e o Estado nao preenchia.
      // Com cidade aninhada: o front le end.cidade.estadoId (caminho unico, sem fallback).
      const enderecos = await (this.service as any).listarPorUsuarioComCidade(req.usuario!.id);
      return res.json({ success: true, data: enderecos, enderecos });
    } catch (e: any) { return this.handleError(res, e); }
  };

  buscarAtivo = async (req: AuthRequest, res: Response) => {
    try {
      // Mesma forma do /meus: com cidade aninhada (end.cidade.estadoId).
      const lista = await (this.service as any).listarPorUsuarioComCidade(req.usuario!.id);
      const ativo = (Array.isArray(lista) ? lista : []).find((x: any) => x.ativo) || lista[0] || null;
      return res.json({ success: true, data: ativo, endereco: ativo });
    } catch (e: any) {
      console.warn('[EnderecoController.buscarAtivo] erro', e.message);
      return res.json({ success: true, data: null, endereco: null });
    }
  };

  listarPorUsuario = async (req: AuthRequest, res: Response) => {
    try {
      const usuarioId = Number(req.params.usuarioId);
      if (usuarioId !== req.usuario!.id && !this.isAdmin(req)) {
        return this.error(res, 'Acesso negado', 403);
      }
      // Com cidade aninhada: o front le end.cidade.estadoId (caminho unico, sem fallback).
      const enderecos = await (this.service as any).listarPorUsuarioComCidade(usuarioId);
      return res.json({ success: true, data: enderecos });
    } catch (e: any) { return this.handleError(res, e); }
  };

  buscarPorId = async (req: AuthRequest, res: Response) => {
    try {
      const svc: any = this.service as any;
      let endereco: any = null;
      if (typeof svc.buscarCompletoPorId === 'function') endereco = await svc.buscarCompletoPorId(Number(req.params.id));
      else endereco = await this.service.buscarPorId(Number(req.params.id));
      if (!endereco) return this.error(res, 'Endereço não encontrado', 404);
      if ((endereco as any).usuarioId !== req.usuario!.id && (endereco as any).usuario_id !== req.usuario!.id && !this.isAdmin(req)) {
        return this.error(res, 'Acesso negado', 403);
      }
      return res.json({ success: true, data: this.mapToPublic(endereco, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  criar = async (req: AuthRequest, res: Response) => {
    try {
      const endereco = await this.service.criar({
        ...req.body,
        usuarioId: req.usuario!.id,
        usuario_id: req.usuario!.id
      });
      return res.status(201).json({ success: true, data: this.mapToPublic(endereco, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  atualizar = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existente = await this.service.buscarPorId(id);
      if (!existente) return this.error(res, 'Endereço não encontrado', 404);
      if ((existente as any).usuarioId !== req.usuario!.id && (existente as any).usuario_id !== req.usuario!.id && !this.isAdmin(req)) {
        return this.error(res, 'Só dono pode atualizar', 403);
      }
      const endereco = await this.service.atualizar(id, req.body);
      return res.json({ success: true, data: this.mapToPublic(endereco, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  definirAtivo = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const endereco = await this.service.definirAtivo(req.usuario!.id, id);
      return res.json({ success: true, data: this.mapToPublic(endereco, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  deletar = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existente = await this.service.buscarPorId(id);
      if (!existente) return this.error(res, 'Endereço não encontrado', 404);
      if ((existente as any).usuarioId !== req.usuario!.id && (existente as any).usuario_id !== req.usuario!.id && !this.isAdmin(req)) {
        return this.error(res, 'Só dono pode deletar', 403);
      }
      await this.service.deletar(id);
      return res.json({ success: true, message: 'Endereço deletado' });
    } catch (e: any) { return this.handleError(res, e); }
  };

  listarTodos = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['ADMIN', 'SUPER_ADMIN']);
      const enderecos = await this.service.listar();
      return res.json({ success: true, data: this.mapListToPublic(enderecos, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
