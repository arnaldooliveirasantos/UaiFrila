
import { Request, Response } from 'express';
import { TipoUsuarioService } from '../services/TipoUsuarioService';
import { BaseController } from './BaseController';

export class TiposUsuarioController extends BaseController {
  private service: TipoUsuarioService;

  constructor() {
    super();
    this.service = new TipoUsuarioService();
  }

  listar = async (req: Request, res: Response) => {
    try {
      const tipos = await this.service.listar();
      return res.json({ success: true, data: this.mapListToPublic(tipos, req), tipos: this.mapListToPublic(tipos, req), tipos_usuario: this.mapListToPublic(tipos, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  buscarPorId = async (req: Request, res: Response) => {
    try {
      const tipo = await this.service.buscarPorId(Number(req.params.id));
      return res.json({ success: true, data: this.mapToPublic(tipo, req), tipo: this.mapToPublic(tipo, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  buscarPorChave = async (req: Request, res: Response) => {
    try {
      const tipo = await this.service.buscarPorChave(req.params.chave);
      if (!tipo) return this.error(res, 'Tipo não encontrado', 404);
      return res.json({ success: true, data: this.mapToPublic(tipo, req), tipo: this.mapToPublic(tipo, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
