
import { BaseRepository } from './BaseRepository';

export class VariavelRepository extends BaseRepository {
  async listarTodas() {
    return await this.query(`SELECT chave, valor, valor_numerico, tipo, descricao, categoria, editavel FROM variaveis_sistema ORDER BY categoria, chave`);
  }

  async buscarPorChave(chave: string) {
    return await this.queryOne(`SELECT * FROM variaveis_sistema WHERE chave=$1`, [chave]);
  }

  async atualizar(chave: string, valor: string, valorNumerico?: number) {
    return await this.query(`UPDATE variaveis_sistema SET valor=$1, valor_numerico=$2, atualizado_em=NOW() WHERE chave=$3 RETURNING *`, [valor, valorNumerico, chave]);
  }
}
