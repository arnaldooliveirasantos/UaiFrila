// utils/dataBrasilia.ts - Todos horários no padrão Brasília
export const TZ_BRASILIA = 'America/Sao_Paulo';

export function agoraBrasilia(): Date {
  return new Date();
}

export function formatarBrasilia(data: string | Date | null | undefined, formato: 'completo' | 'data' | 'hora' | 'curto' = 'completo'): string {
  if (!data) return '';
  const d = typeof data === 'string' ? new Date(data) : data;
  if (isNaN(d.getTime())) return '';
  try {
    if (formato === 'completo') {
      return d.toLocaleString('pt-BR', { timeZone: TZ_BRASILIA, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    if (formato === 'data') {
      return d.toLocaleDateString('pt-BR', { timeZone: TZ_BRASILIA });
    }
    if (formato === 'hora') {
      return d.toLocaleTimeString('pt-BR', { timeZone: TZ_BRASILIA, hour: '2-digit', minute: '2-digit' });
    }
    if (formato === 'curto') {
      return d.toLocaleString('pt-BR', { timeZone: TZ_BRASILIA, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleString('pt-BR', { timeZone: TZ_BRASILIA });
  } catch {
    return d.toLocaleString('pt-BR');
  }
}

export function getMinDateTimeBrasilia(minutosAntecedencia: number = 30): string {
  const agora = new Date();
  agora.setMinutes(agora.getMinutes() + minutosAntecedencia);
  // Retorna YYYY-MM-DDTHH:mm no horário local (que já é Brasília no browser do usuário)
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth()+1).padStart(2,'0');
  const dia = String(agora.getDate()).padStart(2,'0');
  const hora = String(agora.getHours()).padStart(2,'0');
  const min = String(agora.getMinutes()).padStart(2,'0');
  return `${ano}-${mes}-${dia}T${hora}:${min}`;
}

export function toISOStringBrasilia(dataLocal: string): string {
  // dataLocal vem do input datetime-local (já em horário local do usuário que está em Brasília)
  // Converte para ISO UTC para salvar no banco
  if (!dataLocal) return new Date().toISOString();
  return new Date(dataLocal).toISOString();
}
