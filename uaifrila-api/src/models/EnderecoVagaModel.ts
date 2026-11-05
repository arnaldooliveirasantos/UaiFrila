import { BaseModel, Column, BelongsTo } from './BaseModel';
import { EnderecoModel } from './EnderecoModel';
import { VagaModel } from './VagaModel';

export class EnderecoVagaModel extends BaseModel {
  static tableName = 'enderecos_vaga';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID único' })
  id!: number;

  @Column({ name: 'endereco_id', description: 'FK enderecos.id' })
  enderecoId!: number;

  @Column({ name: 'vaga_id', description: 'FK vagas.id' })
  vagaId!: number;

  @Column({ name: 'ativo', type: 'boolean', description: 'Se vínculo ativo' })
  ativo: boolean = true;

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Data criação' })
  criadoEm?: Date;

  @BelongsTo(() => EnderecoModel, 'endereco_id', { description: 'Endereço' })
  endereco?: EnderecoModel;

  @BelongsTo(() => VagaModel, 'vaga_id', { description: 'Vaga' })
  vaga?: VagaModel;

  constructor(data?: any) { super(); this.fill(data); }
}
