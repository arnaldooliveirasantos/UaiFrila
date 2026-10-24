import { Request, Response } from 'express';
import { Client } from 'pg';
import jwt from 'jsonwebtoken';

export class SSOController {
    public autenticarGoogle = async (req: Request, res: Response): Promise<void> => {
        const client = new Client({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            database: process.env.DB_NAME
        });

        try {
            const { email, nome, googleId } = req.body;
            await client.connect();

            // Verifica se o usuário já existe na base relacional
            const queryExiste = 'SELECT id, nome, email, is_contratante, is_admin FROM usuarios WHERE email = $1';
            const resExiste = await client.query(queryExiste, [email]);

            if (resExiste.rows.length > 0) {
                // USUÁRIO EXISTE -> REALIZA O LOGIN IMEDIATO
                const usuario = resExiste.rows[0];
                const tokenInterno = jwt.sign(
                    { id: usuario.id, email: usuario.email, is_admin: usuario.is_admin },
                    process.env.JWT_SECRET || 'secret',
                    { expiresIn: '1d' }
                );

                res.status(200).json({
                    status: 'LOGIN',
                    token: tokenInterno,
                    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, is_contratante: usuario.is_contratante, is_admin: usuario.is_admin }
                });
            } else {
                // USUÁRIO NÃO EXISTE -> SINALIZA NECESSIDADE DE CONCLUSÃO DE CADASTRO
                res.status(200).json({
                    status: 'REGISTRO_PENDENTE',
                    dadosPrePreenchidos: { nome, email, googleId }
                });
            }
        } catch (error: any) {
            res.status(500).json({ erro: error.message });
        } finally {
            await client.end();
        }
    };
}
