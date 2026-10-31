
import { Request, Response } from 'express';
import { VagaService } from '../services/VagaService';

export class VagaController {
  private service: VagaService;
  private vagaService: VagaService;
  constructor() { this.service = new VagaService(); this.vagaService = this.service; }

  criarVaga = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).usuario?.id;
      const payload = { ...req.body, contratante_id: usuarioId };
      const vaga = await this.service.criarVaga(payload);
      res.json({ sucesso:true, vaga });
    } catch (e:any) { 
      console.error('[VagaController.criarVaga] Erro:', e.message, e.stack);
      res.status(400).json({ erro:e.message }); 
    }
  };

  criar = async (req: Request, res: Response) => { return await this.criarVaga(req,res); }

  listarVagasPorContratante = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).usuario?.id;
      const vagas = await this.service.listarVagasPorContratante(usuarioId);
      res.json({ sucesso:true, vagas });
    } catch (e:any) { res.status(500).json({ erro:e.message }); }
  };

  listarPorContratante = async (req: Request, res: Response) => { return await this.listarVagasPorContratante(req,res); }
  minhasPublicadas = async (req: Request, res: Response) => { return await this.listarVagasPorContratante(req,res); }

  buscarPorId = async (req: Request, res: Response) => {
    try {
      const vaga = await this.service.buscarPorId(Number(req.params.id));
      res.json({ sucesso:true, vaga });
    } catch (e:any) { res.status(404).json({ erro:e.message }); }
  };

  atualizarVaga = async (req: Request, res: Response) => {
    try {
      const vaga = await this.service.atualizarVaga(Number(req.params.id), req.body);
      res.json({ sucesso:true, vaga });
    } catch (e:any) { res.status(400).json({ erro:e.message }); }
  };
  atualizar = async (req: Request, res: Response) => { return await this.atualizarVaga(req,res); }

  cancelarVaga = async (req: Request, res: Response) => {
    try {
      await this.service.cancelarVaga(Number(req.params.id));
      res.json({ sucesso:true });
    } catch (e:any) { res.status(400).json({ erro:e.message }); }
  };
  cancelar = async (req: Request, res: Response) => { return await this.cancelarVaga(req,res); }
}
