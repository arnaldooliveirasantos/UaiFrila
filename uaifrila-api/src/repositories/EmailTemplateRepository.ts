
import { BaseRepository } from './BaseRepository';

export interface EmailTemplate {
  id: number;
  chave_uso: string;
  titulo_assunto: string;
  conteudo_corpo: string;
  email_remetente: string;
  nome_remetente: string;
  criado_em: string;
}

export class EmailTemplateRepository extends BaseRepository {
  // Segue tabela email_templates: chave_uso, titulo_assunto, conteudo_corpo, email_remetente, nome_remetente

  async buscarPorChave(chave: string): Promise<EmailTemplate | null> {
    const row = await this.queryOne(
      `SELECT * FROM email_templates WHERE chave_uso = $1 LIMIT 1`,
      [chave]
    );
    return row as EmailTemplate | null;
  }

  async listarTodas(): Promise<EmailTemplate[]> {
    return (await this.query(`SELECT * FROM email_templates ORDER BY chave_uso ASC`)) as EmailTemplate[];
  }

  async criar(dados: { chave_uso: string; titulo_assunto: string; conteudo_corpo: string; email_remetente?: string; nome_remetente?: string }) {
    const row = await this.query(
      `INSERT INTO email_templates (chave_uso, titulo_assunto, conteudo_corpo, email_remetente, nome_remetente)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (chave_uso) DO UPDATE SET titulo_assunto=$2, conteudo_corpo=$3, atualizado_em=NOW()
       RETURNING *`,
      [dados.chave_uso, dados.titulo_assunto, dados.conteudo_corpo, dados.email_remetente || 'noreply@uaifrila.com.br', dados.nome_remetente || 'UAI FRILA']
    );
    return row[0];
  }

  async atualizar(chave: string, dados: Partial<EmailTemplate>) {
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    if (dados.titulo_assunto) { sets.push(`titulo_assunto=$${idx++}`); vals.push(dados.titulo_assunto); }
    if (dados.conteudo_corpo) { sets.push(`conteudo_corpo=$${idx++}`); vals.push(dados.conteudo_corpo); }
    if (sets.length === 0) return null;
    vals.push(chave);
    const row = await this.query(`UPDATE email_templates SET ${sets.join(', ')} WHERE chave_uso=$${idx} RETURNING *`, vals);
    return row[0];
  }
}
