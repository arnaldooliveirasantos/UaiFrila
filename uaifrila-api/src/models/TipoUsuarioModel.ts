import { BaseModel, Column, HasMany } from './BaseModel';
import { UsuarioModel } from './UsuarioModel';

export class TipoUsuarioModel extends BaseModel {
  static tableName = 'tipos_usuario';

  @Column({ name: 'id', primaryKey: true, autoIncrement: true, description: 'ID único do tipo de usuário' })
  id!: number;

  @Column({ name: 'chave', description: 'Chave: FREELA, CONTRATANTE, ADMIN, SUPER_ADMIN' })
  chave!: string;

  @Column({ name: 'nome_exibicao', description: 'Nome para exibir no frontend' })
  nomeExibicao!: string;

  @Column({ name: 'descricao', type: 'text', description: 'Descrição do tipo' })
  descricao?: string;

  @Column({ name: 'nivel_permissao', type: 'integer', description: 'Nível: 0=Freela, 10=Contratante, 100=Super Admin' })
  nivelPermissao: number = 0;

  @Column({ name: 'criado_em', type: 'timestamp', description: 'Data criação' })
  criadoEm?: Date;

  @HasMany(() => UsuarioModel, 'tipo_usuario_id', { description: 'Usuários deste tipo' })
  usuarios?: UsuarioModel[];

  constructor(data?: any) { super(); this.fill(data); }
}
