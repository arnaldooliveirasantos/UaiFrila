import { Request, Response } from 'express';

export class OperacaoController {
    public candidatar = async (req: Request, res: Response): Promise<void> => {
        try { res.status(200).json({ sucesso: true, mensagem: 'Candidatura registrada!' }); }
        catch (error: any) { res.status(400).json({ erro: error.message }); }
    };

    public aceitar = async (req: Request, res: Response): Promise<void> => {
        try { res.status(201).json({ sucesso: true, trampo: [] }); }
        catch (error: any) { res.status(400).json({ erro: error.message }); }
    };

    public historicoChat = async (req: Request, res: Response): Promise<void> => {
        try { res.status(200).json([]); }
        catch (error: any) { res.status(500).json({ erro: error.message }); }
    };
}
