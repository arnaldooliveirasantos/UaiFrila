import { EnderecoRepository } from '../repositories/EnderecoRepository';
import { EnderecoModel } from '../models/EnderecoModel';
import { CidadeRepository } from '../repositories/CidadeRepository';
import { EstadoRepository } from '../repositories/EstadoRepository';
import { geocodificarEndereco } from './GeocodificacaoService';
// listarBrutosPorUsuario e o metodo usado pelo AuthController.me (linhas cruas snake_case).
// Os demais metodos sao os mesmos da entrega 2.
export class EnderecoService {
  private repo = new EnderecoRepository();
  async listar(): Promise<EnderecoModel[]> { try { return await this.repo.buscarTodos(); } catch { return []; } }
  async listarBrutosPorUsuario(usuarioId: number): Promise<any[]> {
    const id = Number(usuarioId); if (!id || isNaN(id)) return [];
    try { return await this.repo.listarBrutosPorUsuario(id); } catch { return []; }
  }
  async listarPorUsuario(usuarioId: number): Promise<EnderecoModel[]> {
    const id = Number(usuarioId); if (!id || isNaN(id)) return [];
    try { return await this.repo.listarPorUsuario(id); } catch { return []; }
  }
  // Fonte unica do cidade do endereco: o JOIN com cidades (listarBrutosPorUsuario).
  // O front le end.cidade.estadoId — direto, sem fallback, sem cadeia de alternativas.
  async listarPorUsuarioComCidade(usuarioId: number): Promise<any[]> {
    const rows = await this.listarBrutosPorUsuario(usuarioId);
    return rows.map((e: any) => ({
      ...e,
      cidade: { id: e.cidade_id, nome: e.cidade_nome, estado: e.cidade_estado_sigla, estadoId: e.estado_id },
    }));
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
  // Coordenadas: se o front nao mandou lat/lng (CadastroEndereco nunca manda),
  // geocodifica pelo endereco completo via Nominatim. GeocodificacaoService
  // NUNCA quebra o salvamento: sem resultado, salva sem coordenadas (como era antes).
  // Cidade/estado vem do banco (cidade_id), nao do que o front digitou.
  private async resolverCoordenadas(dados: any): Promise<{ latitude: number; longitude: number } | null> {
    const lat = Number(dados.latitude ?? dados.lat);
    const lng = Number(dados.longitude ?? dados.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) return { latitude: lat, longitude: lng };
    try {
      const cidadeId = Number(dados.cidade_id ?? dados.cidadeId);
      let cidadeNome = dados.cidade_nome || dados.cidade || '';
      let estadoSigla = dados.estado_sigla || dados.estado || '';
      if (cidadeId) {
        try {
          const cidade: any = await new CidadeRepository().buscarPorId(cidadeId);
          if (cidade) {
            cidadeNome = cidade.nome || cidadeNome;
            const estadoId = Number(cidade.estado_id ?? cidade.estadoId);
            if (estadoId && !estadoSigla) {
              try { const estado: any = await new EstadoRepository().buscarPorId(estadoId); estadoSigla = estado?.sigla || ''; } catch {}
            }
          }
        } catch {}
      }
      return await geocodificarEndereco({ logradouro: dados.logradouro, numero: dados.numero, bairro: dados.bairro, cidade: cidadeNome, estado: estadoSigla, cep: dados.cep });
    } catch { return null; }
  }
  async criar(dados: any): Promise<EnderecoModel> {
    const usuarioId = Number(dados.usuarioId || dados.usuario_id); if (!usuarioId || isNaN(usuarioId)) throw new Error('usuario_id obrigatorio');
    const coords = await this.resolverCoordenadas(dados);
    const payload: any = { usuario_id: usuarioId, cidade_id: Number(dados.cidade_id || dados.cidadeId), logradouro: dados.logradouro, numero: dados.numero || null, bairro: dados.bairro || null, cep: dados.cep || null, complemento: dados.complemento || null, apelido: dados.apelido || 'Casa', tipo_endereco_id: Number(dados.tipo_endereco_id || dados.tipoEnderecoId || 1), ativo: Boolean(dados.ativo), latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null };
    if (!payload.cidade_id || isNaN(payload.cidade_id)) throw new Error('cidade_id obrigatorio');
    if (!payload.logradouro) throw new Error('logradouro obrigatorio');
    const criado = await this.repo.criarGenerico(payload);
    if (payload.ativo) { try { await this.repo.desativarOutrosAtivos(usuarioId, (criado as any).id); } catch {} }
    else { try { const outros = await this.listarPorUsuario(usuarioId); if (outros.length === 1) await this.repo.atualizarGenerico((criado as any).id, { ativo: true }); } catch {} }
    return criado;
  }
  async criarOuAtualizarPorUsuario(usuarioId: number, end: any): Promise<EnderecoModel> {
    const payload: any = { usuario_id: usuarioId, cep: end.cep || null, logradouro: end.logradouro || end.endereco || '', numero: end.numero || null, complemento: end.complemento || null, bairro: end.bairro || null, cidade_id: Number(end.cidade_id), tipo_endereco_id: 1, latitude: end.latitude ?? end.lat ?? null, longitude: end.longitude ?? end.lng ?? null, apelido: end.apelido || 'Casa', ativo: true };
    const existente = await this.repo.buscarPrimeiroPorUsuario(usuarioId);
    if (!existente) return await this.criar(payload);
    const { usuario_id, ...resto } = payload;
    // Via this.atualizar (nao repo direto): assim endereco sem coordenadas ou com
    // endereco alterado tambem e geocodificado na atualizacao.
    const atualizado = await this.atualizar((existente as any).id, resto);
    return (atualizado || existente) as EnderecoModel;
  }
  async atualizar(id: number, dados: any): Promise<EnderecoModel | null> {
    const idNum = Number(id); if (!idNum || isNaN(idNum)) throw new Error('ID invalido');
    const payload = { ...dados }; delete payload.usuario_id; delete payload.usuarioId; delete payload.estado_id;
    const existente: any = await this.repo.buscarPorId(idNum);
    const lat = Number(payload.latitude ?? payload.lat);
    const lng = Number(payload.longitude ?? payload.lng);
    const coordsValidas = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
    if (coordsValidas) {
      payload.latitude = lat; payload.longitude = lng;
    } else {
      // Sem coords no payload: preserva as existentes, a menos que o endereco
      // tenha mudado ou o existente nao tenha coords -> ai re-geocodifica.
      const normaliza = (v: any) => String(v ?? '').trim();
      const enderecoMudou = ['logradouro', 'numero', 'bairro', 'cep'].some((k) => payload[k] !== undefined && normaliza(payload[k]) !== normaliza(existente?.[k]))
        || (payload.cidade_id !== undefined && Number(payload.cidade_id) !== Number(existente?.cidade_id ?? existente?.cidadeId));
      const semCoords = !(Number(existente?.latitude) && Number(existente?.longitude));
      if (enderecoMudou || semCoords) {
        const merged = { ...(existente || {}), ...payload };
        const coords = await this.resolverCoordenadas(merged);
        if (coords) { payload.latitude = coords.latitude; payload.longitude = coords.longitude; }
        else { delete payload.latitude; delete payload.longitude; }
      } else { delete payload.latitude; delete payload.longitude; }
    }
    delete payload.lat; delete payload.lng;
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
