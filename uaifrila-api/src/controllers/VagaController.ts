
import { Request, Response } from 'express';
import { VagaRepository } from '../repositories/VagaRepository';

export class VagaController {
  private repo = new VagaRepository();

  criar = async (req: Request, res: Response) => {
    try{
      const usuario = (req as any).usuario;
      const { titulo, descricao, funcao, valor_hora, valor_servico, valor_transporte, total_freela, data_inicio, data_fim, endereco_completo, bairro, cidade_id, cidade_nome, estado, lat, lng, numero, cep, meio_pagamento, timezone } = req.body;
      
      if(!titulo || !data_inicio || !data_fim){
        res.status(400).json({ erro: 'titulo, data_inicio e data_fim obrigatórios' });
        return;
      }

      const vaga = await this.repo.criarVaga({
        contratante_id: usuario.id,
        titulo, descricao, funcao,
        valor_hora, valor_servico, valor_transporte, total_freela,
        data_inicio, data_fim,
        timezone: timezone || 'America/Sao_Paulo',
        meio_pagamento,
        endereco_completo, bairro, cidade_id, cidade_nome, estado, lat, lng, numero, cep
      });
      res.status(201).json({ sucesso:true, vaga });
    }catch(e:any){ console.error('[criar]', e.message); res.status(500).json({ erro:e.message }); }
  };

  listarPorContratante = async (req: Request, res: Response) => {
    try{
      const usuario = (req as any).usuario;
      const vagas = await this.repo.listarVagasPorContratante(usuario.id);
      res.json({ sucesso:true, vagas });
    }catch(e:any){ res.status(500).json({ erro:e.message }); }
  };

  minhasPublicadas = async (req: Request, res: Response) => { return this.listarPorContratante(req,res); };

  mural = async (req: Request, res: Response) => {
    try{
      const usuario = (req as any).usuario;
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);
      const vagas = await this.repo.buscarMuralSemBloqueiosDeAvaliacao(usuario.id, page, limit);
      res.json({ sucesso:true, vagas, mural: vagas });
    }catch(e:any){ res.status(500).json({ erro:e.message }); }
  };

  buscarPorId = async (req: Request, res: Response) => {
    try{
      const vaga = await this.repo.buscarPorId(Number(req.params.id));
      if(!vaga){ res.status(404).json({ erro:'Vaga não encontrada' }); return; }
      res.json({ sucesso:true, vaga });
    }catch(e:any){ res.status(500).json({ erro:e.message }); }
  };

  atualizar = async (req: Request, res: Response) => {
    try{
      const vaga = await this.repo.atualizarVaga(Number(req.params.id), req.body);
      res.json({ sucesso:true, vaga });
    }catch(e:any){ res.status(500).json({ erro:e.message }); }
  };

  cancelar = async (req: Request, res: Response) => {
    try{ await this.repo.cancelarVaga(Number(req.params.id)); res.json({ sucesso:true }); }
    catch(e:any){ res.status(500).json({ erro:e.message }); }
  };
}
