import { BaseModel, Column } from './BaseModel';
// IMPORTANTE: NAO existe tabela `permissoes` no SQL 00. As permissoes vivem no
// JSONB `usuarios.permissoes` (array de strings ou de objetos {chave, nome, categoria}).
// Este model e so a forma de uma entrada de permissao; o repository le/escreve
// no JSONB de usuarios, agrupando por tipo_usuario (a matriz RBAC real).
export class PermissaoModel extends BaseModel {
  static tableName = 'permissoes';
  @Column({ name: 'id' }) id!: number;
  @Column({ name: 'nome' }) nome!: string;
  @Column({ name: 'chave' }) chave!: string;
  @Column({ name: 'categoria' }) categoria?: string;
  @Column({ name: 'descricao' }) descricao?: string;
  @Column({ name: 'tipo_id' }) tipoId?: number;
  constructor(data?: any) { super(); this.fill(data); }
}
