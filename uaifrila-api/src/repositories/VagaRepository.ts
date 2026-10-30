
import { BaseRepository } from './BaseRepository';

export class VagaRepository extends BaseRepository {
  async criar(dados: any, contratanteId?: number) {
    const pool = (this as any).pool || (BaseRepository as any).getPool();
    if (!pool) throw new Error('Pool não configurado');
    const contratante = contratanteId || dados.contratante_id || dados.contratanteId;
    const rows = await pool.query(
      `INSERT INTO vagas (contratante_id, titulo, descricao, funcao, valor_hora, valor_servico, valor_transporte, total_freela, data_inicio, data_fim, cidade_id, cidade_nome, endereco_completo, bairro, status, criado_em)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'ABERTA',NOW()) RETURNING *`,
      [contratante, dados.titulo, dados.descricao, dados.funcao||'Garçom', dados.valor_hora||20, dados.valor_servico||100, dados.valor_transporte||0, dados.total_freela||100, dados.data_inicio, dados.data_fim, dados.cidade_id||1, dados.cidade_nome||'Uberlândia', dados.endereco_completo, dados.bairro]
    );
    return rows.rows[0];
  }
  async criarVaga(dados: any) { return await this.criar(dados, dados.contratante_id); }
  async criarEnderecoVaga(dados: any) {
    const pool = (this as any).pool || (BaseRepository as any).getPool();
    if (!pool) throw new Error('Pool não configurado');
    const rows = await pool.query(
      `INSERT INTO enderecos_Vaga (vaga_id, endereco_completo, bairro, cidade_id, cidade_nome, estado, lat, lng, is_ativo, criado_em)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,NOW()) RETURNING *`,
      [dados.vaga_id, dados.endereco_completo, dados.bairro, dados.cidade_id, dados.cidade_nome, dados.estado||'MG', dados.lat, dados.lng]
    );
    return rows.rows[0];
  }
  async buscarPorId(id: number) {
    return await this.queryOne('SELECT * FROM vagas WHERE id=$1', [id]);
  }
  async listarPorContratante(contratanteId: number) {
    return await this.query('SELECT * FROM vagas WHERE contratante_id=$1 ORDER BY criado_em DESC', [contratanteId]);
  }
  async listarVagasPorContratante(contratanteId: number) {
    return await this.listarPorContratante(contratanteId);
  }
  async listarTodas(filtros?: any) {
    return await this.query('SELECT * FROM vagas WHERE status!=\'CANCELADA\' ORDER BY criado_em DESC LIMIT 100');
  }
  async buscarMural(usuarioId?: number, page=1, limit=20) {
    const offset = (page-1)*limit;
    return await this.query('SELECT * FROM vagas WHERE status=\'ABERTA\' ORDER BY criado_em DESC LIMIT $1 OFFSET $2', [limit, offset]);
  }
  async atualizar(id: number, dados: any, usuarioId?: number) {
    const pool = (this as any).pool || (BaseRepository as any).getPool();
    if (!pool) throw new Error('Pool não configurado');
    const rows = await pool.query('UPDATE vagas SET titulo=COALESCE($2,titulo), descricao=COALESCE($3,descricao), atualizado_em=NOW() WHERE id=$1 RETURNING *', [id, dados.titulo, dados.descricao]);
    return rows.rows[0];
  }
  async atualizarVaga(id: number, dados: any) { return await this.atualizar(id, dados); }
  async cancelar(id: number, usuarioId?: number) {
    const pool = (this as any).pool || (BaseRepository as any).getPool();
    if (!pool) throw new Error('Pool não configurado');
    await pool.query("UPDATE vagas SET status='CANCELADA', atualizado_em=NOW() WHERE id=$1", [id]);
    return true;
  }
  async cancelarVaga(id: number) { return await this.cancelar(id); }
  async buscarEnderecoPorVagaId(vagaId: number) {
    const rows = await this.query('SELECT * FROM enderecos_Vaga WHERE vaga_id=$1 AND is_ativo=true LIMIT 1', [vagaId]);
    return rows[0] || null;
  }
  async atualizarEnderecoVaga(vagaId: number, dados: any) {
    const pool = (this as any).pool || (BaseRepository as any).getPool();
    if (!pool) throw new Error('Pool não configurado');
    const rows = await pool.query('UPDATE enderecos_Vaga SET endereco_completo=$2, atualizado_em=NOW() WHERE vaga_id=$1 RETURNING *', [vagaId, dados.endereco_completo]);
    return rows.rows[0] || null;
  }
}
