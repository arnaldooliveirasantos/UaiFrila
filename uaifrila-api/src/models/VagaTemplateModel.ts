import { BaseModel, Column } from './BaseModel';
export class VagaTemplateModel extends BaseModel {
  static tableName = 'vaga_templates';
  @Column({ name: 'id', primaryKey: true }) id!: number;
  @Column({ name: 'nome' }) nome!: string;
  @Column({ name: 'funcao_id' }) funcaoId?: number;
  @Column({ name: 'descricao' }) descricao?: string;
  @Column({ name: 'turnos_json' }) turnosJson?: any;
  @Column({ name: 'ativo' }) ativo?: boolean;
}
