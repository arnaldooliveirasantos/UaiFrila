
import { Request, Response } from 'express';
import { TiposUsuarioService } from '../services/TiposUsuarioService';

export class TiposUsuarioController {
  private service: TiposUsuarioService;

  constructor() {
    this.service = new TiposUsuarioService();
  }

  public listar = async (req: Request, res: Response): Promise<void> => {
    try {
      const tipos = await this.service.listarTodos();
      res.json({ sucesso: true, tipos, total: tipos.length });
    } catch (e: any) {
      console.error('[TiposUsuarioController] Erro listar:', e.message);
      res.status(500).json({ erro: e.message });
    }
  };

  public buscarPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const tipo = await this.service.buscarPorId(id);
      if (!tipo) {
        res.status(404).json({ erro: 'Tipo de usuário não encontrado' });
        return;
      }
      res.json({ sucesso: true, tipo });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  public buscarPorChave = async (req: Request, res: Response): Promise<void> => {
    try {
      const chave = req.params.chave;
      const tipo = await this.service.buscarPorChave(chave);
      if (!tipo) {
        res.status(404).json({ erro: 'Tipo não encontrado' });
        return;
      }
      res.json({ sucesso: true, tipo });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };
}
