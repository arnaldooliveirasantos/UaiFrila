import { Request, Response } from 'express';
import { VagaRepository } from '../repositories/VagaRepository';

export class EnderecoVagaController {
  private repo = new VagaRepository();

  public listar = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuario = (req as any).usuario || (req as any).user;
      const contratanteId = usuario.id || usuario.usuario_id;
      // Busca endereços das vagas do contratante
      const enderecos = await this.repo.listarVagasPorContratante(contratanteId).then(vagas => 
        vagas.map((v: any) => ({
          id: v.endereco_vaga_id || v.id,
          vaga_id: v.id,
          endereco_completo: v.endereco_completo,
          bairro: v.bairro || v.endereco_bairro,
          cidade_id: v.cidade_id,
          cidade_nome: v.cidade_nome,
          estado: v.estado,
          is_ativo: true,
          vaga_titulo: v.titulo
        })).filter((e: any) => e.endereco_completo)
      );
      res.status(200).json({ sucesso: true, enderecos });
    } catch (e: any) {
      console.error('[EnderecoVagaController.listar] Erro:', e.message);
      res.status(500).json({ erro: e.message });
    }
  };

  public buscarPorId = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const endereco = await this.repo.buscarEnderecoPorVagaId(id) || await this.repo.buscarPorId(id).then((v: any) => v ? { id: v.endereco_vaga_id, vaga_id: v.id, endereco_completo: v.endereco_completo, bairro: v.endereco_bairro, cidade_id: v.cidade_id, cidade_nome: v.cidade_nome, estado: v.estado } : null);
      if (!endereco) {
        res.status(404).json({ erro: 'Endereço não encontrado' });
        return;
      }
      res.status(200).json({ sucesso: true, endereco });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };

  public criar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { vaga_id, endereco_completo, bairro, cidade_id, cidade_nome, estado, lat, lng } = req.body;
      if (!endereco_completo || !cidade_nome) {
        res.status(400).json({ erro: 'endereco_completo e cidade_nome obrigatórios' });
        return;
      }
      if (!vaga_id) {
        res.status(400).json({ erro: 'vaga_id obrigatório' });
        return;
      }
      const endereco = await this.repo.criarEnderecoVaga({
        vaga_id: parseInt(vaga_id),
        endereco_completo,
        bairro,
        cidade_id,
        cidade_nome,
        estado,
        lat,
        lng
      });
      res.status(201).json({ sucesso: true, endereco });
    } catch (e: any) {
      res.status(500).json({ erro: e.message });
    }
  };
}
