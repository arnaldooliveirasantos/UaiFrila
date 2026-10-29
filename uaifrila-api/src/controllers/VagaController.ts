
import { Request, Response } from 'express';
import { VagaService } from '../services/VagaService';

export class VagaController {
  private service: VagaService;

  constructor() {
    this.service = new VagaService();
  }

  criar = async (req: Request, res: Response) => {
    try {
      const usuario = (req as any).usuario;
      const payload = { ...req.body, contratante_id: usuario.id, timezone: req.body.timezone || 'America/Sao_Paulo' };
      const vaga = await this.service.criarVaga(payload);
      res.status(201).json({ sucesso: true, vaga });
    } catch (e: any) {
      res.status(400).json({ erro: e.message });
    }
  };

  listarPorContratante = async (req: Request, res: Response) => {
    try {
      const usuario = (req as any).usuario;
      const vagas = await this.service.listarPorContratante(usuario.id);
      res.json({ sucesso: true, vagas });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  minhasPublicadas = async (req: Request, res: Response) => {
    return this.listarPorContratante(req, res);
  };

  mural = async (req: Request, res: Response) => {
    try {
      const usuario = (req as any).usuario;
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);
      const vagas = await this.service.buscarMural(usuario.id, page, limit);
      res.json({ sucesso: true, vagas, mural: vagas });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  buscarPorId = async (req: Request, res: Response) => {
    try {
      const vaga = await this.service.buscarPorId(Number(req.params.id));
      res.json({ sucesso: true, vaga });
    } catch (e: any) {
      res.status(404).json({ erro: e.message });
    }
  };

  atualizar = async (req: Request, res: Response) => {
    try {
      const vaga = await this.service.atualizarVaga(Number(req.params.id), req.body);
      res.json({ sucesso: true, vaga });
    } catch (e: any) {
      res.status(400).json({ erro: e.message });
    }
  };

  cancelar = async (req: Request, res: Response) => {
    try {
      await this.service.cancelarVaga(Number(req.params.id));
      res.json({ sucesso: true });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };
}
