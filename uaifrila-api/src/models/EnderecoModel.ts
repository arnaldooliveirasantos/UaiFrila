import { BaseModel, Column, BelongsTo } from './BaseModel';
import { UsuarioModel } from './UsuarioModel';
import { CidadeModel } from './CidadeModel';
import { TipoEnderecoModel } from './TipoEnderecoModel';

export class EnderecoModel extends BaseModel {
  static tableName = 'enderecos';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID único do endereço' })
  id!: number;

  @Column({ name: 'usuario_id', description: 'FK usuarios.id - dono' })
  usuarioId!: number;

  @Column({ name: 'cep', description: 'CEP: 38400-000' })
  cep?: string;

  @Column({ name: 'logradouro', description: 'Rua, Avenida' })
  logradouro!: string;

  @Column({ name: 'numero', description: 'Número' })
  numero?: string;

  @Column({ name: 'complemento', description: 'Complemento' })
  complemento?: string;

  @Column({ name: 'bairro', description: 'Bairro' })
  bairro?: string;

  @Column({ name: 'cidade_id', description: 'FK cidades.id' })
  cidadeId!: number;

  @Column({ name: 'tipo_endereco_id', description: 'FK tipos_endereco.id' })
  tipoEnderecoId: number = 1;

  @Column({ name: 'latitude', type: 'decimal', description: 'Latitude GPS' })
  latitude?: number;

  @Column({ name: 'longitude', type: 'decimal', description: 'Longitude GPS' })
  longitude?: number;

  @Column({ name: 'apelido', description: 'Apelido: Casa, Trabalho' })
  apelido?: string;

  @Column({ name: 'ativo', type: 'boolean', description: 'Se é principal' })
  ativo: boolean = false;

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Data criação' })
  criadoEm?: Date;

  @Column({ name: 'atualizado_em', type: 'timestamp', description: 'Data atualização' })
  atualizadoEm?: Date;

  @BelongsTo(() => UsuarioModel, 'usuario_id', { description: 'Usuário dono' })
  usuario?: UsuarioModel;

  @BelongsTo(() => CidadeModel, 'cidade_id', { description: 'Cidade' })
  cidade?: CidadeModel;

  @BelongsTo(() => TipoEnderecoModel, 'tipo_endereco_id', { description: 'Tipo' })
  tipoEndereco?: TipoEnderecoModel;

  constructor(data?: any) { super(); this.fill(data); }
}
