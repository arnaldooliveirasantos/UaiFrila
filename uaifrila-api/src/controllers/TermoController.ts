import { Request, Response } from 'express';
import { TermoRepository } from '../repositories/TermoRepository';

export class TermoController {
    private repo = new TermoRepository();

    public obterTermoVigente = async (req: Request, res: Response): Promise<void> => {
        try {
            const { tipoId } = req.params;
            
            // Tratamento estrito contra strings inválidas ou estouro de NaN de rede
            const idNumerico = Number(tipoId);
            if (!idNumerico || isNaN(idNumerico)) {
                res.status(200).json([]); // Retorna array vazio em vez de estourar erro 500 no banco
                return;
            }

            const dados = await this.repo.buscarTermoAtivoPorPerfil(idNumerico);
            res.status(200).json(dados);
        } catch (error: any) {
            res.status(500).json({ erro: error.message });
        }
    };

    public salvarNovaVersaoTermo = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.body.usuario_is_admin) {
                res.status(403).json({ erro: 'Acesso restrito ao Super Admin.' });
                return;
            }

            const { tipo_usuario_id, itens } = req.body;

            await this.repo.desativarTermoAnterior(Number(tipo_usuario_id));
            const proximaVersao = await this.repo.obterProximaVersao(Number(tipo_usuario_id));
            
            const novoTermoObj = await this.repo.criarNovoTermoPai(proximaVersao, Number(tipo_usuario_id));
            const novoTermoId = novoTermoObj.id;

            for (let i = 0; i < itens.length; i++) {
                await this.repo.salvarItemDoTermo(novoTermoId, itens[i].texto_item, i + 1);
            }

            res.status(201).json({ sucesso: true, mensagem: `Nova versão V\${proximaVersao} salva com sucesso.` });
        } catch (error: any) {
            res.status(500).json({ erro: error.message });
        }
    };
}
