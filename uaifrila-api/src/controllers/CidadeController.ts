
import { Request, Response } from 'express';
import { CidadeService } from '../services/CidadeService';

export class CidadeController {
  private service: CidadeService;
  constructor() { this.service = new CidadeService(); }

  listar = async (req: Request, res: Response) => {
    try { 
      // CORREÇÃO: Só retorna cidades ativas
      const cidades = await this.service.listarAtivas(); 
      console.log('[CidadeController] Listando cidades ativas:', cidades.length);
      res.json({ sucesso: true, cidades }); 
    }
    catch (e: any) { res.status(500).json({ erro: e.message }); }
  };

  ativas = async (req: Request, res: Response) => {
    try { const cidades = await this.service.listarAtivas(); res.json({ sucesso: true, cidades }); }
    catch (e: any) { res.status(500).json({ erro: e.message }); }
  };

  buscarPorId = async (req: Request, res: Response) => {
    try { const cidade = await this.service.buscarPorId(Number(req.params.id)); res.json({ sucesso: true, cidade }); }
    catch (e: any) { res.status(404).json({ erro: e.message }); }
  };

  criar = async (req: Request, res: Response) => {
    try { const cidade = await this.service.criar(req.body); res.status(201).json({ sucesso: true, cidade }); }
    catch (e: any) { res.status(400).json({ erro: e.message }); }
  };
}
