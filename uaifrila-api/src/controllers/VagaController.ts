import { Response } from 'express';
import { VagaService } from '../services/VagaService';
import { BaseController, AuthRequest } from './BaseController';

export class VagaController extends BaseController {
  private service: VagaService;
  constructor() { super(); this.service = new VagaService(); }

  listar = async (req: AuthRequest, res: Response) => {
    try {
      const vagas = await this.service.listarAbertas();
      return res.json({ success: true, data: this.mapListToPublic(vagas, req), vagas: this.mapListToPublic(vagas, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  listarTodas = async (req: AuthRequest, res: Response) => {
    try {
      // Admin vê todas, mas contratante também pode listar todas abertas? Mantém permissão
      const chave = (req.usuario?.tipoChave || '').toUpperCase();
      const nivel = req.usuario?.nivelPermissao || 0;
      // Se não for admin, retorna abertas mesmo
      if (nivel < 80 && !['ADMIN','SUPER_ADMIN','FINANCEIRO'].includes(chave)) {
        const vagas = await this.service.listarAbertas();
        return res.json({ success: true, data: this.mapListToPublic(vagas, req) });
      }
      const vagas = await this.service.listar();
      return res.json({ success: true, data: this.mapListToPublic(vagas, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  listarPorContratante = async (req: AuthRequest, res: Response) => {
    try {
      const paramId = req.params.contratanteId ? Number(req.params.contratanteId) : req.usuario!.id;
      const contratanteId = isNaN(paramId) ? req.usuario!.id : paramId;
      // Só dono ou admin
      if (contratanteId !== req.usuario!.id && !this.isAdmin(req)) {
        return this.error(res, 'Acesso negado', 403);
      }
      const vagas = await this.service.listarPorContratante(contratanteId);
      return res.json({ success: true, data: this.mapListToPublic(vagas, req), vagas: this.mapListToPublic(vagas, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  minhasVagas = async (req: AuthRequest, res: Response) => {
    try {
      // FIX 400 ID da vaga inválido: nunca valida params.id aqui, usa usuario.id
      const usuario = req.usuario;
      if (!usuario?.id || isNaN(Number(usuario.id))) {
        console.warn('[VagaController.minhasVagas] usuario sem id, retornando vazio');
        return res.json({ success: true, data: [], vagas: [] });
      }

      // REGRA: Todo exceto FREELA é CONTRATANTE
      const chave = (usuario.tipoChave || '').toUpperCase();
      const isContratante = chave !== 'FREELA';
      
      console.log(`[minhasVagas] usuario ${usuario.id} tipo ${chave} isContratante=${isContratante}`);

      if (!isContratante && !this.isAdmin(req)) {
        // FREELA não tem vagas publicadas, retorna vazio em vez de 403/400
        return res.json({ success: true, data: [], vagas: [], message: 'FREELA não publica vagas' });
      }

      const vagas = await this.service.listarPorContratante(usuario.id);
      return res.json({ success: true, data: this.mapListToPublic(vagas, req), vagas: this.mapListToPublic(vagas, req) });
    } catch (e: any) {
      console.error('[VagaController.minhasVagas] erro', e.message);
      // NUNCA retorna 400 ID da vaga inválido aqui, retorna array vazio
      return res.json({ success: true, data: [], vagas: [], message: 'Nenhuma vaga - ' + e.message });
    }
  };

  minhasPublicadas = async (req: AuthRequest, res: Response) => {
    return this.minhasVagas(req, res);
  };

  buscarPorId = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return this.error(res, 'ID da vaga inválido', 400);
      const vaga = await this.service.buscarCompletaPorId(id);
      if (!vaga) return this.error(res, 'Vaga não encontrada', 404);
      return res.json({ success: true, data: this.mapToPublic(vaga, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  criar = async (req: AuthRequest, res: Response) => {
    try {
      const usuario = req.usuario!;
      const chave = (usuario.tipoChave || '').toUpperCase();
      const nivel = usuario.nivelPermissao || 0;

      // REGRA: Todo exceto FREELA pode criar
      const isContratante = chave !== 'FREELA';
      const isAdmin = nivel >= 80 || ['ADMIN','SUPER_ADMIN'].includes(chave);

      console.log(`[VagaController.criar] usuario ${usuario.id} tipo ${chave} isContratante=${isContratante} isAdmin=${isAdmin}`);

      if (!isContratante && !isAdmin) {
        return this.error(res, `Acesso negado. Apenas CONTRATANTE pode criar vaga. Seu tipo: ${chave}. Vá em Perfil e altere seu tipo.`, 403);
      }

      const vaga = await this.service.criar({
        ...req.body,
        contratanteId: usuario.id,
        contratante_id: usuario.id,
      });
      
      // Calculo para retorno
      let calculo: any = null;
      try {
        calculo = await this.service.calcular(req.body);
      } catch {}

      return res.status(201).json({ success: true, data: this.mapToPublic(vaga, req), calculo });
    } catch (e: any) { 
      console.error('[VagaController.criar] erro', e);
      return this.handleError(res, e); 
    }
  };

  atualizar = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return this.error(res, 'ID inválido', 400);
      const vagaExistente = await this.service.buscarPorId(id);
      if (!vagaExistente) return this.error(res, 'Vaga não encontrada', 404);

      if ((vagaExistente as any).contratanteId !== req.usuario!.id && (vagaExistente as any).contratante_id !== req.usuario!.id && !this.isAdmin(req)) {
        return this.error(res, 'Só dono da vaga pode atualizar', 403);
      }

      const vaga = await this.service.atualizar(id, req.body);
      return res.json({ success: true, data: this.mapToPublic(vaga, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  deletar = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return this.error(res, 'ID inválido', 400);
      const vagaExistente = await this.service.buscarPorId(id);
      if (!vagaExistente) return this.error(res, 'Vaga não encontrada', 404);

      if ((vagaExistente as any).contratanteId !== req.usuario!.id && (vagaExistente as any).contratante_id !== req.usuario!.id && !this.isAdmin(req)) {
        return this.error(res, 'Só dono da vaga pode deletar', 403);
      }

      await this.service.deletar(id);
      return res.json({ success: true, message: 'Vaga deletada' });
    } catch (e: any) { return this.handleError(res, e); }
  };

  fecharVaga = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return this.error(res, 'ID inválido', 400);
      const chave = (req.usuario?.tipoChave || '').toUpperCase();
      const isContratante = chave !== 'FREELA';
      if (!isContratante && !this.isAdmin(req)) {
        return this.error(res, 'Acesso negado', 403);
      }
      const vaga = await this.service.atualizar(id, { status: 'FECHADA' });
      return res.json({ success: true, data: this.mapToPublic(vaga, req) });
    } catch (e: any) { return this.handleError(res, e); }
  };

  calcular = async (req: AuthRequest, res: Response) => {
    try {
      const calc = await this.service.calcular(req.body);
      return res.json({ success: true, calculo: calc, data: calc });
    } catch (e: any) { return this.handleError(res, e); }
  };
}
