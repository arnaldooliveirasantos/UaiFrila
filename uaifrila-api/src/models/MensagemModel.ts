import { BaseModel, Column } from "./BaseModel";
// Banco: mensagens(id,conversa_id,remetente_id,texto,anexo_url,tipo,lida_em,criado_em)
export class MensagemModel extends BaseModel {
  static tableName = "mensagens";
  @Column({ name: "id", primaryKey: true, autoIncrement: true }) id!: number;
  @Column({ name: "conversa_id" }) conversaId!: number;
  @Column({ name: "remetente_id" }) remetenteId!: number;
  @Column({ name: "texto", type: "text" }) texto!: string;
  @Column({ name: "anexo_url" }) anexoUrl?: string;
  @Column({ name: "tipo" }) tipo: string = "TEXTO";
  @Column({ name: "lida_em", type: "timestamp" }) lidaEm?: Date;
  @Column({ name: "criado_em", type: "timestamp" }) createdAt?: Date;
  constructor(data?: any) {
    super();
    this.fill(data);
  }
}
