import { Request, Response } from 'express';
import { MuralVagasService } from '../services/MuralVagasService';

export class MuralVagasController {
  private muralService = new MuralVagasService();
  
  public obterMural = async (req: any, res: Response): Promise<void> => {
    try {
      // Reutilização - pega usuarioId de múltiplas fontes (middleware seta req.user e req.usuarioId)
      const usuarioId = req.user?.id || req.usuarioId || req.body?.usuarioId || req.query?.usuarioId;
      const tipo = req.body?.tipo || req.query?.tipo || req.user?.tipo_chave || 'FREELA';
      const nivel = req.user?.nivel_permissao || 0;

      // Se não tem usuarioId mas é super admin ou tem token válido, permite com id 0 para ver tudo
      const idParaBusca = usuarioId ? Number(usuarioId) : 0;

      // Super admin vê tudo, sem filtro de bloqueio
      if (nivel >= 100 || (req.user?.tipo_chave || '').toUpperCase() === 'SUPER_ADMIN') {
        const dados = await this.muralService.listarVagasParaMural(idParaBusca, 'SUPER_ADMIN');
        res.json({ vagas: dados, mural: dados, data: dados });
        return;
      }

      if (!usuarioId && !req.user) {
        res.status(401).json({ erro: 'Não autenticado - token inválido ou expirado' });
        return;
      }

      const dados = await this.muralService.listarVagasParaMural(idParaBusca, tipo);
      // Retorna formato compatível com frontend
      res.json({ vagas: dados, mural: dados, data: dados });
    } catch (e: any) {
      console.error('Erro mural:', e);
      res.status(500).json({ erro: e.message });
    }
  };
}
