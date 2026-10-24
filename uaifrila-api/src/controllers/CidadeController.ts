import { Request, Response } from 'express';
import { CidadeService } from '../services/CidadeService';

export class CidadeController {
    private cityService: CidadeService = new CidadeService();

    public listarGeografia = async (req: Request, res: Response): Promise<void> => {
        try {
            // Validação estrita do marcador de privilégios injetado pelo AuthMiddleware
            if (!req.body.usuario_is_admin) { 
                res.status(403).json({ erro: 'Acesso restrito apenas a administradores.' }); 
                return; 
            }
            const dados = await this.cityService.listarArvoreGeografica();
            res.status(200).json(dados);
        } catch (error: any) {
            res.status(500).json({ erro: error.message });
        }
    };

    public atualizarStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.body.usuario_is_admin) { 
                res.status(403).json({ erro: 'Acesso restrito apenas a administradores.' }); 
                return; 
            }
            const { id } = req.params;
            const { ativo } = req.body;
            const dados = await this.cityService.alternarStatusCidade(Number(id), Boolean(ativo));
            res.status(200).json({ sucesso: true, cidade: dados });
        } catch (error: any) {
            res.status(500).json({ erro: error.message });
        }
    };
}
