import { Request, Response } from 'express';
import { Client } from 'pg';

export class CandidatoController {
    public listarCandidatosPorVaga = async (req: Request, res: Response): Promise<void> => {
        const client = new Client({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            database: process.env.DB_NAME
        });

        try {
            const { vagaId } = req.params;
            await client.connect();

            // Query robusta trazendo dados de perfil, foto fictícia e média agregada de avaliações anteriores
            const queryText = `
                SELECT 
                    u.id as freela_id,
                    u.nome,
                    u.whatsapp,
                    COALESCE(AVG(a.nota), 5.0) as media_avaliacao,
                    COUNT(a.id) as total_trampos
                FROM usuarios u
                LEFT JOIN candidaturas c ON c.usuario_id = u.id
                LEFT JOIN avaliacoes a ON a.avaliado_id = u.id
                WHERE c.vaga_id = $1
                GROUP BY u.id, u.nome, u.whatsapp
            `;

            const resultado = await client.query(queryText, [Number(vagaId)]);
            
            // Injeta dados mockados estáveis de geolocalização e foto para compor o visual v12
            const candidatosTratados = resultado.rows.map((f, index) => ({
                id: f.freela_id,
                nome: f.nome,
                whatsapp: f.whatsapp,
                media: Number(f.media_avaliacao).toFixed(1),
                trampos: Number(f.total_trampos),
                distancia: (1.2 + (index * 2.4)).toFixed(1) + " km",
                foto: `https://dicebear.com{f.nome}`
            }));

            res.status(200).json(candidatosTratados);
        } catch (error: any) {
            res.status(500).json({ erro: error.message });
        } finally {
            await client.end();
        }
    };
}
