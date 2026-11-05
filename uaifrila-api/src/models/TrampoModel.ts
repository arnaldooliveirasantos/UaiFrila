import { BaseModel, Column, BelongsTo, Hidden } from './BaseModel';
import { VagaModel } from './VagaModel';
import { UsuarioModel } from './UsuarioModel';

export class TrampoModel extends BaseModel {
  static tableName = 'trampos';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID único' })
  id!: number;

  @Column({ name: 'vaga_id', description: 'FK vagas.id' })
  vagaId!: number;

  @Column({ name: 'freela_id', description: 'FK usuarios.id freela' })
  freelaId!: number;

  @Column({ name: 'contratante_id', description: 'FK usuarios.id contratante' })
  contratanteId!: number;

  @Hidden('Código início - mascarado na API')
  @Column({ name: 'codigo_inicio', hidden: true, sensitive: true, mask: 'codigo', description: 'Código iniciar - mascarado ao sair: A***1' })
  codigoInicio?: string;

  @Hidden('Código fim - mascarado na API')
  @Column({ name: 'codigo_fim', hidden: true, sensitive: true, mask: 'codigo', description: 'Código finalizar - mascarado' })
  codigoFim?: string;

  @Column({ name: 'status', description: 'Status' })
  status: string = 'ACEITO';

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Criado em' })
  criadoEm?: Date;

  @BelongsTo(() => VagaModel, 'vaga_id', { description: 'Vaga' })
  vaga?: VagaModel;

  @BelongsTo(() => UsuarioModel, 'freela_id', { description: 'Freela' })
  freela?: UsuarioModel;

  constructor(data?: any) { super(); this.fill(data); }

  toPublic(viewerId?: number): any {
    const isParticipant = viewerId === this.freelaId || viewerId === this.contratanteId;
    if (isParticipant) {
      const raw = this.toRaw();
      const json = this.toUnmasked();
      // Mascarado leve para participante: A***9
      if (raw.codigoInicio) json.codigoInicio = raw.codigoInicio[0] + '***' + raw.codigoInicio.slice(-1);
      if (raw.codigoFim) json.codigoFim = raw.codigoFim[0] + '***' + raw.codigoFim.slice(-1);
      return json;
    }
    return this.toJSON({ unmasked: false });
  }
}
