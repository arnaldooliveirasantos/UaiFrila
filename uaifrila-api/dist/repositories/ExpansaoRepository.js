"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpansaoRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class ExpansaoRepository extends BaseRepository_1.BaseRepository {
    async listarExpansao(filtros) {
        let where = 'WHERE 1=1';
        const params = [];
        let idx = 1;
        if (filtros.status && filtros.status !== 'todos') {
            where += ` AND e.status = $${idx}`;
            params.push(filtros.status.toUpperCase());
            idx++;
        }
        if (filtros.prioridade !== undefined && filtros.prioridade !== -1) {
            where += ` AND e.prioridade = $${idx}`;
            params.push(filtros.prioridade);
            idx++;
        }
        if (filtros.search) {
            where += ` AND (e.cidade_nome ILIKE $${idx} OR e.estado_sigla ILIKE $${idx})`;
            params.push(`%${filtros.search}%`);
            idx++;
        }
        return await this.query(`
      SELECT 
        e.*,
        u1.nome_completo as solicitado_por_nome,
        u2.nome_completo as analisado_por_nome,
        c.id as cidade_existente_id,
        c.nome as cidade_existente_nome
      FROM expansao_cidades e
      LEFT JOIN usuarios u1 ON u1.id = e.solicitado_por
      LEFT JOIN usuarios u2 ON u2.id = e.analisado_por
      LEFT JOIN cidades c ON LOWER(c.nome) = LOWER(e.cidade_nome) AND c.estado = e.estado_sigla
      ${where}
      ORDER BY e.prioridade DESC, e.demanda_solicitacoes DESC, e.criado_em DESC
    `, params);
    }
    async listarCidadesHierarquia() {
        try {
            return await this.query(`
        SELECT 
          p.id as pais_id, p.nome as pais_nome, p.sigla as pais_sigla,
          e.id as estado_id, e.nome as estado_nome, e.sigla as estado_sigla, e.regiao,
          c.id as cidade_id, c.nome as cidade_nome, c.codigo_ibge, c.populacao, c.status_expansao, c.demanda_score, c.vagas_abertas, c.freelas_ativos, c.ativa,
          COUNT(DISTINCT b.id) as total_bairros
        FROM paises p
        LEFT JOIN estados e ON e.pais_id = p.id
        LEFT JOIN cidades c ON c.estado_id = e.id OR c.estado = e.sigla
        LEFT JOIN bairros b ON b.cidade_id = c.id
        GROUP BY p.id, e.id, c.id
        ORDER BY p.nome, e.sigla, c.demanda_score DESC, c.nome
      `);
        }
        catch {
            // Fallback sem hierarquia completa
            return await this.query(`SELECT id as cidade_id, nome as cidade_nome, estado, populacao, status_expansao, demanda_score, ativa FROM cidades ORDER BY demanda_score DESC`);
        }
    }
    async listarBairros(cidadeId) {
        return await this.query(`SELECT * FROM bairros WHERE cidade_id = $1 ORDER BY demanda DESC, nome`, [cidadeId]);
    }
    async criarSolicitacao(dados) {
        const cidade = dados.cidade_nome.trim();
        const estado = dados.estado_sigla.trim().toUpperCase();
        // Verifica se já existe solicitação
        const existe = await this.query(`SELECT id FROM expansao_cidades WHERE LOWER(cidade_nome) = LOWER($1) AND estado_sigla = $2`, [cidade, estado]);
        if (existe.length > 0) {
            throw new Error(`Cidade ${cidade}/${estado} já possui solicitação de expansão`);
        }
        return await this.query(`
      INSERT INTO expansao_cidades (cidade_nome, estado_sigla, populacao, motivo, solicitado_por, status, prioridade)
      VALUES ($1, $2, $3, $4, $5, 'SOLICITADA', 1)
      RETURNING *
    `, [cidade, estado, dados.populacao || null, dados.motivo || null, dados.solicitado_por]);
    }
    async atualizarStatus(id, status, analisado_por, motivo) {
        const statusValido = ['SOLICITADA', 'EM_ANALISE', 'APROVADA', 'REJEITADA', 'ATIVA'];
        if (!statusValido.includes(status.toUpperCase())) {
            throw new Error(`Status inválido. Use: ${statusValido.join(', ')}`);
        }
        const update = {
            status: status.toUpperCase(),
            analisado_por,
            atualizado_em: new Date()
        };
        if (status.toUpperCase() === 'ATIVA') {
            update.data_ativacao = new Date();
            // Ativa cidade se existir ou cria
            await this.ativarOuCriarCidade(id);
        }
        if (status.toUpperCase() === 'EM_ANALISE') {
            update.data_analise = new Date();
        }
        let setClause = `status = $2, analisado_por = $3, atualizado_em = NOW()`;
        const params = [id, status.toUpperCase(), analisado_por];
        let idx = 4;
        if (motivo) {
            setClause += `, motivo = $${idx}`;
            params.push(motivo);
            idx++;
        }
        if (update.data_ativacao) {
            setClause += `, data_ativacao = NOW()`;
        }
        if (update.data_analise) {
            setClause += `, data_analise = NOW()`;
        }
        return await this.query(`UPDATE expansao_cidades SET ${setClause} WHERE id = $1 RETURNING *`, params);
    }
    async ativarOuCriarCidade(expansaoId) {
        const expansao = await this.queryOne(`SELECT * FROM expansao_cidades WHERE id = $1`, [expansaoId]);
        if (!expansao)
            return;
        // Verifica se cidade já existe
        const cidadeExistente = await this.queryOne(`SELECT id FROM cidades WHERE LOWER(nome) = LOWER($1) AND estado = $2`, [expansao.cidade_nome, expansao.estado_sigla]);
        if (cidadeExistente) {
            await this.query(`UPDATE cidades SET ativa = true, status_expansao = 'ATIVA' WHERE id = $1`, [cidadeExistente.id]);
        }
        else {
            const paisId = (await this.queryOne(`SELECT id FROM paises WHERE sigla='BRA'`))?.id || 1;
            const estadoId = (await this.queryOne(`SELECT id FROM estados WHERE sigla=$1`, [expansao.estado_sigla]))?.id;
            await this.query(`
        INSERT INTO cidades (nome, estado, pais_id, estado_id, populacao, ativa, status_expansao, demanda_score, lat, lng)
        VALUES ($1, $2, $3, $4, $5, true, 'ATIVA', $6, -18.9, -48.27)
      `, [expansao.cidade_nome, expansao.estado_sigla, paisId, estadoId, expansao.populacao || 50000, expansao.demanda_solicitacoes || 10]);
        }
    }
    async obterEstatisticas() {
        const stats = await this.query(`
      SELECT 
        COUNT(*) as total_solicitacoes,
        COUNT(CASE WHEN status='SOLICITADA' THEN 1 END) as solicitadas,
        COUNT(CASE WHEN status='EM_ANALISE' THEN 1 END) as em_analise,
        COUNT(CASE WHEN status='APROVADA' THEN 1 END) as aprovadas,
        COUNT(CASE WHEN status='ATIVA' THEN 1 END) as ativas,
        COUNT(CASE WHEN status='REJEITADA' THEN 1 END) as rejeitadas,
        COALESCE(SUM(demanda_solicitacoes),0) as total_demanda,
        COALESCE(AVG(prioridade),0) as prioridade_media
      FROM expansao_cidades
    `);
        const cidades = await this.query(`SELECT COUNT(*) as total_cidades, COUNT(CASE WHEN ativa=true THEN 1 END) as ativas FROM cidades`);
        return { expansao: stats[0], cidades: cidades[0] };
    }
}
exports.ExpansaoRepository = ExpansaoRepository;
