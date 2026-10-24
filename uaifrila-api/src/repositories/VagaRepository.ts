import { BaseRepository } from './BaseRepository';

export class VagaRepository extends BaseRepository {
  async buscarMuralSemBloqueiosDeAvaliacao(usuarioId: number): Promise<any[]> {
    const sql = `SELECT v.* FROM vagas v WHERE v.status = 'PENDENTE' AND v.contratante_id NOT IN (SELECT avaliado_id FROM avaliacoes WHERE avaliador_id = $1 AND nota <= 2 UNION SELECT avaliador_id FROM avaliacoes WHERE avaliado_id = $1 AND nota <= 2)`;
    try { 
      return await this.query(sql, [usuarioId]); 
    } catch (e) { 
      console.log('Fallback mural sem bloqueios', (e as any).message);
      return await this.query(`SELECT * FROM vagas WHERE status = 'PENDENTE' LIMIT 20`); 
    }
  }
  async salvar(dados: any): Promise<any[]> {
    const sql = `INSERT INTO vagas (contratante_id, funcao, data_hora, horas_estimadas, valor_hora_limpo, ajuda_custo_transporte, endereco_completo, status) VALUES ($1,$2,$3,$4,$5,$6,$7,'PENDENTE') RETURNING *`;
    return await this.query(sql, [dados.contratanteId, dados.funcao, dados.dataHora, dados.horasEstimadas, dados.valorHoraLimpo, dados.ajudaCustoTransporte, dados.enderecoCompleto]);
  }
}