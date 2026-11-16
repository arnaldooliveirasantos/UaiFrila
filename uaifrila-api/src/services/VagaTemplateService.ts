import { BaseRepository } from '../repositories/BaseRepository';

// Fase 3: templates de vaga (publicar em 30 segundos).
// A tabela vaga_templates vem da migration 05, com 3 seeds (Garçom, Cozinheiro, Bartender).
// O turnos_json do seed tem data vazia: o front usa hora/valor como sugestão e o
// usuário escolhe os dias na agenda.
export class VagaTemplateService {
  async listar(): Promise<any[]> {
    const pool = BaseRepository.getPool() as any;
    const r = await pool.query(`SELECT vt.*, f.nome as funcao_nome FROM vaga_templates vt LEFT JOIN funcoes f ON f.id = vt.funcao_id WHERE vt.ativo = true ORDER BY vt.nome`);
    return r.rows || [];
  }
}
