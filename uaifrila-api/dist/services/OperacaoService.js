"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperacaoService = void 0;
const OperacaoRepository_1 = require("../repositories/OperacaoRepository");
class OperacaoService {
    repo = new OperacaoRepository_1.OperacaoRepository();
    async candidatarVaga(vagaId, freelaId) {
        const possuiBloqueio = await this.repo.checarAvaliacoesRuins(freelaId, vagaId);
        if (possuiBloqueio) {
            throw new Error('Você não possui permissão para se candidatar devido ao histórico de avaliações.');
        }
        await this.repo.registrarCandidatura(vagaId, freelaId);
    }
    async aceitarCandidato(vagaId, freelaId) {
        await this.repo.iniciarTransacao();
        try {
            await this.repo.aprovarCandidato(vagaId, freelaId);
            await this.repo.rejeitarDemaisCandidatos(vagaId, freelaId);
            await this.repo.ativarStatusVaga(vagaId);
            // Geração estrita dos tokens alfanuméricos de uso único para validação presencial do ponto
            const codigoInicio = Math.random().toString(36).substring(2, 7).toUpperCase();
            const codigoFim = Math.random().toString(36).substring(2, 7).toUpperCase();
            const trampo = await this.repo.criarTrampoAtivo(vagaId, freelaId, codigoInicio, codigoFim);
            await this.repo.confirmarTransacao();
            return trampo;
        }
        catch (error) {
            await this.repo.cancelarTransacao();
            throw error;
        }
    }
    async salvarMensagem(vagaId, remetenteId, conteudo) {
        const participantes = await this.repo.obterParticipantesVaga(vagaId);
        if (!participantes)
            throw new Error('Vaga não localizada.');
        const destId = remetenteId === participantes.contratante_id ? participantes.freela_id : participantes.contratante_id;
        return await this.repo.registrarMensagemChat(vagaId, remetenteId, destId, conteudo);
    }
    async buscarHistoricoChat(vagaId) {
        return await this.repo.obterHistoricoMensagens(vagaId);
    }
}
exports.OperacaoService = OperacaoService;
