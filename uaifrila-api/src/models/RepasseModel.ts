import { BaseModel, Column } from './BaseModel';
// repasses: 1 por trampo_turno confirmado. Idempotente por chave_idempotencia.
export class RepasseModel extends BaseModel {
  static tableName = 'repasses';
  @Column({ name: 'id', primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: 'trampo_turno_id', type: 'int' }) trampoTurnoId!: number;
  @Column({ name: 'trampo_id', type: 'int' }) trampoId!: number;
  @Column({ name: 'freela_id', type: 'int' }) freelaId!: number;
  @Column({ name: 'provedor' }) provedor!: string;
  @Column({ name: 'chave_idempotencia' }) chaveIdempotencia!: string;
  @Column({ name: 'status' }) status: string = 'AGENDADO';
  @Column({ name: 'valor_centavos', type: 'int' }) valorCentavos: number = 0;
  @Column({ name: 'agendar_para', type: 'timestamp' }) agendarPara?: Date;
  @Column({ name: 'pago_em', type: 'timestamp' }) pagoEm?: Date;
  @Column({ name: 'comprovante' }) comprovante?: string;
  @Column({ name: 'erro' }) erro?: string;
  @Column({ name: 'tentativas', type: 'int' }) tentativas: number = 0;
  @Column({ name: 'criado_em', type: 'timestamp' }) criadoEm?: Date;
  @Column({ name: 'atualizado_em', type: 'timestamp' }) atualizadoEm?: Date;
  constructor(data?: any) { super(); this.fill(data); }
}
