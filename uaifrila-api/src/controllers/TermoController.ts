import { Request, Response } from 'express';
import { BaseRepository } from '../repositories/BaseRepository';

class TermoRepository extends BaseRepository {
  async buscarVigente(tipoId: number) {
    return await this.query(`SELECT * FROM termos WHERE tipo_usuario_id = $1 AND vigente = true LIMIT 1`, [tipoId]);
  }
}

export class TermoController {
  private repo = new TermoRepository();

  public obterTermoVigente = async (req: Request, res: Response): Promise<void> => {
    try {
      const tipoId = Number(req.params.tipoId);
      const termo = await this.repo.buscarVigente(tipoId);
      res.json({ termo: termo[0] || null });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };
}
