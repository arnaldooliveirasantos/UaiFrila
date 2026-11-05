
import { Request, Response } from 'express';
import { PaisService } from '../services/PaisService';
import { FuncaoService } from '../services/FuncaoService';
import { TipoEnderecoService } from '../services/TipoEnderecoService';
import { StatusUsuarioService } from '../services/StatusUsuarioService';
import { BaseController } from './BaseController';

export class PaisController extends BaseController {
  private service: PaisService;
  constructor() { super(); this.service = new PaisService(); }
  listar = async (req: Request, res: Response) => {
    try {
      const paises = await this.service.listar();
      return res.json({ success: true, data: this.mapListToPublic(paises, req), paises: this.mapListToPublic(paises, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };
}

export class FuncaoController extends BaseController {
  private service: FuncaoService;
  constructor() { super(); this.service = new FuncaoService(); }
  listar = async (req: Request, res: Response) => {
    try {
      const funcoes = await this.service.listar();
      return res.json({ success: true, data: this.mapListToPublic(funcoes, req), funcoes: this.mapListToPublic(funcoes, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };
}

export class TipoEnderecoController extends BaseController {
  private service: TipoEnderecoService;
  constructor() { super(); this.service = new TipoEnderecoService(); }
  listar = async (req: Request, res: Response) => {
    try {
      const tipos = await this.service.listar();
      return res.json({ success: true, data: this.mapListToPublic(tipos, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };
}

export class StatusUsuarioController extends BaseController {
  private service: StatusUsuarioService;
  constructor() { super(); this.service = new StatusUsuarioService(); }
  listar = async (req: Request, res: Response) => {
    try {
      const status = await this.service.listar();
      return res.json({ success: true, data: this.mapListToPublic(status, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
