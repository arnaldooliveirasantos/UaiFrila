import { BaseService } from './BaseService';
import { VagaTurnoRepository } from '../repositories/VagaTurnoRepository';
import { VagaTurnoModel } from '../models/VagaTurnoModel';
import { BaseRepository } from '../repositories/BaseRepository';
// Servico canonico dos turnos da vaga. O VagaService mantem um helper interno
// (normalizarTurnos/salvarTurnos) com a mesma regra para nao quebrar o criar/
// atualizar de vagas; esta classe e a fonte da verdade para os endpoints novos.
export class VagaTurnoService extends BaseService<VagaTurnoModel> {
  constructor() { super(new VagaTurnoRepository()); }
  private paraMin(h: string): number { const [a, b] = String(h).slice(0, 5).split(':').map(Number); return a * 60 + b; }
  // Normaliza + valida. Descarta turno invalido (data/hora fora do formato,
  // duracao < 30min ou > 24h, valor negativo). Ordena por data/hora e numera ordem.
  normalizarTurnos(turnos: any): any[] {
    if (!Array.isArray(turnos)) return [];
    const out: any[] = [];
    for (const tu of turnos) {
      const data = String(tu.data || tu.dia || '');
      const hi = String(tu.hora_inicio || tu.horaInicio || tu.inicio || '').slice(0, 5);
      const hf = String(tu.hora_fim || tu.horaFim || tu.fim || '').slice(0, 5);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^\d{2}:\d{2}$/.test(hi) || !/^\d{2}:\d{2}$/.test(hf)) continue;
      if (hi === hf) continue;
      const atravessa = this.paraMin(hf) <= this.paraMin(hi);
      const duracao = atravessa ? (1440 - this.paraMin(hi) + this.paraMin(hf)) : (this.paraMin(hf) - this.paraMin(hi));
      if (duracao < 30 || duracao > 1440) continue;
      const valor = Number(tu.valor_servico ?? tu.valorServico ?? tu.valor ?? 0) || 0;
      if (valor < 0) continue;
      out.push({ data, hora_inicio: hi, hora_fim: hf, atravessa_meia_noite: atravessa, duracao_minutos: duracao, valor_servico: valor });
    }
    out.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : this.paraMin(a.hora_inicio) - this.paraMin(b.hora_inicio)));
    return out.map((x, i) => ({ ...x, ordem: i + 1, status: 'AGENDADO' }));
  }
  private async garantirVagaExiste(vagaId: number) {
    const pool = BaseRepository.getPool() as any;
    const r = await pool.query(`SELECT id, contratante_id FROM vagas WHERE id = $1`, [vagaId]);
    if (!r.rows[0]) throw new Error('Vaga não encontrada');
    return r.rows[0];
  }
  async listarPorVaga(vagaId: number): Promise<VagaTurnoModel[]> {
    await this.garantirVagaExiste(vagaId);
    return await (this.repo as VagaTurnoRepository).listarPorVaga(vagaId);
  }
  // So o dono da vaga pode trocar a agenda. Agenda vazia = rejeitada.
  async substituirAgenda(vagaId: number, usuarioId: number, turnos: any[]): Promise<VagaTurnoModel[]> {
    const vaga = await this.garantirVagaExiste(vagaId);
    if (Number(vaga.contratante_id) !== Number(usuarioId)) throw new Error('Só o dono da vaga pode alterar os turnos');
    const lista = this.normalizarTurnos(turnos);
    if (!lista.length) throw new Error('Informe pelo menos um turno válido (dia + período + valor)');
    return await (this.repo as VagaTurnoRepository).substituirAgenda(vagaId, lista);
  }
  async criarTurno(vagaId: number, usuarioId: number, dados: any): Promise<VagaTurnoModel> {
    const vaga = await this.garantirVagaExiste(vagaId);
    if (Number(vaga.contratante_id) !== Number(usuarioId)) throw new Error('Só o dono da vaga pode adicionar turno');
    const [t] = this.normalizarTurnos([{ ...dados, status: 'AGENDADO' }]);
    if (!t) throw new Error('Turno inválido (dia + período + valor)');
    const existentes = await (this.repo as VagaTurnoRepository).listarPorVaga(vagaId);
    t.ordem = existentes.length + 1;
    return await this.repo.criarGenerico({ vaga_id: vagaId, ...t });
  }
  async atualizarTurno(id: number, usuarioId: number, dados: any): Promise<VagaTurnoModel | null> {
    const atual = await this.buscarPorId(id);
    const vaga = await this.garantirVagaExiste(Number((atual as any).vagaId ?? (atual as any).vaga_id));
    if (Number(vaga.contratante_id) !== Number(usuarioId)) throw new Error('Só o dono da vaga pode alterar o turno');
    // So status e valor sao editaveis por aqui; dia/hora trocam pela agenda completa.
    const patch: any = {};
    if (dados.status !== undefined) patch.status = String(dados.status);
    if (dados.valor_servico !== undefined || dados.valorServico !== undefined) {
      const v = Number(dados.valor_servico ?? dados.valorServico);
      if (isNaN(v) || v < 0) throw new Error('Valor do turno inválido');
      patch.valor_servico = v;
    }
    if (!Object.keys(patch).length) return atual;
    return await this.repo.atualizarGenerico(id, patch);
  }
  async deletarTurno(id: number, usuarioId: number): Promise<boolean> {
    const atual = await this.buscarPorId(id);
    const vaga = await this.garantirVagaExiste(Number((atual as any).vagaId ?? (atual as any).vaga_id));
    if (Number(vaga.contratante_id) !== Number(usuarioId)) throw new Error('Só o dono da vaga pode remover turno');
    return await this.deletar(id);
  }
  async resumo(vagaId: number): Promise<any> {
    const lista = await this.listarPorVaga(vagaId);
    const dias = new Set(lista.map((x: any) => String(x.data).slice(0, 10))).size;
    return { vaga_id: vagaId, dias, turnos: lista.length, minutos_total: lista.reduce((s: number, x: any) => s + Number(x.duracaoMinutos ?? x.duracao_minutos ?? 0), 0), valor_total: lista.reduce((s: number, x: any) => s + Number(x.valorServico ?? x.valor_servico ?? 0), 0), turnos: lista };
  }
}
