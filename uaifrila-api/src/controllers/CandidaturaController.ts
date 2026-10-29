
import { Request, Response } from 'express';
import { CandidaturaRepository } from '../repositories/CandidaturaRepository';

export class CandidaturaController {
  private repo = new CandidaturaRepository();

  candidatar = async (req:Request, res:Response)=>{
    try{
      const usuario = (req as any).usuario;
      const { vaga_id, mensagem } = req.body;
      const id = Number(vaga_id || req.params.id);
      if(!id) { res.status(400).json({ erro:'vaga_id obrigatório' }); return; }
      const cand = await this.repo.candidatar(id, usuario.id, mensagem);
      res.json({ sucesso:true, candidatura:cand });
    }catch(e:any){ res.status(400).json({ erro:e.message }); }
  };

  listarPorVaga = async (req:Request, res:Response)=>{
    try{
      const vagaId = Number(req.params.id);
      const lista = await this.repo.listarPorVaga(vagaId);
      res.json({ sucesso:true, candidaturas:lista });
    }catch(e:any){ res.status(500).json({ erro:e.message }); }
  };

  aceitar = async (req:Request, res:Response)=>{
    try{
      const usuario = (req as any).usuario;
      const vagaId = Number(req.params.id);
      const candidaturaId = Number(req.params.candidaturaId);
      const trampo = await this.repo.aceitarCandidatura(vagaId, candidaturaId, usuario.id);
      res.json({ sucesso:true, trampo });
    }catch(e:any){ res.status(400).json({ erro:e.message }); }
  };
}
