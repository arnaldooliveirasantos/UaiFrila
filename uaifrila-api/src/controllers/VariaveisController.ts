import { Request, Response } from 'express';

export class VariaveisController {
  public listar = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json({ sucesso: true, variaveis: [
        { id: 1, chave: 'VALOR_MINIMO_VAGA', valor: '75', valor_numerico: '75', tipo: 'NUMERIC', descricao: 'Valor minimo vaga' },
        { id: 2, chave: 'TAXA_PIX_PERCENTUAL', valor: '1', valor_numerico: '1', tipo: 'PERCENTUAL', descricao: 'Taxa PIX' },
        { id: 3, chave: 'TAXA_CARTAO_PERCENTUAL', valor: '4', valor_numerico: '4', tipo: 'PERCENTUAL', descricao: 'Taxa cartao' },
        { id: 4, chave: 'COMISSAO_APLICATIVO', valor: '10', valor_numerico: '10', tipo: 'PERCENTUAL', descricao: 'Comissao app' },
        { id: 5, chave: 'VAGA_ANTECEDENCIA_MINUTOS', valor: '30', valor_numerico: '30', tipo: 'INTEGER', descricao: 'Antecedencia minima' },
      ]});
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };
}
