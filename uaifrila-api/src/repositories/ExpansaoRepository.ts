
import { BaseRepository } from './BaseRepository';

export class ExpansaoRepository extends BaseRepository {
  async listarCidades() {
    return await this.query(`SELECT * FROM cidades ORDER BY ativa DESC, nome ASC`);
  }

  async listarCidadesAtivas() {
    return await this.query(`SELECT * FROM cidades WHERE ativa=true ORDER BY nome ASC`);
  }

  async listarSolicitacoes() {
    return await this.query(`SELECT * FROM expansao_cidades ORDER BY data_solicitacao DESC LIMIT 100`);
  }

  async solicitar(cidadeNome: string, estadoSigla: string, motivo: string, solicitadoPor?: number) {
    const existe = await this.query(
      `SELECT id FROM expansao_cidades WHERE LOWER(cidade_nome)=LOWER($1) AND estado_sigla=$2 AND status IN ('SOLICITADA','EM_ANALISE') LIMIT 1`,
      [cidadeNome, estadoSigla]
    );
    if (existe.length > 0) throw new Error('Já existe solicitação pendente para essa cidade');
    const res = await this.query(
      `INSERT INTO expansao_cidades (cidade_nome, estado_sigla, motivo, solicitado_por, status, demanda_solicitacoes, data_solicitacao)
       VALUES ($1,$2,$3,$4,'SOLICITADA',1,NOW()) RETURNING *`,
      [cidadeNome, estadoSigla, motivo, solicitadoPor]
    );
    return res[0];
  }
}
