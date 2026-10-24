import { Request, Response } from 'express';
import { OperacaoService } from '../services/OperacaoService';

export class OperacaoController {
    private operacaoService = new OperacaoService();

    public candidatar = async (req: Request, res: Response): Promise<void> => {
        try {
            const { vagaId, usuarioId } = req.body;
            await this.operacaoService.candidatarVaga(Number(vagaId), Number(usuarioId));
            res.status(200).json({ sucesso: true, mensagem: 'Candidatura registrada!' });
        } catch (error: any) {
            res.status(400).json({ erro: error.message });
        }
    };

    public aceitar = async (req: Request, res: Response): Promise<void> => {
        try {
            const { vagaId, freelaId } = req.body;
            const trampo = await this.operacaoService.aceitarCandidato(Number(vagaId), Number(freelaId));
            res.status(201).json({ sucesso: true, trampo });
        } catch (error: any) {
            res.status(400).json({ erro: error.message });
        }
    };

    public historicoChat = async (req: Request, res: Response): Promise<void> => {
        try {
            const { vagaId } = req.params;
            const historico = await this.operacaoService.buscarHistoricoChat(Number(vagaId));
            res.status(200).json(historico);
        } catch (error: any) {
            res.status(500).json({ erro: error.message });
        }
    };
}
