import { Request, Response } from 'express';
import { VagaService } from '../services/VagaService';

export class VagaController {
  private vagaService = new VagaService();

  public criar = async (req: any, res: Response): Promise<void> => {
    try {
      const contratanteId = req.user?.id || req.body.contratante_id;
      if (!contratanteId) { res.status(401).json({ erro: 'Não autenticado' }); return; }
      
      // LOG COMPLETO DO QUE FRONTEND ENVIOU
      console.log('\n=== [CTRL criar] FRONTEND PAYLOAD ===');
      console.log('data_inicio:', req.body.data_inicio);
      console.log('data_fim:', req.body.data_fim);
      console.log('timezone:', req.body.timezone);
      console.log('data_inicio_local:', req.body.data_inicio_local);
      console.log('Body completo:', JSON.stringify(req.body, null, 2));
      console.log('===================================\n');
      
      if (!req.body.timezone) {
        console.warn('[CTRL criar] ⚠️ ATENÇÃO: Frontend NÃO enviou timezone! Vai usar UTC direto ou fallback BRT');
      }
      
      const vaga = await this.vagaService.criar({ contratante_id: contratanteId, ...req.body });
      console.log('[CTRL criar] Retorno banco UTC 0:', vaga?.data_inicio);
      res.status(201).json({ sucesso: true, vaga });
    } catch (e: any) { console.error('Erro criar vaga:', e); res.status(500).json({ erro: e.message }); }
  };

  public criarVaga = async (req: any, res: Response): Promise<void> => { return this.criar(req, res); };

  public buscarPorId = async (req: any, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) { res.status(400).json({ erro: 'ID inválido' }); return; }
      const vaga = await this.vagaService.buscarPorId(id);
      if (!vaga) { res.status(404).json({ erro: 'Vaga não encontrada' }); return; }
      res.json({ vaga });
    } catch (e: any) { res.status(500).json({ erro: e.message }); }
  };

  public minhasPublicadas = async (req: any, res: Response): Promise<void> => {
    try {
      const usuarioId = req.user?.id;
      if (!usuarioId) { res.status(401).json({ erro: 'Não autenticado' }); return; }
      const vagas = await this.vagaService.listarPorContratante(usuarioId);
      res.json({ vagas });
    } catch (e: any) { res.status(500).json({ erro: e.message }); }
  };

  public atualizar = async (req: any, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const usuarioId = req.user?.id;
      if (isNaN(id)) { res.status(400).json({ erro: 'ID inválido' }); return; }
      if (!usuarioId) { res.status(401).json({ erro: 'Não autenticado' }); return; }

      console.log('\n=== [CTRL atualizar] FRONTEND PAYLOAD ===');
      console.log('data_inicio:', req.body.data_inicio);
      console.log('timezone:', req.body.timezone);
      console.log('data_inicio_local:', req.body.data_inicio_local);
      console.log('Body completo:', JSON.stringify(req.body, null, 2));
      console.log('===================================\n');

      if (!req.body.timezone) {
        console.warn('[CTRL atualizar] ⚠️ Frontend NÃO enviou timezone!');
      }

      const vagaExistente = await this.vagaService.buscarPorId(id);
      if (!vagaExistente) { res.status(404).json({ erro: 'Vaga não encontrada' }); return; }
      const isSuperAdmin = req.user?.tipo_chave === 'SUPER_ADMIN' || req.user?.nivel_permissao >= 100 || req.user?.email === 'uaifrila@gmail.com';
      if (vagaExistente.contratante_id !== usuarioId && !isSuperAdmin) { res.status(403).json({ erro: 'Sem permissão' }); return; }
      if (vagaExistente.status === 'CANCELADA') { res.status(400).json({ erro: 'Vaga cancelada' }); return; }
      const vagaAtualizada = await this.vagaService.atualizar(id, req.body);
      console.log('[CTRL atualizar] Novo UTC 0:', vagaAtualizada?.data_inicio);
      res.json({ sucesso: true, vaga: vagaAtualizada });
    } catch (e: any) { console.error('Erro atualizar:', e); res.status(500).json({ erro: e.message }); }
  };

  public cancelar = async (req: any, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const usuarioId = req.user?.id;
      if (isNaN(id)) { res.status(400).json({ erro: 'ID inválido' }); return; }
      if (!usuarioId) { res.status(401).json({ erro: 'Não autenticado' }); return; }
      const vagaExistente = await this.vagaService.buscarPorId(id);
      if (!vagaExistente) { res.status(404).json({ erro: 'Vaga não encontrada' }); return; }
      const isSuperAdmin = req.user?.tipo_chave === 'SUPER_ADMIN' || req.user?.nivel_permissao >= 100 || req.user?.email === 'uaifrila@gmail.com';
      if (vagaExistente.contratante_id !== usuarioId && !isSuperAdmin) { res.status(403).json({ erro: 'Sem permissão' }); return; }
      const vagaCancelada = await this.vagaService.cancelar(id);
      res.json({ sucesso: true, vaga: vagaCancelada });
    } catch (e: any) { res.status(500).json({ erro: e.message }); }
  };
  public deletar = async (req: any, res: Response): Promise<void> => { return this.cancelar(req, res); };
  public listar = async (req: any, res: Response): Promise<void> => {
    try { const vagas = await this.vagaService.listar(req.query); res.json({ vagas }); }
    catch (e: any) { res.status(500).json({ erro: e.message }); }
  };
}
