import { BaseModel, Column } from './BaseModel';
export class UsuarioFuncaoModel extends BaseModel {
  static tableName = 'usuario_funcoes';
  @Column({ name: 'id', primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: 'usuario_id' }) usuarioId!: number;
  @Column({ name: 'funcao_id' }) funcaoId!: number;
  @Column({ name: 'tempo_experiencia_meses' }) tempoExperienciaMeses: number = 0;
  @Column({ name: 'onde_trabalhou' }) ondeTrabalhou?: string;
  @Column({ name: 'ainda_trabalha', type: 'boolean' }) aindaTrabalha: boolean = true;
  @Column({ name: 'origem' }) origem: string = 'DECLARADA';
  constructor(data?: any) { super(); this.fill(data); }
}
