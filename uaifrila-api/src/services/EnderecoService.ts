import { EnderecoRepository } from '../repositories/EnderecoRepository';
import { EnderecoModel } from '../models/EnderecoModel';

export class EnderecoService {
  private repo: EnderecoRepository;
  constructor() { this.repo = new EnderecoRepository(); }

  async listar(): Promise<EnderecoModel[]> { 
    try { return await this.repo.buscarTodos(); } 
    catch { return []; }
  }

  async listarPorUsuario(usuarioId: number): Promise<EnderecoModel[]> { 
    const id = Number(usuarioId);
    if (!id || isNaN(id)) return [];
    try { return await this.repo.listarPorUsuario(id); }
    catch (e: any) { console.warn('[EnderecoService.listarPorUsuario] erro', e.message); return []; }
  }

  async buscarAtivoPorUsuario(usuarioId: number): Promise<EnderecoModel | null> { 
    const id = Number(usuarioId);
    if (!id || isNaN(id)) return null;
    try { return await this.repo.buscarAtivoPorUsuario(id); }
    catch { return null; }
  }

  async buscarPorId(id: number): Promise<EnderecoModel> { 
    const idNum = Number(id);
    if (!idNum || isNaN(idNum)) throw new Error('ID inválido');
    const e = await this.repo.buscarPorId(idNum); 
    if (!e) throw new Error('Endereço não encontrado'); 
    return e; 
  }

  async buscarCompletoPorId(id: number): Promise<EnderecoModel | null> { 
    const idNum = Number(id);
    if (!idNum || isNaN(idNum)) return null;
    try { return await this.repo.buscarCompletoPorId(idNum); }
    catch { return await this.repo.buscarPorId(idNum); }
  }

  async buscarPorIdComRelacoes(id: number): Promise<EnderecoModel | null> {
    return await this.buscarCompletoPorId(id);
  }

  async criar(dados: any): Promise<EnderecoModel> { 
    // Garante usuario_id
    const usuarioId = Number(dados.usuarioId || dados.usuario_id);
    if (!usuarioId || isNaN(usuarioId)) throw new Error('usuario_id obrigatório');
    
    const payload: any = {
      usuario_id: usuarioId,
      cidade_id: Number(dados.cidade_id || dados.cidadeId),
      logradouro: dados.logradouro,
      numero: dados.numero || null,
      bairro: dados.bairro || null,
      cep: dados.cep || null,
      complemento: dados.complemento || null,
      apelido: dados.apelido || 'Casa',
      tipo_endereco_id: Number(dados.tipo_endereco_id || dados.tipoEnderecoId || 1),
      ativo: Boolean(dados.ativo),
      latitude: dados.latitude || null,
      longitude: dados.longitude || null,
    };
    
    if (!payload.cidade_id || isNaN(payload.cidade_id)) throw new Error('cidade_id obrigatório');
    if (!payload.logradouro) throw new Error('logradouro obrigatório');
    
    const criado = await this.repo.criarGenerico(payload);
    
    // Se é o primeiro endereco ou marcado como ativo, desativa outros e ativa este
    if (payload.ativo) {
      try {
        await this.repo.desativarOutrosAtivos(usuarioId, (criado as any).id);
      } catch {}
    } else {
      // Se é primeiro endereco do usuario, ativa automaticamente
      try {
        const outros = await this.listarPorUsuario(usuarioId);
        if (outros.length === 1) {
          await this.repo.atualizarGenerico((criado as any).id, { ativo: true });
        }
      } catch {}
    }
    
    return criado;
  }

  async atualizar(id: number, dados: any): Promise<EnderecoModel | null> { 
    const idNum = Number(id);
    if (!idNum || isNaN(idNum)) throw new Error('ID inválido');
    const payload = { ...dados };
    delete payload.usuario_id;
    delete payload.usuarioId;
    delete payload.estado_id;
    return await this.repo.atualizarGenerico(idNum, payload); 
  }

  async definirAtivo(usuarioId: number, enderecoId: number): Promise<EnderecoModel | null> {
    const uid = Number(usuarioId);
    const eid = Number(enderecoId);
    if (!uid || isNaN(uid) || !eid || isNaN(eid)) throw new Error('IDs inválidos');
    
    // Verifica se endereco pertence ao usuario - com logs
    let endereco: any = null;
    try {
      endereco = await this.repo.buscarPorId(eid);
    } catch (e: any) {
      console.error('[EnderecoService.definirAtivo] buscarPorId falhou', e.message);
      throw new Error('Endereço não encontrado');
    }
    
    if (!endereco) throw new Error('Endereço não encontrado');
    
    const donoId = Number((endereco as any).usuario_id || (endereco as any).usuarioId);
    console.log(`[EnderecoService.definirAtivo] usuarioId=${uid} dono endereco=${donoId} enderecoId=${eid}`);
    
    if (donoId !== uid) {
      // Se não for dono, verifica se usuario tem permissão admin? Deixa passar com warning se for o mesmo usuario logado de outro id?
      // Para debug, lista enderecos do usuario
      try {
        const lista = await this.listarPorUsuario(uid);
        console.log(`[definirAtivo] enderecos do usuario ${uid}:`, lista.map((x:any) => ({id:x.id, usuario_id: (x as any).usuario_id})));
      } catch {}
      throw new Error('Acesso negado - endereço não pertence ao usuário');
    }
    
    try {
      await this.repo.desativarOutrosAtivos(uid, eid);
    } catch (e: any) {
      console.warn('[definirAtivo] desativarOutros falhou', e.message);
    }
    
    try {
      return await this.repo.atualizarGenerico(eid, { ativo: true });
    } catch (e: any) {
      console.error('[definirAtivo] atualizarGenerico falhou', e.message);
      throw new Error('Erro ao ativar endereço');
    }
  }

  async deletar(id: number): Promise<boolean> { 
    const idNum = Number(id);
    if (!idNum || isNaN(idNum)) throw new Error('ID inválido');
    return await this.repo.deletarPorId(idNum); 
  }
}
