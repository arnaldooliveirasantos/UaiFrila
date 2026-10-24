import { Request, Response } from 'express';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';

export class AuthController {
    public registrar = async (req: Request, res: Response): Promise<void> => {
        const client = new Client({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            database: process.env.DB_NAME
        });

        try {
            const { nome, email, senha, cpf, whatsapp, cnpj, nomeFantasia, isContratante } = req.body;
            await client.connect();

            const resTempo = await client.query("SELECT valor FROM variaveis_ambiente WHERE chave = 'EMAIL_EXPIRACAO_MINUTOS'");
            const minutosExpiracao = Number(resTempo.rows.valor);

            const resTemplate = await client.query("SELECT id, email_remetente, titulo_assunto, conteudo_corpo FROM email_templates WHERE chave_uso = 'CONFIRMACAO_CADASTRO'");
            const template = resTemplate.rows[0];

            const codigoToken = Math.floor(100000 + Math.random() * 900000).toString();
            let corpoFinal = template.conteudo_corpo.replace('{{NOME}}', nome).replace('{{CODIGO}}', codigoToken);

            const queryDisparo = `
                INSERT INTO email_historico_disparos (template_id, email_destinatario, titulo_final, conteudo_final, codigo_verificacao, status_id, expira_em, criado_em)
                VALUES ($1, $2, $3, $4, $5, (SELECT id FROM email_status WHERE chave = 'EM_ESPERA'), NOW() + cast($6 || ' minutes' as interval), NOW())
            `;
            await client.query(queryDisparo, [template.id, email, template.titulo_assunto, corpoFinal, codigoToken, minutosExpiracao]);

            res.status(200).json({ status: 'AGUARDANDO_VALIDACAO_EMAIL', email });
        } catch (error: any) {
            console.error('🚨 [Erro no Registrar Backend]:', error.message);
            res.status(500).json({ erro: error.message });
        } finally {
            await client.end();
        }
    };

    public login = async (req: Request, res: Response): Promise<void> => {
        const client = new Client({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            database: process.env.DB_NAME
        });

        try {
            const { email, senha } = req.body;
            await client.connect();

            // 🟢 CORREÇÃO: Removido o campo "nome" que causava o erro SQL 42703
            const queryText = 'SELECT id, email FROM usuarios WHERE email = $1 AND senha = $2';
            const resultado = await client.query(queryText, [email, senha]);

            if (resultado.rows.length === 0) {
                res.status(401).json({ erro: 'Credenciais inválidas de e-mail e senha.' });
                return;
            }

            const usuario = resultado.rows[0];

            const resTempo = await client.query("SELECT valor FROM variaveis_ambiente WHERE chave = 'EMAIL_EXPIRACAO_MINUTOS'");
            const minutosExpiracao = Number(resTempo.rows.valor);

            const resTemplate = await client.query("SELECT id, email_remetente, titulo_assunto, conteudo_corpo FROM email_templates WHERE chave_uso = '2FA_LOGIN'");
            const template = resTemplate.rows[0];

            const codigoToken = Math.floor(100000 + Math.random() * 900000).toString();
            let corpoFinal = template.conteudo_corpo.replace('{{CODIGO}}', codigoToken);

            const queryDisparo = `
                INSERT INTO email_historico_disparos (template_id, usuario_id, email_destinatario, titulo_final, conteudo_final, codigo_verificacao, status_id, expira_em, criado_em)
                VALUES ($1, $2, $3, $4, $5, $6, (SELECT id FROM email_status WHERE chave = 'EM_ESPERA'), NOW() + cast($7 || ' minutes' as interval), NOW())
            `;
            await client.query(queryDisparo, [template.id, usuario.id, email, template.titulo_assunto, corpoFinal, codigoToken, minutosExpiracao]);

            res.status(200).json({ status: 'AGUARDANDO_VALIDACAO_EMAIL', email });
        } catch (error: any) {
            console.error('🚨 [Erro no Login 500 Crítico]:', error.message);
            res.status(500).json({ erro: error.message });
        } finally {
            await client.end();
        }
    };

    public verificarTokenEmail = async (req: Request, res: Response): Promise<void> => {
        const client = new Client({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            database: process.env.DB_NAME
        });

        try {
            const { email, codigo } = req.body;
            await client.connect();

            const queryBusca = `
                SELECT id, codigo_verificacao, expira_em, status_id 
                FROM email_historico_disparos 
                WHERE email_destinatario = $1 
                ORDER BY criado_em DESC LIMIT 1
            `;
            const resDisparo = await client.query(queryBusca, [email]);

            if (resDisparo.rows.length === 0) {
                res.status(400).json({ erro: 'Nenhum token solicitado para este e-mail.' });
                return;
            }

            const disparo = resDisparo.rows[0];

            if (new Date() > new Date(disparo.expira_em)) {
                await client.query(
                    "UPDATE email_historico_disparos SET status_id = (SELECT id FROM email_status WHERE chave = 'EXPIRADO'), atualizado_em = NOW() WHERE id = $1",
                    [disparo.id]
                );
                res.status(400).json({ erro: 'Tempo esgotado! O token expirou. Solicite um novo envio.' });
                return;
            }

            if (disparo.codigo_verificacao !== codigo) {
                res.status(400).json({ erro: 'Código incorreto para a sessão informada.' });
                return;
            }

            await client.query(
                "UPDATE email_historico_disparos SET status_id = (SELECT id FROM email_status WHERE chave = 'VALIDADO'), atualizado_em = NOW() WHERE id = $1",
                [disparo.id]
            );

            // Retorna os dados universais do usuário autenticado
            const resUser = await client.query("SELECT id, email FROM usuarios WHERE email = $1", [email]);
            const usuario = resUser.rows[0];

            const tokenInterno = jwt.sign({ id: usuario.id, email: usuario.email }, process.env.JWT_SECRET, { expiresIn: '1d' });

            res.status(200).json({ sucesso: true, token: tokenInterno, usuario });
        } catch (error: any) {
            res.status(500).json({ erro: error.message });
        } finally {
            await client.end();
        }
    };
}
