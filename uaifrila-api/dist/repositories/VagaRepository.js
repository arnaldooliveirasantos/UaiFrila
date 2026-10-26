"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VagaRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class VagaRepository extends BaseRepository_1.BaseRepository {
    async criarVaga(dados) {
        const { contratante_id, titulo, descricao, valor, data_inicio, funcao, cidade_nome } = dados;
        try {
            return await this.query(`INSERT INTO vagas (contratante_id, titulo, descricao, valor, data_inicio, funcao, cidade_nome, status) 
         VALUES ($1,$2,$3,$4,$5,$6,$7,'ABERTA') RETURNING *`, [contratante_id, titulo, descricao, valor || 100, data_inicio || new Date(), funcao || 'Garçom', cidade_nome || 'Uberlândia']);
        }
        catch (e) {
            console.error('Erro criar vaga:', e.message);
            throw e;
        }
    }
    async listarVagas(filtros = {}) {
        try {
            return await this.query(`SELECT * FROM vagas WHERE status = 'ABERTA' ORDER BY criado_em DESC LIMIT 50`);
        }
        catch (e) {
            console.warn('Vagas table error, returning empty:', e.message);
            return [];
        }
    }
    async buscarPorId(id) {
        try {
            return await this.queryOne(`SELECT * FROM vagas WHERE id = $1`, [id]);
        }
        catch {
            return null;
        }
    }
    async buscarMuralSemBloqueiosDeAvaliacao(usuarioId) {
        try {
            // Se usuarioId 0 ou super admin, retorna tudo
            if (!usuarioId || usuarioId === 0) {
                return await this.listarVagas();
            }
            return await this.query(`SELECT v.*, u.nome_fantasia as contratante_nome, u.avaliacao_media as contratante_avaliacao
         FROM vagas v
         LEFT JOIN usuarios u ON v.contratante_id = u.id
         WHERE v.status = 'ABERTA' 
         AND (v.contratante_id != $1 OR $1 = 0)
         ORDER BY v.criado_em DESC
         LIMIT 50`, [usuarioId]);
        }
        catch (e) {
            console.warn('buscarMural error:', e.message);
            return await this.listarVagas();
        }
    }
}
exports.VagaRepository = VagaRepository;
