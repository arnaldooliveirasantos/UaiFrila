
import { Request, Response } from 'express';
import { CandidaturaService } from '../services/CandidaturaService';

export class CandidaturaController {
  private service: CandidaturaService;

  constructor() {
    this.service = new CandidaturaService();
  }

  candidatar = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).usuario.id;
      const { vaga_id, mensagem } = req.body;
      const vagaId = Number(vaga_id || req.params.id);
      const result = await this.service.candidatar(vagaId, usuarioId, mensagem);
      res.status(201).json({ sucesso: true, candidatura: result });
    } catch (e: any) {
      res.status(400).json({ erro: e.message });
    }
  };

  listarPorVaga = async (req: Request, res: Response) => {
    try {
      const vagaId = Number(req.params.id);
      const candidaturas = await this.service.listarPorVaga(vagaId);
      res.json({ sucesso: true, candidaturas });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  listarMinhas = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).usuario.id;
      const candidaturas = await this.service.listarPorUsuario(usuarioId);
      res.json({ sucesso: true, candidaturas });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  aceitar = async (req: Request, res: Response) => {
    try {
      const contratanteId = (req as any).usuario.id;
      const vagaId = Number(req.params.id);
      const candidaturaId = Number(req.params.candidaturaId);
      const trampo = await this.service.aceitar(vagaId, candidaturaId, contratanteId);
      res.json({ sucesso: true, trampo });
    } catch (e: any) {
      res.status(400).json({ erro: e.message });
    }
  };
}
