
import { Request, Response } from 'express';
import { VagaRepository } from '../repositories/VagaRepository';
import { BaseRepository } from '../repositories/BaseRepository';

export class EnderecoVagaController {
  private repo: VagaRepository;
  constructor() { this.repo = new VagaRepository(); }

  criar = async (req: Request, res: Response) => {
    try {
      const endereco = await (this.repo as any).criarEnderecoVaga(req.body);
      res.json({ sucesso:true, endereco });
    } catch (e:any) { res.status(500).json({ erro:e.message }); }
  };

  listarPorVaga = async (req: Request, res: Response) => {
    try {
      const pool = BaseRepository.getPool() as any;
      if (!pool) { res.json({ sucesso:true, enderecos:[] }); return; }
      const vagaId = req.params.vagaId || req.params.vagaId;
      const rows = await pool.query('SELECT * FROM enderecos_Vaga WHERE vaga_id=$1 AND is_ativo=true ORDER BY criado_em DESC', [vagaId]);
      res.json({ sucesso:true, enderecos: rows.rows });
    } catch (e:any) { res.status(500).json({ erro:e.message }); }
  };
}
