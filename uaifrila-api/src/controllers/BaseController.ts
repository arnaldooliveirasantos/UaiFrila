import { Request, Response } from 'express';

export abstract class BaseController {
  
  // Resposta de sucesso padronizada
  protected sucesso(res: Response, dados: any, status = 200, mensagem?: string): void {
    const payload: any = { sucesso: true, ...dados };
    if (mensagem) payload.mensagem = mensagem;
    res.status(status).json(payload);
  }

  // Resposta com lista
  protected sucessoLista(res: Response, lista: any[], nomeLista = 'dados'): void {
    res.status(200).json({ sucesso: true, [nomeLista]: lista, total: lista.length });
  }

  // Resposta com item único
  protected sucessoItem(res: Response, item: any, nomeItem = 'item'): void {
    if (!item) {
      this.erroNaoEncontrado(res);
      return;
    }
    res.status(200).json({ sucesso: true, [nomeItem]: item });
  }

  // Criação
  protected criado(res: Response, dados: any, nomeItem = 'item'): void {
    res.status(201).json({ sucesso: true, [nomeItem]: dados });
  }

  // Erros padronizados
  protected erro(res: Response, mensagem: string, status = 500, detalhes?: any): void {
    console.error(`[${this.constructor.name}] Erro ${status}: ${mensagem}`, detalhes || '');
    res.status(status).json({ sucesso: false, erro: mensagem, detalhes });
  }

  protected erroValidacao(res: Response, mensagem: string): void {
    this.erro(res, mensagem, 400);
  }

  protected erroNaoEncontrado(res: Response, mensagem = 'Recurso não encontrado'): void {
    this.erro(res, mensagem, 404);
  }

  protected erroNaoAutorizado(res: Response, mensagem = 'Não autorizado'): void {
    this.erro(res, mensagem, 401);
  }

  protected erroInterno(res: Response, e: any): void {
    const msg = e?.message || 'Erro interno';
    this.erro(res, msg, 500);
  }

  // Pega usuário do token
  protected getUsuario(req: Request): any {
    return (req as any).usuario || (req as any).user || null;
  }

  protected getUsuarioId(req: Request): number {
    const u = this.getUsuario(req);
    return u?.id || u?.usuario_id || 0;
  }

  // Wrapper para try/catch automático
  protected async executar(res: Response, fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (e: any) {
      console.error(`[${this.constructor.name}] Exceção:`, e);
      if (e.message?.includes('obrigatór') || e.message?.includes('obrigat')) {
        this.erroValidacao(res, e.message);
      } else if (e.message?.includes('não encontrado') || e.message?.includes('not found')) {
        this.erroNaoEncontrado(res, e.message);
      } else {
        this.erroInterno(res, e);
      }
    }
  }
}
