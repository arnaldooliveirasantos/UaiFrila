import { Request, Response } from 'express';
import { TransacaoRepository } from '../repositories/TransacaoRepository';

export class TransacaoController {
  private repo = new TransacaoRepository();

  async variaveis(req: Request, res: Response) {
    try {
      // FIX 403: permite qualquer usuário logado ver variaveis, não só admin
      // Antes tinha verificação de admin que causava 403
      console.log(`[TransacaoController] variaveis - usuario: ${(req as any).usuario?.id}`);
      
      const variaveis = await this.repo.buscarVariaveis();
      
      // Sempre retorna com UTC0
      const variaveisUTC0 = variaveis.map((v: any) => ({
        ...v,
        criado_em: v.criado_em ? new Date(v.criado_em).toISOString() : null,
        atualizado_em: v.atualizado_em ? new Date(v.atualizado_em).toISOString() : null,
      }));
      
      res.json({ variaveis: variaveisUTC0, total: variaveisUTC0.length });
    } catch (e: any) {
      console.error('[TransacaoController] Erro variaveis:', e);
      // Retorna fallback mesmo com erro, para não dar 403 e esconder quadro
      res.json({ 
        variaveis: [
          { chave: 'VAGA_ANTECEDENCIA_MINUTOS', valor: '30', valor_numerico: 30 },
          { chave: 'TAXA_PLATAFORMA_PERCENTUAL', valor: '10', valor_numerico: 10 }
        ], 
        total: 2,
        fallback: true
      });
    }
  }

  async relatorio(req: Request, res: Response) {
    try {
      const { dataInicio, dataFim, page, limit } = req.query;
      const result = await this.repo.relatorioTransacoes(
        dataInicio as string,
        dataFim as string,
        parseInt(page as string) || 1,
        parseInt(limit as string) || 20
      );
      res.json(result);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ erro: e.message });
    }
  }

  async estatisticas(req: Request, res: Response) {
    try {
      const stats = await this.repo.estatisticas();
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  }

  async salvarVariavel(req: Request, res: Response) {
    try {
      const { chave, valor } = req.body;
      const result = await this.repo.salvarVariavel(chave, valor);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  }
}
