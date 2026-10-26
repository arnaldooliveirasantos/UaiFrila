import { BaseRepository } from './BaseRepository';

export class VariavelRepository extends BaseRepository {

  async listarTodas(): Promise<any[]> {
    return await this.query('SELECT * FROM variaveis_sistema ORDER BY categoria, chave');
  }

  async listarPorCategoria(categoria: string): Promise<any[]> {
    return await this.query('SELECT * FROM variaveis_sistema WHERE categoria = $1 ORDER BY chave', [categoria]);
  }

  async buscarPorChave(chave: string): Promise<any> {
    const rows = await this.query('SELECT * FROM variaveis_sistema WHERE chave = $1', [chave.toUpperCase()]);
    return rows[0] || null;
  }

  async atualizar(chave: string, valor: string, valorNumerico?: number): Promise<any> {
    const rows = await this.query(
      'UPDATE variaveis_sistema SET valor = $1, valor_numerico = $2, atualizado_em = NOW() WHERE chave = $3 RETURNING *',
      [valor, valorNumerico || null, chave.toUpperCase()]
    );
    return rows[0];
  }

  async criarOuAtualizar(chave: string, valor: string, descricao?: string, categoria: string = 'geral', tipo: string = 'string'): Promise<any> {
    const num = parseFloat(valor);
    const valorNum = isNaN(num) ? null : num;
    const rows = await this.query(
      `INSERT INTO variaveis_sistema (chave, valor, valor_numerico, descricao, categoria, tipo)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, valor_numerico = EXCLUDED.valor_numerico, atualizado_em = NOW()
       RETURNING *`,
      [chave.toUpperCase(), valor, valorNum, descricao, categoria, tipo]
    );
    return rows[0];
  }

  // Helpers específicos
  async obterTempoExpiracaoEmail(): Promise<number> {
    const v = await this.buscarPorChave('EMAIL_EXPIRACAO_MINUTOS');
    return parseInt(v?.valor_numerico || v?.valor || '5');
  }

  async obterTaxaIntermediacao(): Promise<number> {
    const v = await this.buscarPorChave('TAXA_INTERMEDIACAO_PERCENTUAL');
    return parseFloat(v?.valor_numerico || v?.valor || '15');
  }
}
