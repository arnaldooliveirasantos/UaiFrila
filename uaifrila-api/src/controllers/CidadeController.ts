import { Request, Response } from 'express';

export class CidadeController {
  public listarAtivas = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json({ sucesso: true, cidades: [
        { id: 1, nome: 'Uberlândia', cidade_nome: 'Uberlândia', estado: 'MG', uf: 'MG' },
        { id: 2, nome: 'Anápolis', cidade_nome: 'Anápolis', estado: 'GO', uf: 'GO' },
        { id: 3, nome: 'Goiânia', cidade_nome: 'Goiânia', estado: 'GO', uf: 'GO' },
        { id: 4, nome: 'São Paulo', cidade_nome: 'São Paulo', estado: 'SP', uf: 'SP' },
        { id: 5, nome: 'Brasília', cidade_nome: 'Brasília', estado: 'DF', uf: 'DF' },
      ]});
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  public listar = async (req: Request, res: Response): Promise<void> => {
    return await this.listarAtivas(req, res);
  };
}
