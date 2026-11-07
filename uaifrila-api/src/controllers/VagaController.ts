import { Response } from 'express';
import { VagaService } from '../services/VagaService';
import { BaseController, AuthRequest } from './BaseController';

export class VagaController extends BaseController {
  private service: VagaService;
  constructor() { super(); this.service = new VagaService(); }

  listar = async (req: AuthRequest, res: Response) => {
    try {
      const usuarioId = Number(req.usuario?.id);
      if (!usuarioId) return this.error(res, 'Não autenticado', 401);
      const mural = await this.service.listarMuralParaUsuario(usuarioId);
      return res.json({ success: true, data: mural, vagas: mural });
    } catch (e: any) { return this.handleError(res, e); }
  };

  mural = async (req: AuthRequest, res: Response) => { return this.listar(req, res); };

  minhasVagas = async (req: AuthRequest, res: Response) => {
    try {
      const vagas = await this.service.listarMuralParaUsuario(Number(req.usuario?.id));
      const minhas = vagas.filter((v: any) => v.is_minha);
      return res.json({ success: true, data: minhas, vagas: minhas });
    } catch (e: any) { return this.handleError(res, e); }
  };

  listarTodas = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['ADMIN', 'SUPER_ADMIN', 'FINANCEIRO']);
      const vagas = await this.service.listar();
      return res.json({ success: true, data: this.mapListToPublic(vagas, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  listarPorContratante = async (req: AuthRequest, res: Response) => {
    try {
      const contratanteId = Number(req.params.contratanteId || req.usuario!.id);
      if (contratanteId !== req.usuario!.id && !this.isAdmin(req)) return this.error(res, 'Acesso negado', 403);
      const vagas = await this.service.listarPorContratante(contratanteId);
      return res.json({ success: true, data: this.mapListToPublic(vagas, req), vagas: this.mapListToPublic(vagas, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  buscarPorId = async (req: AuthRequest, res: Response) => {
    try {
      const v = await this.service.buscarCompletaPorId(Number(req.params.id));
      if (!v) return this.error(res, 'Vaga não encontrada', 404);
      // CORREÇÃO: antes 'calculo' não existia no escopo - agora calcula de verdade
      const calculo = await this.service.calcular(v);
      return res.json({ success: true, data: { ...v, calculo } });
    } catch (e: any) { return this.handleError(res, e); }
  };

  criar = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['CONTRATANTE', 'DUAL', 'ADMIN', 'SUPER_ADMIN']);
      const vaga = await this.service.criar({ ...req.body, contratanteId: req.usuario!.id, contratante_id: req.usuario!.id });
      return res.status(201).json({ success: true, data: this.mapToPublic(vaga, req), vaga: this.mapToPublic(vaga, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  atualizar = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const vagaExistente = await this.service.buscarPorId(id);
      if (!vagaExistente) return this.error(res, 'Vaga não encontrada', 404);
      if ((vagaExistente as any).contratanteId !== req.usuario!.id && (vagaExistente as any).contratante_id !== req.usuario!.id && !this.isAdmin(req)) return this.error(res, 'Só dono da vaga pode atualizar', 403);
      const vaga = await this.service.atualizar(id, req.body);
      return res.json({ success: true, data: this.mapToPublic(vaga, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  deletar = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const vagaExistente = await this.service.buscarPorId(id);
      if (!vagaExistente) return this.error(res, 'Vaga não encontrada', 404);
      await this.service.deletar(id);
      return res.json({ success: true, message: 'Vaga deletada' });
    } catch (e: any) { return this.handleError(res, e); }
  };

  fecharVaga = async (req: AuthRequest, res: Response) => {
    try {
      this.checkRole(req, ['CONTRATANTE', 'DUAL', 'ADMIN', 'SUPER_ADMIN']);
      const vaga = await this.service.atualizar(Number(req.params.id), { status: 'FECHADA' });
      return res.json({ success: true, data: this.mapToPublic(vaga, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  calcular = async (req: AuthRequest, res: Response) => {
    try {
      const calculo = await this.service.calcular(req.body);
      return res.json({ success: true, calculo });
    } catch (e: any) { return this.handleError(res, e); }
  };

  cancelarVaga = async (req: AuthRequest, res: Response) => {
    try {
      const result = await this.service.cancelarVaga(Number(req.params.id), Number(req.usuario?.id), req.body?.motivo);
      return res.json({ success: true, data: result });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
