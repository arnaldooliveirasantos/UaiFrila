import { BaseService } from './BaseService';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { UsuarioModel } from '../models/UsuarioModel';
import { BaseRepository } from '../repositories/BaseRepository';

// CORREÇÃO DEFINITIVA tu.nome:
// tipos_usuario NÃO tem coluna 'nome' - só: id, chave, descricao, nivel_permissao
// status_usuario NÃO tem 'nome' garantido - só: id, chave, descricao
// Por isso este arquivo NÃO usa JOIN com tu.nome / su.nome em lugar nenhum.
// Busca usuario sozinho, depois busca tipo e status em queries SEPARADAS.
// Se uma delas falhar, retorna o usuario mesmo assim - login NÃO pode quebrar por causa de JOIN.

export class UsuarioService extends BaseService<UsuarioModel> {
  constructor() { super(new UsuarioRepository()); }

  async buscarPorEmail(email: string): Promise<any | null> {
    try {
      this.validateRequired({ email }, ['email']);
      this.validateEmail(email);
      const r = this.getRepo();
      if (typeof r.buscarPorEmail === 'function') return await r.buscarPorEmail(email);
      return await this.buscarPorCampo('email', String(email).trim().toLowerCase());
    } catch (e: any) { this.handleError(e, 'UsuarioService.buscarPorEmail'); }
  }

  async buscarPorCpf(cpf: string): Promise<any | null> {
    try {
      const r = this.getRepo();
      if (typeof r.buscarPorCpf === 'function') return await r.buscarPorCpf(cpf);
      return await this.buscarPorCampo('cpf', cpf);
    } catch (e: any) { this.handleError(e, 'UsuarioService.buscarPorCpf'); }
  }

  // SEM JOIN - 3 queries separadas, cada uma com try/catch próprio
  async buscarPorIdComRelacoes(id: number): Promise<any | null> {
    try {
      const pool = BaseRepository.getPool() as any;
      if (!pool) return await this.getRepo().buscarPorId(id);

      // 1. Usuario sozinho - se isso falhar, aí sim é erro real
      const resUser = await pool.query(`SELECT * FROM usuarios WHERE id = $1 LIMIT 1`, [id]);
      if (!resUser.rows[0]) return null;
      const row: any = { ...resUser.rows[0] };

      // 2. Tipo - só chave / descricao / nivel_permissao (NUNCA nome)
      try {
        if (row.tipo_usuario_id) {
          const resTipo = await pool.query(
            `SELECT chave, descricao, nivel_permissao FROM tipos_usuario WHERE id = $1 LIMIT 1`,
            [row.tipo_usuario_id]
          );
          if (resTipo.rows[0]) {
            row.tipo_chave = resTipo.rows[0].chave;
            row.tipo_descricao = resTipo.rows[0].descricao;
            row.nivel_permissao = resTipo.rows[0].nivel_permissao;
            row.tipo_nivel_permissao = resTipo.rows[0].nivel_permissao;
          }
        }
      } catch (e: any) {
        console.warn('[UsuarioService] tipos_usuario falhou, seguindo só com usuario:', e.message);
      }

      // 3. Status - só chave / descricao (NUNCA nome)
      try {
        if (row.status_usuario_id) {
          const resStatus = await pool.query(
            `SELECT chave, descricao FROM status_usuario WHERE id = $1 LIMIT 1`,
            [row.status_usuario_id]
          );
          if (resStatus.rows[0]) {
            row.status_chave = resStatus.rows[0].chave;
            row.status_descricao = resStatus.rows[0].descricao;
          }
        }
      } catch (e: any) {
        console.warn('[UsuarioService] status_usuario falhou, seguindo só com usuario:', e.message);
      }

      row.toRaw = () => row;
      row.toPublic = () => { const { senha_hash, senhaHash, ...rest } = row; return rest; };
      return row;
    } catch (e: any) {
      // NÃO deixa login quebrar: tenta buscar só o usuario via repository
      console.warn('[UsuarioService.buscarPorIdComRelacoes] fallback para buscarPorId simples:', e.message);
      try {
        const simples: any = await this.getRepo().buscarPorId(id);
        if (simples) {
          const r = (simples as any).toRaw ? (simples as any).toRaw() : simples;
          r.toRaw = () => r;
          r.toPublic = () => { const { senha_hash, senhaHash, ...rest } = r; return rest; };
          return r;
        }
      } catch {}
      this.handleError(e, 'UsuarioService.buscarPorIdComRelacoes');
    }
  }

  async buscarPorIdCompleto(id: number): Promise<any | null> {
    return this.buscarPorIdComRelacoes(id);
  }

  async buscarCompletoPorId(id: number): Promise<any | null> {
    return this.buscarPorIdComRelacoes(id);
  }

  async listarComFiltro(filtro: any): Promise<any[]> {
    try {
      const r = this.getRepo();
      if (typeof r.listarComFiltro === 'function') return await r.listarComFiltro(filtro);
      return await this.listar();
    } catch (e: any) { this.handleError(e, 'UsuarioService.listarComFiltro'); }
  }
}
