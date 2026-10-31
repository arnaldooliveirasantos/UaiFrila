
import { Request, Response } from 'express';
import { EstadoService } from '../services/EstadoService';

export class EstadoController {
  private service: EstadoService;
  constructor() { this.service = new EstadoService(); }

  listar = async (req: Request, res: Response) => {
    try { 
      const { todos, all, ativo } = req.query;
      let estados;
      // Se ?todos=true ou ?all=true, retorna todos os 27 estados
      if (todos === 'true' || all === 'true' || ativo === 'todos') {
        estados = await this.service.listarTodos();
        console.log('[EstadoController] Listando TODOS os estados:', estados.length);
      } else {
        // Padrão: só ativos (só MG)
        estados = await this.service.listarAtivos();
        console.log('[EstadoController] Listando estados ATIVOS:', estados.length, '-', estados.map((e:any)=>e.sigla).join(','));
      }
      res.json({ sucesso: true, estados, total: estados.length }); 
    }
    catch (e: any) { res.status(500).json({ erro: e.message }); }
  };

  ativas = async (req: Request, res: Response) => {
    try { 
      const estados = await this.service.listarAtivos(); 
      res.json({ sucesso: true, estados, total: estados.length }); 
    }
    catch (e: any) { res.status(500).json({ erro: e.message }); }
  };

  buscarPorId = async (req: Request, res: Response) => {
    try { const estado = await this.service.buscarPorId(Number(req.params.id)); res.json({ sucesso: true, estado }); }
    catch (e: any) { res.status(404).json({ erro: e.message }); }
  };

  todos = async (req: Request, res: Response) => {
    try { 
      const estados = await this.service.listarTodos(); 
      res.json({ sucesso: true, estados, total: estados.length }); 
    }
    catch (e: any) { res.status(500).json({ erro: e.message }); }
  };
}
