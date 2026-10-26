import { Request, Response } from 'express';
import { AuthRepository } from '../repositories/AuthRepository';
import { CidadeRepository } from '../repositories/CidadeRepository';

export class CidadeController {
  private authRepo = new AuthRepository();
  private cidadeRepo = new CidadeRepository();

  public listarAtivas = async (req: Request, res: Response): Promise<void> => {
    try {
      const cidades = await this.cidadeRepo.buscarAtivas();
      res.status(200).json({ sucesso: true, cidades, total: cidades.length, tabela: 'cidades' });
    } catch (e:any) {
      // fallback para AuthRepository
      try {
        const cidades = await this.authRepo.buscarCidadesAtivas();
        res.status(200).json({ sucesso: true, cidades, fallback: true });
      } catch {
        res.status(500).json({ erro: e.message, cidades: [{ id: 1, nome: 'Uberlândia', estado: 'MG' }] });
      }
    }
  };

  public listarGeografia = async (req: Request, res: Response): Promise<void> => {
    try {
      const cidades = await this.cidadeRepo.buscarTodasComHierarquia();
      res.status(200).json({ sucesso: true, cidades });
    } catch (e:any) {
      res.status(500).json({ erro: e.message });
    }
  };

  public atualizarStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const { ativa, ativo } = req.body;
      const status = ativa ?? ativo;
      const cidade = await this.cidadeRepo.atualizarStatus(id, !!status);
      res.status(200).json({ sucesso: true, cidade });
    } catch (e:any) {
      res.status(500).json({ erro: e.message });
    }
  };

  public validarEndereco = async (req: Request, res: Response): Promise<void> => {
    try {
      const { cidade, lat, lng } = req.body;
      if (!cidade) { res.status(400).json({ erro: 'Cidade obrigatória' }); return; }
      const cidades = await this.cidadeRepo.buscarAtivas();
      const existe = cidades.some((c:any) => c.nome.toLowerCase() === cidade.toLowerCase());
      if (!existe) {
        res.status(400).json({ valido: false, erro: `Cidade ${cidade} não está ativa. Cidades ativas: ${cidades.map((c:any)=>c.nome).join(', ')}` });
        return;
      }
      if (lat && lng) {
        const valido = await this.authRepo.validarEnderecoNaCidadeAtiva(cidade, Number(lat), Number(lng));
        if (!valido) {
          res.status(400).json({ valido: false, erro: 'Endereço fora do raio da cidade ativa' });
          return;
        }
      }
      res.status(200).json({ valido: true, mensagem: 'Endereço dentro da cidade ativa (tabela cidades)' });
    } catch (e:any) {
      res.status(500).json({ erro: e.message });
    }
  };
}