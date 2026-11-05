import { Response } from 'express';
import { EnderecoVagaService } from '../services/EnderecoVagaService';
import { BaseController, AuthRequest } from './BaseController';

export class EnderecoVagaController extends BaseController {
  private service: EnderecoVagaService;

  constructor() {
    super();
    this.service = new EnderecoVagaService();
  }

  // POST /api/enderecos-vaga ou /api/enderecos/vincular-vaga
  vincular = async (req: AuthRequest, res: Response) => {
    try {
      const { vaga_id, vagaId, endereco_id, enderecoId } = req.body;
      const vId = Number(vaga_id || vagaId);
      const eId = Number(endereco_id || enderecoId);

      if (!vId || isNaN(vId)) return this.error(res, 'vaga_id obrigatório', 400);
      if (!eId || isNaN(eId)) return this.error(res, 'endereco_id obrigatório', 400);

      const vinculo = await this.service.vincular(vId, eId);
      return res.status(201).json({ success: true, data: vinculo, endereco_vaga: vinculo });
    } catch (e: any) {
      return this.handleError(res, e);
    }
  };

  // Alias para compatibilidade com frontend antigo
  criar = async (req: AuthRequest, res: Response) => {
    return this.vincular(req, res);
  };

  // GET /api/enderecos-vaga/vaga/:vagaId
  listarPorVaga = async (req: AuthRequest, res: Response) => {
    try {
      const vagaId = Number(req.params.vagaId || req.params.id);
      if (!vagaId || isNaN(vagaId)) return this.error(res, 'vagaId inválido', 400);
      
      const lista = await this.service.listarPorVaga(vagaId);
      return res.json({ 
        success: true, 
        data: lista, 
        enderecos: lista,
        enderecos_vaga: lista 
      });
    } catch (e: any) {
      return this.handleError(res, e);
    }
  };

  // GET /api/enderecos-vaga/endereco/:enderecoId
  listarPorEndereco = async (req: AuthRequest, res: Response) => {
    try {
      const enderecoId = Number(req.params.enderecoId || req.params.id);
      if (!enderecoId || isNaN(enderecoId)) return this.error(res, 'enderecoId inválido', 400);
      
      const lista = await this.service.listarPorEndereco(enderecoId);
      return res.json({ success: true, data: lista, vagas: lista });
    } catch (e: any) {
      return this.handleError(res, e);
    }
  };

  // DELETE /api/enderecos-vaga
  desvincular = async (req: AuthRequest, res: Response) => {
    try {
      const { vaga_id, vagaId, endereco_id, enderecoId } = req.body;
      const vId = Number(vaga_id || vagaId || req.params.vagaId);
      const eId = Number(endereco_id || enderecoId || req.params.enderecoId);

      if (!vId || isNaN(vId) || !eId || isNaN(eId)) {
        return this.error(res, 'vaga_id e endereco_id obrigatórios', 400);
      }

      const ok = await this.service.desvincular(vId, eId);
      return res.json({ success: true, desvinculado: ok });
    } catch (e: any) {
      return this.handleError(res, e);
    }
  };

  // GET /api/enderecos-vaga - lista todos (admin)
  listar = async (req: AuthRequest, res: Response) => {
    try {
      const lista = await this.service.listar();
      return res.json({ success: true, data: lista });
    } catch (e: any) {
      return this.handleError(res, e);
    }
  };

  deletar = async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!id || isNaN(id)) return this.error(res, 'ID inválido', 400);
      await this.service.deletar(id);
      return res.json({ success: true, message: 'Deletado' });
    } catch (e: any) {
      return this.handleError(res, e);
    }
  };
}
