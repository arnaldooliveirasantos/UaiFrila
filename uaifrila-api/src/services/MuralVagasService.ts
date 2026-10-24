import { VagaRepository } from '../repositories/VagaRepository.js';
export class MuralVagasService {
  private vagaRepo = new VagaRepository();
  async listarVagasParaMural(usuarioId: number, tipoUsuario: 'FREELA' | 'CONTRATANTE'): Promise<any[]> {
    const vagasBrutas = await this.vagaRepo.buscarMuralSemBloqueiosDeAvaliacao(usuarioId);
    // Dual mode: contratante não vê suas próprias vagas no quadro de freela
    const filtradas = tipoUsuario === 'FREELA' ? vagasBrutas.filter((v:any)=> v.contratante_id !== usuarioId) : vagasBrutas;
    return filtradas.map((vaga:any)=>{
      const subtotal = (Number(vaga.horas_estimadas)*Number(vaga.valor_hora_limpo))+Number(vaga.ajuda_custo_transporte);
      if (tipoUsuario === 'FREELA') {
        return { id: vaga.id, funcao: vaga.funcao, data_hora: vaga.data_hora, endereco_completo: vaga.endereco_completo, valor_visivel: subtotal, status: vaga.status, contratante_id: vaga.contratante_id };
      } else {
        return { id: vaga.id, funcao: vaga.funcao, data_hora: vaga.data_hora, endereco_completo: vaga.endereco_completo, total_cartao: subtotal*1.14, total_pix_desconto: subtotal*1.10, status: vaga.status, contratante_id: vaga.contratante_id };
      }
    });
  }
}
