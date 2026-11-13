import { UsuarioFuncaoRepository } from '../repositories/UsuarioFuncaoRepository';
export function faixaExperiencia(meses: number): string {
  if (meses < 12) return 'Menos de 1 ano'; if (meses < 36) return '1 a 2 anos'; if (meses <= 60) return '3 a 5 anos'; return 'Mais de 5 anos';
}
export function nivelExperiencia(meses: number, tramposComprovados: number): string {
  if (tramposComprovados >= 10 || meses > 60) return 'Especialista';
  if (tramposComprovados >= 4 || meses >= 36) return 'Avançado';
  if (tramposComprovados >= 1 || meses >= 12) return 'Intermediário';
  return 'Iniciante';
}
export class UsuarioFuncaoService {
  private repo = new UsuarioFuncaoRepository();
  async listarMinhas(usuarioId: number): Promise<any[]> {
    const rows = await this.repo.listarPorUsuario(usuarioId);
    return rows.map((r: any) => ({ ...r, faixa_experiencia: faixaExperiencia(Number(r.tempo_experiencia_meses || 0)),
      nivel: nivelExperiencia(Number(r.tempo_experiencia_meses || 0), Number(r.trampos_comprovados || 0)),
      comprovada: Number(r.trampos_comprovados || 0) > 0 }));
  }
  async salvar(usuarioId: number, dados: any): Promise<any> { return await this.repo.salvar(usuarioId, dados); }
  async remover(usuarioId: number, funcaoId: number): Promise<boolean> { return await this.repo.remover(usuarioId, funcaoId); }
}
