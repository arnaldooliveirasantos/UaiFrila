import { BaseModel, Hidden, Column, BelongsTo, HasMany } from './BaseModel';
import { TipoUsuarioModel } from './TipoUsuarioModel';
import { StatusUsuarioModel } from './StatusUsuarioModel';
import { EnderecoModel } from './EnderecoModel';

export class UsuarioModel extends BaseModel {
  static tableName = 'usuarios';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID único do usuário' })
  id!: number;

  @Column({ name: 'nome_completo', description: 'Nome completo do usuário' })
  nomeCompleto!: string;

  @Column({ name: 'cpf', description: 'CPF do usuário', sensitive: true, mask: 'cpf' })
  cpf?: string;

  @Column({ name: 'email', description: 'E-mail único', sensitive: true, mask: 'email' })
  email!: string;

  @Hidden('Hash da senha - NUNCA expor')
  @Column({ name: 'senha_hash', hidden: true, description: 'Hash bcrypt' })
  senhaHash!: string;

  @Column({ name: 'cnpj', description: 'CNPJ se PJ', sensitive: true, mask: 'cnpj' })
  cnpj?: string;

  @Column({ name: 'nome_fantasia', description: 'Nome fantasia se empresa' })
  nomeFantasia?: string;

  @Column({ name: 'status_usuario_id', description: 'FK status_usuario' })
  statusUsuarioId: number = 1;

  @Column({ name: 'tipo_usuario_id', description: 'FK tipos_usuario - define permissão' })
  tipoUsuarioId!: number;

  @Column({ name: 'funcao_principal', description: 'Função: Garçom, Cozinheiro' })
  funcaoPrincipal: string = 'Garçom';

  @Column({ name: 'valor_hora_base', type: 'numeric', description: 'Valor hora base' })
  valorHoraBase: number = 20;

  @Column({ name: 'bio', type: 'text', description: 'Biografia' })
  bio?: string;

  @Column({ name: 'tem_mei', type: 'boolean', description: 'Se possui MEI' })
  temMei: boolean = false;

  @Column({ name: 'como_chega', description: 'Como chega no local' })
  comoChega?: string;

  @Column({ name: 'ajuda_uber', type: 'numeric', description: 'Ajuda Uber' })
  ajudaUber?: number;

  @Column({ name: 'avaliacao_media', type: 'numeric', description: 'Média avaliações' })
  avaliacaoMedia: number = 5.0;

  @Column({ name: 'total_avaliacoes', type: 'integer', description: 'Total avaliações' })
  totalAvaliacoes: number = 0;

  @Column({ name: 'permissoes', type: 'jsonb', description: 'Permissões extras' })
  permissoes: any = [];

  @Column({ name: 'role', description: 'Role legado' })
  role: string = 'FREELA';

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Data criação' })
  criadoEm?: Date;

  @Column({ name: 'atualizado_em', type: 'timestamp', description: 'Data atualização' })
  atualizadoEm?: Date;

  @BelongsTo(() => TipoUsuarioModel, 'tipo_usuario_id', { description: 'Tipo de usuário' })
  tipoUsuario?: TipoUsuarioModel;

  @BelongsTo(() => StatusUsuarioModel, 'status_usuario_id', { description: 'Status' })
  statusUsuario?: StatusUsuarioModel;

  @HasMany(() => EnderecoModel, 'usuario_id', { description: 'Endereços' })
  enderecos?: EnderecoModel[];

  constructor(data?: any) { super(); this.fill(data); }

  toPublic(viewerId?: number, isAdmin: boolean = false): any {
    const isOwner = viewerId === this.id;
    if (isOwner || isAdmin) return this.toUnmasked();
    return this.toJSON({ unmasked: false });
  }
}
