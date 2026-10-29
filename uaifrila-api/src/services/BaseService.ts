import { BaseRepository } from '../repositories/BaseRepository';

export abstract class BaseService {
  protected repository: BaseRepository;

  constructor(repository: BaseRepository) {
    this.repository = repository;
  }

  // Método para validar dados obrigatórios
  protected validarObrigatorios(dados: any, campos: string[]): void {
    const faltando: string[] = [];
    for (const campo of campos) {
      if (dados[campo] === undefined || dados[campo] === null || dados[campo] === '') {
        faltando.push(campo);
      }
    }
    if (faltando.length > 0) {
      throw new Error(`Campos obrigatórios faltando: ${faltando.join(', ')}`);
    }
  }

  // Sanitiza string
  protected sanitizarTexto(texto: string, maxLength?: number): string {
    if (!texto) return texto;
    let limpo = texto.trim();
    if (maxLength && limpo.length > maxLength) {
      limpo = limpo.slice(0, maxLength);
    }
    return limpo;
  }

  // Calcula valor hora = Freela / Horas (só cálculo do freela)
  protected calcularValorHoraFreela(valorServico: number, valorTransporte: number, meioPagamento: 'pix' | 'cartao', horas: number, taxas?: any): number {
    const base = Number(valorServico || 0) + Number(valorTransporte || 0);
    const taxaPercent = meioPagamento === 'cartao' ? (taxas?.taxa_cartao_percentual || 0.04) : (taxas?.taxa_pix_percentual || 0.01);
    const taxa = typeof taxaPercent === 'number' && taxaPercent > 1 ? taxaPercent / 100 : taxaPercent; // aceita 1 ou 0.01
    const comissaoPercent = taxas?.comissao_percentual ? (taxas.comissao_percentual > 1 ? taxas.comissao_percentual / 100 : taxas.comissao_percentual) : 0.10;
    const freelaRecebe = base - (base * taxa) - (base * comissaoPercent);
    return horas > 0 ? freelaRecebe / horas : freelaRecebe;
  }

  // Calcula horas entre duas datas UTC
  protected calcularHoras(inicioUTC0: string, fimUTC0: string): number {
    const d1 = new Date(inicioUTC0);
    const d2 = new Date(fimUTC0);
    const diff = d2.getTime() - d1.getTime();
    if (diff <= 0) return 0;
    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
  }

  // Log padronizado
  protected log(info: string, dados?: any) {
    console.log(`[${this.constructor.name}] ${info}`, dados || '');
  }

  protected logErro(info: string, erro: any) {
    console.error(`[${this.constructor.name}] ${info}`, erro?.message || erro);
  }
}
