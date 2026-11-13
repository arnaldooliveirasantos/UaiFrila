import { BaseModel, Column } from "./BaseModel";
// Banco: conversas(id,trampo_id,contratante_id,freela_id,ultima_mensagem_at,criado_em) - FK trampo_id -> trampos(id) apos migracao 01.
export class ConversaModel extends BaseModel {
  static tableName = "conversas";
  @Column({ name: "id", primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: "trampo_id" }) trampoId!: number;
  @Column({ name: "contratante_id" }) contratanteId!: number;
  @Column({ name: "freela_id" }) freelaId!: number;
  @Column({ name: "ultima_mensagem_at", type: "timestamp" })
  ultimaMensagemAt?: Date;
  @Column({ name: "criado_em", type: "timestamp" }) createdAt?: Date;
  constructor(data?: any) {
    super();
    this.fill(data);
  }
}
