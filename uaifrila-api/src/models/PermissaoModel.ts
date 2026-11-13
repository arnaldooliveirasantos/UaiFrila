import { BaseModel, Column } from './BaseModel';
// Tabela permissoes (14B). Antes tableName='' e a fonte era usuarios.permissoes (JSONB).
// Colunas: id, chave, nome, categoria, descricao, tipo_usuario_id, criado_em, atualizado_em.
export class PermissaoModel extends BaseModel {
  static tableName = 'permissoes';
  @Column({ name: 'id', primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: 'chave' }) chave!: string;
  @Column({ name: 'nome' }) nome!: string;
  @Column({ name: 'categoria' }) categoria?: string;
  @Column({ name: 'descricao', type: 'text' }) descricao?: string;
  @Column({ name: 'tipo_usuario_id' }) tipoId?: number;
  @Column({ name: 'criado_em', type: 'timestamp' }) criadoEm?: Date;
  @Column({ name: 'atualizado_em', type: 'timestamp' }) atualizadoEm?: Date;
  constructor(data?: any) { super(); this.fill(data); }
}
