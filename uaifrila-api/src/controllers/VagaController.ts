import { Request, Response } from 'express';
import { VagaService } from '../services/VagaService';

export class VagaController {
  private service: VagaService;
  private vagaService: VagaService;
  constructor() { this.service = new VagaService(); this.vagaService = this.service; }

  // NOVO: Calculo 100% backend - usado pelo frontend para preview em tempo real
  calcularPreview = async (req: Request, res: Response) => {
    try {
      const { valor_servico, valor_transporte, data_inicio_local, data_fim_local, timezone, meio_pagamento } = req.body;
      
      if (!data_inicio_local || !data_fim_local) {
        res.status(400).json({ erro: 'data_inicio_local e data_fim_local obrigatórios (formato YYYY-MM-DDTHH:mm)' });
        return;
      }

      const repo = (this.service as any).repo || new (require('../repositories/VagaRepository').VagaRepository)();
      const calculo = await repo.calcularVaga({
        valor_servico: Number(valor_servico) || 0,
        valor_transporte: Number(valor_transporte) || 0,
        data_inicio_local,
        data_fim_local,
        timezone: timezone || 'America/Sao_Paulo',
        meio_pagamento: meio_pagamento || 'pix'
      });

      res.json({ sucesso: true, calculo });
    } catch (e:any) {
      console.error('[VagaController.calcularPreview] Erro:', e.message);
      res.status(400).json({ erro: e.message });
    }
  };

  criarVaga = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).usuario?.id;
      if (!usuarioId) {
        res.status(401).json({ erro: 'Não autenticado' });
        return;
      }

      // Frontend deve enviar data_inicio_local + timezone, não data_inicio em UTC
      // Compatibilidade: se enviou data_inicio (antigo), converte para local
      let payload = { ...req.body, contratante_id: usuarioId };

      // Compatibilidade com frontend antigo que mandava data_inicio em UTC
      if (payload.data_inicio && !payload.data_inicio_local) {
        // Tenta extrair local do campo
        try {
          const d = new Date(payload.data_inicio);
          payload.data_inicio_local = d.toISOString().slice(0,16);
          payload.timezone = payload.timezone || 'America/Sao_Paulo';
        } catch {}
      }

      // Valida campos obrigatórios que existem no banco vagas
      const obrigatorios = ['titulo','descricao','data_inicio_local','data_fim_local'];
      for (const campo of obrigatorios) {
        if (!payload[campo]) {
          res.status(400).json({ erro: `Campo obrigatório: ${campo}` });
          return;
        }
      }

      const vaga = await this.service.criarVaga(payload);
      res.json({ sucesso:true, vaga, calculo: (vaga as any)._calculo });
    } catch (e:any) { 
      console.error('[VagaController.criarVaga] Erro:', e.message, e.stack);
      res.status(400).json({ erro:e.message }); 
    }
  };

  criar = async (req: Request, res: Response) => { return await this.criarVaga(req,res); }

  listarVagasPorContratante = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).usuario?.id;
      const vagas = await this.service.listarVagasPorContratante(usuarioId);
      res.json({ sucesso:true, vagas });
    } catch (e:any) { res.status(500).json({ erro:e.message }); }
  };

  listarPorContratante = async (req: Request, res: Response) => { return await this.listarVagasPorContratante(req,res); }
  minhasPublicadas = async (req: Request, res: Response) => { return await this.listarVagasPorContratante(req,res); }

  buscarPorId = async (req: Request, res: Response) => {
    try {
      const vaga = await this.service.buscarPorId(Number(req.params.id));
      res.json({ sucesso:true, vaga });
    } catch (e:any) { res.status(404).json({ erro:e.message }); }
  };

  atualizarVaga = async (req: Request, res: Response) => {
    try {
      const vaga = await this.service.atualizarVaga(Number(req.params.id), req.body);
      res.json({ sucesso:true, vaga });
    } catch (e:any) { res.status(400).json({ erro:e.message }); }
  };
  atualizar = async (req: Request, res: Response) => { return await this.atualizarVaga(req,res); }

  cancelarVaga = async (req: Request, res: Response) => {
    try {
      await this.service.cancelarVaga(Number(req.params.id));
      res.json({ sucesso:true });
    } catch (e:any) { res.status(400).json({ erro:e.message }); }
  };
  cancelar = async (req: Request, res: Response) => { return await this.cancelarVaga(req,res); }
}
