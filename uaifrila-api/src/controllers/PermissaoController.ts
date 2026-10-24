import { Request, Response } from 'express';
import { PermissaoRepository } from '../repositories/PermissaoRepository';

export class PermissaoController {
    private repo = new PermissaoRepository();

    public listarMatriz = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.body.usuario_is_admin) {
                res.status(403).json({ erro: 'Acesso restrito a administradores.' });
                return;
            }
            res.status(200).json(await this.repo.buscarRolesComPermissoes());
        } catch (error: any) {
            res.status(500).json({ erro: error.message });
        }
    };

    public atualizarVinculo = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.body.usuario_is_admin) {
                res.status(403).json({ erro: 'Acesso restrito.' });
                return;
            }
            const { roleId, permissaoId, associar } = req.body;
            await this.repo.sincronizarPermissao(Number(roleId), Number(permissaoId), Boolean(associar));
            res.status(200).json({ sucesso: true });
        } catch (error: any) {
            res.status(500).json({ erro: error.message });
        }
    };
}
