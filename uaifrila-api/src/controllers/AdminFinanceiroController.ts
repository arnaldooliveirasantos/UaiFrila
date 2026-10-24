import { Request, Response } from 'express';
import { AdminFinanceiroService } from '../services/AdminFinanceiroService';

export class AdminFinanceiroController {
    private finService = new AdminFinanceiroService();

    public obterVariaveis = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.body.usuario_is_admin) {
                res.status(403).json({ erro: 'Acesso restrito apenas a administradores.' });
                return;
            }
            const dados = await this.finService.obterParametrosGlobais();
            res.status(200).json(dados);
        } catch (error: any) {
            res.status(500).json({ erro: error.message });
        }
    };

    public salvarVariavel = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.body.usuario_is_admin) {
                res.status(403).json({ erro: 'Acesso restrito apenas a administradores.' });
                return;
            }
            const { chave, valor } = req.body;
            await this.finService.salvarParametroGlobal(chave, valor);
            res.status(200).json({ sucesso: true });
        } catch (error: any) {
            res.status(500).json({ erro: error.message });
        }
    };

    public relatorioTransacoes = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.body.usuario_is_admin) {
                res.status(403).json({ erro: 'Acesso restrito apenas a administradores.' });
                return;
            }
            const { inicio, fim } = req.query;
            const dados = await this.finService.obterRelatorioAuditoria(String(inicio), String(fim));
            res.status(200).json(dados);
        } catch (error: any) {
            res.status(500).json({ erro: error.message });
        }
    };
}
