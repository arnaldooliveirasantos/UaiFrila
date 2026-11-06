import { CidadeRepository } from '../repositories/CidadeRepository';
import { CidadeModel } from '../models/CidadeModel';
export class CidadeService {
  private repo: CidadeRepository;
  constructor() { this.repo = new CidadeRepository(); }
  
  async listar(): Promise<CidadeModel[]> { 
    try { return await this.repo.buscarTodos(); } 
    catch (e: any) { console.warn('[CidadeService.listar]', e.message); return []; }
  }
  
  async listarAtivas(): Promise<CidadeModel[]> { 
    try { return await this.repo.listarAtivas(); } 
    catch { return await this.listar(); }
  }
  
  async listarTodas(): Promise<CidadeModel[]> { return await this.listar(); }
  
  async listarPorEstado(estadoId: number): Promise<CidadeModel[]> { 
    if (!estadoId || isNaN(estadoId)) return await this.listarAtivas(); 
    try { return await this.repo.listarPorEstado(estadoId); } 
    catch { return await this.listarAtivas(); }
  }
  
  async listarPorEstadoSigla(sigla: string): Promise<CidadeModel[]> { 
    if (!sigla) return await this.listarAtivas(); 
    try { return await this.repo.listarPorEstadoSigla(sigla); } 
    catch { return await this.listarAtivas(); }
  }
  
  async buscarPorId(id: number): Promise<CidadeModel> { 
    const c = await this.repo.buscarPorId(id); 
    if (!c) throw new Error('Cidade não encontrada'); 
    return c; 
  }
  
  async buscarPorIdComRelacoes(id: number): Promise<CidadeModel | null> { 
    try { return await this.repo.buscarPorIdComRelacoes(id); } 
    catch { return await this.buscarPorId(id); }
  }
  
  async criar(dados: any): Promise<CidadeModel> { 
    // Mapeia ativo -> ativa se vier errado
    const payload = { ...dados };
    if (payload.ativo !== undefined && payload.ativa === undefined) {
      payload.ativa = payload.ativo;
      delete payload.ativo;
    }
    return await this.repo.criarGenerico(payload); 
  }
  
  async atualizar(id: number, dados: any): Promise<CidadeModel | null> { 
    const payload = { ...dados };
    // FIX: coluna é "ativa" não "ativo"
    if (payload.ativo !== undefined && payload.ativa === undefined) {
      payload.ativa = payload.ativo;
    }
    delete payload.ativo;
    delete payload.estado_sigla;
    delete payload.sigla;
    
    console.log(`[CidadeService.atualizar] id=${id} payload=`, payload);
    
    try {
      return await this.repo.atualizarGenerico(id, payload);
    } catch (e: any) {
      if (e.message.includes('coluna "ativo"')) {
        // Tenta só com ativa
        const payload2: any = {};
        if (payload.ativa !== undefined) payload2.ativa = payload.ativa;
        if (payload.nome !== undefined) payload2.nome = payload.nome;
        if (payload.estado !== undefined) payload2.estado = payload.estado;
        console.log(`[CidadeService.atualizar] retry com payload limpo`, payload2);
        return await this.repo.atualizarGenerico(id, payload2);
      }
      throw e;
    }
  }
  
  async deletar(id: number): Promise<boolean> { return await this.repo.deletarPorId(id); }
  
  // Para compatibilidade com toggle
  async atualizarStatus(id: number, ativa: boolean): Promise<CidadeModel | null> {
    return await this.atualizar(id, { ativa });
  }
}
