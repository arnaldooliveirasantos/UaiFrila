import { Response } from 'express';
import { PermissaoService } from '../services/PermissaoService';
import { BaseController, AuthRequest } from './BaseController';
// Padrao dos demais controllers: fino, delega para o service. Sem pool.query, sem SQL.
// Inclui matriz + meuTipo (que eram os 2 metodos do PermissaoController de
// SistemaControllers.ts, que sera apagado) + listar/categorias/criar/atualizar
// (que existiam no PermissaoController antigo, mas nunca estavam ligados no App).
export class PermissaoController extends BaseController {
  private service = new PermissaoService();
  listar = async (req: AuthRequest, res: Response) => {
    try { const permissoes = await this.service.listar(); return res.json({ success: true, sucesso: true, data: permissoes, permissoes }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  matriz = async (req: AuthRequest, res: Response) => {
    try { const matriz = await this.service.matriz(); return res.json({ success: true, sucesso: true, data: matriz, matriz, permissoes: matriz }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  categorias = async (req: AuthRequest, res: Response) => {
    try { const categorias = await this.service.categorias(); return res.json({ success: true, sucesso: true, data: categorias, categorias }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  meuTipo = async (req: AuthRequest, res: Response) => {
    try { return res.json({ success: true, data: { tipoUsuarioId: req.usuario?.tipoUsuarioId, tipo_chave: req.usuario?.tipoChave } }); }
    catch (e: any) { return this.handleError(res, e); }
  };
  criar = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['ADMIN', 'SUPER_ADMIN']);
      const permissao = await this.service.criar(req.body || {});
      return res.status(201).json({ success: true, sucesso: true, data: permissao, permissao });
    } catch (e: any) { return this.handleError(res, e); }
  };
  atualizar = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['ADMIN', 'SUPER_ADMIN']);
      // :id da rota = id da linha em permissoes.
      const permissao = await this.service.atualizar(req.params.id, req.body || {});
      return res.json({ success: true, sucesso: true, data: permissao, permissao });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
