// Dinheiro em centavos: toda conta de pagamento usa inteiro. Sem float, sem arredondamento surpresa.
// 1 real = 100 centavos. O resíduo de arredondamento é absorvido pela plataforma.
export function reaisParaCentavos(v: number): number { return Math.round(Number(v || 0) * 100); }
export function centavosParaReais(c: number): number { return Math.round(Number(c || 0)) / 100; }
export function formatarReais(c: number): string { return (centavosParaReais(c)).toFixed(2).replace('.', ','); }
// Gross-up: total = (S + T + C) / (1 - taxa). Ex.: (1000+100+110)/(1-0,01) = 1210/0,99 = 1222,22.
export function grossUpCentavos(baseComComissaoCentavos: number, taxaPercentual: number): number {
  const taxa = Number(taxaPercentual) / 100;
  if (taxa >= 1) throw new Error('Taxa do meio de pagamento inválida (>= 100%)');
  return Math.round(baseComComissaoCentavos / (1 - taxa));
}
export function comissaoCentavos(servicoCentavos: number, transporteCentavos: number, comissaoPercentual: number): number {
  return Math.round((servicoCentavos + transporteCentavos) * (Number(comissaoPercentual) / 100));
}
export function normalizarTexto(s: string): string {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim();
}
