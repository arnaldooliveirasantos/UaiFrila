import { BaseModel, Column, BelongsTo, Hidden } from './BaseModel';
import { VagaModel } from './VagaModel';
import { UsuarioModel } from './UsuarioModel';
// Banco: trampos(id,vaga_id,freela_id,contratante_id,status,codigo_inicio,codigo_fim,data_inicio,data_fim,criado_em,atualizado_em)
export class TrampoModel extends BaseModel {
  static tableName = 'trampos';
  @Column({ name: 'id', primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: 'vaga_id' }) vagaId!: number;
  @Column({ name: 'freela_id' }) freelaId!: number;
  @Column({ name: 'contratante_id' }) contratanteId!: number;
  @Hidden('Codigo inicio - mascarado') @Column({ name: 'codigo_inicio', hidden: true, sensitive: true, mask: 'codigo' }) codigoInicio?: string;
  @Hidden('Codigo fim - mascarado') @Column({ name: 'codigo_fim', hidden: true, sensitive: true, mask: 'codigo' }) codigoFim?: string;
  @Column({ name: 'status' }) status: string = 'ACEITO';
  @Column({ name: 'data_inicio', type: 'timestamp' }) dataInicio?: Date;
  @Column({ name: 'data_fim', type: 'timestamp' }) dataFim?: Date;
  @Column({ name: 'criado_em', type: 'timestamp' }) criadoEm?: Date;
  @Column({ name: 'atualizado_em', type: 'timestamp' }) atualizadoEm?: Date;
  @BelongsTo(() => VagaModel, 'vaga_id', { description: 'Vaga' }) vaga?: VagaModel;
  @BelongsTo(() => UsuarioModel, 'freela_id', { description: 'Freela' }) freela?: UsuarioModel;
  constructor(data?: any) { super(); this.fill(data); }
  toPublic(viewerId?: number): any {
    const isParticipant = viewerId === this.freelaId || viewerId === this.contratanteId;
    if (isParticipant) { const raw = this.toRaw(); const json = this.toUnmasked(); if (raw.codigoInicio) json.codigoInicio = raw.codigoInicio[0] + '***' + raw.codigoInicio.slice(-1); if (raw.codigoFim) json.codigoFim = raw.codigoFim[0] + '***' + raw.codigoFim.slice(-1); return json; }
    return this.toJSON({ unmasked: false });
  }
}
