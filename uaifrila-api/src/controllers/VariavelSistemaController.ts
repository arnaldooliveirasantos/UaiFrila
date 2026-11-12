import { Response } from 'express';
import { VariavelSistemaService } from '../services/VariavelSistemaService';
import { BaseController, AuthRequest } from './BaseController';
// Usa Service/Repository (que usam a transacao da request). ANTES: usava pool.query direto, furando a transacao.
export class VariavelSistemaController extends BaseController {
  private service = new VariavelSistemaService();
  listar = async (_req: AuthRequest, res: Response) => { try { const d = await this.service.listar(); return res.json({ success: true, data: d, variaveis: d }); } catch (e: any) { return this.handleError(res, e); } };
  listarPorCategoria = async (req: AuthRequest, res: Response) => { try { const d = await this.service.listarPorCategoria(req.params.categoria); return res.json({ success: true, data: d }); } catch (e: any) { return this.handleError(res, e); } };
  listarPorGrupo = async (req: AuthRequest, res: Response) => this.listarPorCategoria(req, res);
  buscarPorChave = async (req: AuthRequest, res: Response) => { try { const v = await this.service.buscarPorChave(req.params.chave); if (!v) return this.error(res, 'Variavel nao encontrada', 404); return res.json({ success: true, data: v }); } catch (e: any) { return this.handleError(res, e); } };
  atualizarPorChave = async (req: AuthRequest, res: Response) => { try { this.checkRole(req, ['ADMIN', 'SUPER_ADMIN']); const v = await this.service.atualizarPorChave(req.params.chave, String(req.body?.valor ?? '')); return res.json({ success: true, data: v }); } catch (e: any) { return this.handleError(res, e); } };
  atualizar = async (req: AuthRequest, res: Response) => this.atualizarPorChave(req, res);
}
