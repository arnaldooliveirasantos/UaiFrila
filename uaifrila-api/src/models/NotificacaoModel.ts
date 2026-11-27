import { BaseModel, Column } from "./BaseModel";
// Banco: notificacoes(id,usuario_id,tipo,titulo,mensagem,referencia_tipo,referencia_id,lida,criado_em)
// Nao existem vaga_id / candidatura_id / criado_em. Use referencia_tipo='VAGA'|'CANDIDATURA' + referencia_id.
export class NotificacaoModel extends BaseModel {
  static tableName = "notificacoes";
  @Column({ name: "id", primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: "usuario_id", type: "int" }) usuarioId!: number;
  @Column({ name: "tipo" }) tipo!: string;
  @Column({ name: "titulo" }) titulo!: string;
  @Column({ name: "mensagem", type: "text" }) mensagem!: string;
  @Column({ name: "referencia_tipo" }) referenciaTipo?: string;
  @Column({ name: "referencia_id", type: "int" }) referenciaId?: number;
  @Column({ name: "lida", type: "boolean" }) lida: boolean = false;
  @Column({ name: "criado_em", type: "timestamp" }) createdAt?: Date;
  constructor(data?: any) {
    super();
    this.fill(data);
  }
}
