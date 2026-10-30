
import { Request, Response } from 'express';
import { VagaService } from '../services/VagaService';

export class VagaController {
  private service: VagaService;
  constructor() { this.service = new VagaService(); }

  criar = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).usuario?.id;
      const payload = { ...req.body, contratante_id: usuarioId };
      const vaga = await (this.service as any).criarVaga ? await (this.service as any).criarVaga(payload) : await this.service.criar(payload, usuarioId);
      res.json({ sucesso:true, vaga });
    } catch (e:any) { res.status(400).json({ erro:e.message }); }
  };

  buscarPorId = async (req: Request, res: Response) => {
    try {
      const vaga = await this.service.buscarPorId(Number(req.params.id));
      res.json({ sucesso:true, vaga });
    } catch (e:any) { res.status(404).json({ erro:e.message }); }
  };

  listarPorContratante = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).usuario?.id;
      const vagas = await this.service.listarPorContratante(usuarioId);
      res.json({ sucesso:true, vagas });
    } catch (e:any) { res.status(500).json({ erro:e.message }); }
  };

  minhasPublicadas = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).usuario?.id;
      const vagas = await this.service.minhasPublicadas(usuarioId);
      res.json({ sucesso:true, vagas });
    } catch (e:any) { res.status(500).json({ erro:e.message }); }
  };

  atualizar = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).usuario?.id;
      const vaga = await (this.service as any).atualizarVaga ? await (this.service as any).atualizarVaga(Number(req.params.id), req.body) : await this.service.atualizar(Number(req.params.id), req.body, usuarioId);
      res.json({ sucesso:true, vaga });
    } catch (e:any) { res.status(400).json({ erro:e.message }); }
  };

  cancelar = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).usuario?.id;
      if ((this.service as any).cancelarVaga) await (this.service as any).cancelarVaga(Number(req.params.id));
      else await this.service.cancelar(Number(req.params.id), usuarioId);
      res.json({ sucesso:true });
    } catch (e:any) { res.status(400).json({ erro:e.message }); }
  };
}
