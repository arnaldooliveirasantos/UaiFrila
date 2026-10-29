import { BaseRepository } from './BaseRepository';

export class CidadeRepository extends BaseRepository {
  async listarAtivas() {
    try {
      return await this.query(`SELECT id, nome, cidade_nome, estado, uf FROM cidades WHERE is_ativo = true OR is_ativo IS NULL ORDER BY nome ASC LIMIT 100`);
    } catch {
      // Fallback se tabela cidades não existir
      return [
        { id: 1, nome: 'Uberlândia', cidade_nome: 'Uberlândia', estado: 'MG', uf: 'MG' },
        { id: 2, nome: 'Anápolis', cidade_nome: 'Anápolis', estado: 'GO', uf: 'GO' },
        { id: 3, nome: 'Goiânia', cidade_nome: 'Goiânia', estado: 'GO', uf: 'GO' },
      ];
    }
  }
}
