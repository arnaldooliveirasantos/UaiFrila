import { EnderecoRepository } from '../repositories/EnderecoRepository';
import { EnderecoModel } from '../models/EnderecoModel';
export class EnderecoService {
  private repo = new EnderecoRepository();
  async listar(): Promise<EnderecoModel[]> { try { return await this.repo.buscarTodos(); } catch { return []; } }
  async listarPorUsuario(usuarioId: number): Promise<EnderecoModel[]> {
    const id = Number(usuarioId); if (!id || isNaN(id)) return [];
    try { return await this.repo.listarPorUsuario(id); } catch { return []; }
  }
  async buscarAtivoPorUsuario(usuarioId: number): Promise<EnderecoModel | null> {
    const id = Number(usuarioId); if (!id || isNaN(id)) return null;
    try { return await this.repo.buscarAtivoPorUsuario(id); } catch { return null; }
  }
  async buscarPorId(id: number): Promise<EnderecoModel> {
    const idNum = Number(id); if (!idNum || isNaN(idNum)) throw new Error('ID invalido');
    const e = await this.repo.buscarPorId(idNum); if (!e) throw new Error('Endereco nao encontrado'); return e;
  }
  async buscarCompletoPorId(id: number): Promise<EnderecoModel | null> {
    const idNum = Number(id); if (!idNum || isNaN(idNum)) return null;
    try { return await this.repo.buscarCompletoPorId(idNum); } catch { return await this.repo.buscarPorId(idNum); }
  }
  async buscarPorIdComRelacoes(id: number): Promise<EnderecoModel | null> { return await this.buscarCompletoPorId(id); }
  async criar(dados: any): Promise<EnderecoModel> {
    const usuarioId = Number(dados.usuarioId || dados.usuario_id); if (!usuarioId || isNaN(usuarioId)) throw new Error('usuario_id obrigatorio');
    const payload: any = { usuario_id: usuarioId, cidade_id: Number(dados.cidade_id || dados.cidadeId), logradouro: dados.logradouro, numero: dados.numero || null, bairro: dados.bairro || null, cep: dados.cep || null, complemento: dados.complemento || null, apelido: dados.apelido || 'Casa', tipo_endereco_id: Number(dados.tipo_endereco_id || dados.tipoEnderecoId || 1), ativo: Boolean(dados.ativo), latitude: dados.latitude || null, longitude: dados.longitude || null };
    if (!payload.cidade_id || isNaN(payload.cidade_id)) throw new Error('cidade_id obrigatorio');
    if (!payload.logradouro) throw new Error('logradouro obrigatorio');
    const criado = await this.repo.criarGenerico(payload);
    if (payload.ativo) { try { await this.repo.desativarOutrosAtivos(usuarioId, (criado as any).id); } catch {} }
    else { try { const outros = await this.listarPorUsuario(usuarioId); if (outros.length === 1) await this.repo.atualizarGenerico((criado as any).id, { ativo: true }); } catch {} }
    return criado;
  }
  // Fluxo de codigo: 1 endereco por usuario no cadastro — cria se nao existe, atualiza se ja existe.
  async criarOuAtualizarPorUsuario(usuarioId: number, end: any): Promise<EnderecoModel> {
    const payload: any = { usuario_id: usuarioId, cep: end.cep || null, logradouro: end.logradouro || end.endereco || '', numero: end.numero || null, complemento: end.complemento || null, bairro: end.bairro || null, cidade_id: Number(end.cidade_id), tipo_endereco_id: 1, latitude: end.latitude ?? end.lat ?? null, longitude: end.longitude ?? end.lng ?? null, apelido: end.apelido || 'Casa', ativo: true };
    if (payload.logradouro && (this.repo as any).constructor) { /* logradouro e a coluna real; se o banco usar 'endereco', o mapToDbColumns resolve */ }
    const existente = await this.repo.buscarPrimeiroPorUsuario(usuarioId);
    if (!existente) return await this.criar(payload);
    const { usuario_id, ...resto } = payload;
    const atualizado = await this.repo.atualizarGenerico((existente as any).id, resto);
    return (atualizado || existente) as EnderecoModel;
  }
  async atualizar(id: number, dados: any): Promise<EnderecoModel | null> {
    const idNum = Number(id); if (!idNum || isNaN(idNum)) throw new Error('ID invalido');
    const payload = { ...dados }; delete payload.usuario_id; delete payload.usuarioId; delete payload.estado_id;
    return await this.repo.atualizarGenerico(idNum, payload);
  }
  async definirAtivo(usuarioId: number, enderecoId: number): Promise<EnderecoModel | null> {
    const uid = Number(usuarioId); const eid = Number(enderecoId);
    if (!uid || isNaN(uid) || !eid || isNaN(eid)) throw new Error('IDs invalidos');
    const endereco: any = await this.repo.buscarPorId(eid); if (!endereco) throw new Error('Endereco nao encontrado');
    if (Number(endereco.usuario_id || endereco.usuarioId) !== uid) throw new Error('Acesso negado - endereco nao pertence ao usuario');
    await this.repo.desativarOutrosAtivos(uid, eid);
    return await this.repo.atualizarGenerico(eid, { ativo: true });
  }
  async deletar(id: number): Promise<boolean> {
    const idNum = Number(id); if (!idNum || isNaN(idNum)) throw new Error('ID invalido');
    return await this.repo.deletarPorId(idNum);
  }
  async deletarPorUsuario(usuarioId: number): Promise<void> { await this.repo.deletarPorUsuario(Number(usuarioId)); }
}
