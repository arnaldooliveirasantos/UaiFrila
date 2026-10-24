import { Request, Response } from 'express';
import { MuralVagasService } from '../services/MuralVagasService';
export class MuralVagasController {
    private muralService = new MuralVagasService();
    public obterMural = async (req: Request, res: Response): Promise<void> => {
        try {
            const { usuarioId, tipo } = req.body;
            const dados = await this.muralService.listarVagasParaMural(Number(usuarioId), tipo);
            res.status(200).json(dados);
        } catch (error: any) { res.status(500).json({ erro: error.message }); }
    };
}
