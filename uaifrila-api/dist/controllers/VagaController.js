"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VagaController = void 0;
const VagaRepository_1 = require("../repositories/VagaRepository");
class VagaController {
    vagaRepo = new VagaRepository_1.VagaRepository();
    listarMural = async (req, res) => {
        try {
            const { usuarioId, tipo } = req.body;
            const list = await this.vagaRepo.buscarMuralSemBloqueiosDeAvaliacao(Number(usuarioId));
            const mapped = list.map(v => {
                const sub = (Number(v.horas_estimadas) * Number(v.valor_hora_limpo)) + Number(v.ajuda_custo_transporte);
                if (tipo === 'FREELA') {
                    return { ...v, valor_visivel: sub };
                }
                return {
                    ...v,
                    total_cartao: sub * 1.14,
                    total_pix_desconto: sub * 1.10
                };
            });
            res.json(mapped);
        }
        catch (error) {
            res.status(500).json({ erro: error.message });
        }
    };
    criarVaga = async (req, res) => {
        try {
            const { usuarioId, funcao, dataHora, horasEstimadas, valorHoraLimpo, ajudaCustoTransporte, enderecoCompleto, bairroId } = req.body;
            // Validação de segurança temporal estrita: Dias permitidos de Quinta a Domingo
            const dataVaga = new Date(dataHora);
            const diaSemana = dataVaga.getDay(); // 0 = Domingo, 4 = Quinta, 5 = Sexta, 6 = Sábado
            if (diaSemana !== 0 && diaSemana < 4) {
                res.status(400).json({ erro: 'Regra Temporal v12: Publicação permitida apenas para turnos de Quinta-feira a Domingo.' });
                return;
            }
            const novaVaga = await this.vagaRepo.salvar({
                contratanteId: Number(usuarioId),
                funcao,
                dataHora,
                horasEstimadas: Number(horasEstimadas),
                valorHoraLimpo: Number(valorHoraLimpo),
                ajudaCustoTransporte: Number(ajudaCustoTransporte),
                enderecoCompleto,
                bairroId: Number(bairroId || 1)
            });
            res.status(201).json({ sucesso: true, vaga: novaVaga[0] });
        }
        catch (error) {
            res.status(500).json({ erro: error.message });
        }
    };
}
exports.VagaController = VagaController;
