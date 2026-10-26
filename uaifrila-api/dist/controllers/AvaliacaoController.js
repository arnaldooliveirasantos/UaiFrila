"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvaliacaoController = void 0;
const pg_1 = require("pg");
class AvaliacaoController {
    registrarAvaliacao = async (req, res) => {
        const client = new pg_1.Client({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            database: process.env.DB_NAME
        });
        try {
            const { avaliadorId, avaliadoId, vagaId, nota, comentario } = req.body;
            if (!nota || nota < 1 || nota > 5) {
                res.status(400).json({ erro: 'A nota deve ser um valor inteiro entre 1 e 5 estrelas.' });
                return;
            }
            await client.connect();
            // Grava o registro da avaliação na tabela relacional
            const queryInsert = `
                INSERT INTO avaliacoes (avaliador_id, avaliado_id, vaga_id, nota, comentario, criado_em)
                VALUES ($1, $2, $3, $4, $5, NOW())
                RETURNING id
            `;
            const resultado = await client.query(queryInsert, [Number(avaliadorId), Number(avaliadoId), Number(vagaId), Number(nota), comentario]);
            res.status(201).json({
                sucesso: true,
                mensagem: 'Avaliação consolidada no barramento reputacional!',
                id: resultado.rows[0].id
            });
        }
        catch (error) {
            res.status(500).json({ erro: error.message });
        }
        finally {
            await client.end();
        }
    };
}
exports.AvaliacaoController = AvaliacaoController;
