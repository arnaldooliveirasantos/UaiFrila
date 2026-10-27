// uaifrila-api/src/utils/DateUtil.ts - VERSAO CORRIGIDA
// Converte corretamente data local em qualquer timezone para UTC 0

export class DateUtil {

  /**
   * CORRIGIDA - Converte data local em uma timezone específica para UTC 0
   * @param data - Date | string | number - Ex: "2026-10-27T15:00" (15:00 na timezone informada)
   * @param timezone - string - Ex: "America/Sao_Paulo", "America/New_York", "Europe/Lisbon"
   * @returns Date em UTC 0
   * 
   * Exemplos universais:
   * convertData("2026-10-27T15:00", "America/Sao_Paulo") => 2026-10-27T18:00:00.000Z (BRT UTC-3)
   * convertData("2026-10-27T15:00", "America/New_York") => 2026-10-27T19:00:00.000Z (NY UTC-4)
   * convertData("2026-10-27T15:00", "Europe/Lisbon") => 2026-10-27T14:00:00.000Z (Lisboa UTC+1)
   */
  static convertData(data: Date | string | number, timezone: string): Date {
    if (!data) throw new Error("Data inválida fornecida.");
    if (!timezone) throw new Error("Timezone obrigatória.");

    const strData = String(data).trim();

    // Se já é UTC (com Z ou offset), retorna direto como UTC
    if (/Z$/i.test(strData) || /[+-]\d{2}:?\d{2}$/.test(strData)) {
      const d = new Date(strData);
      if (isNaN(d.getTime())) throw new Error("Data inválida fornecida: " + data);
      return d;
    }

    // Parse wall time: "2026-10-27T15:00" ou "2026-10-27 15:00:00"
    let year: number, month: number, day: number, hour: number, minute: number, second: number;

    if (data instanceof Date) {
      // Se for Date, usa seus componentes locais como wall time na timezone alvo
      // Ex: new Date() com 15:00 local => trata como 15:00 na timezone informada
      year = data.getFullYear();
      month = data.getMonth() + 1;
      day = data.getDate();
      hour = data.getHours();
      minute = data.getMinutes();
      second = data.getSeconds();
    } else if (typeof data === 'number') {
      // Timestamp numérico já é UTC
      const d = new Date(data);
      if (isNaN(d.getTime())) throw new Error("Data inválida fornecida.");
      return d;
    } else {
      // String sem timezone: extrai componentes
      const normalized = strData.replace(' ', 'T');
      const match = normalized.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
      if (!match) {
        throw new Error("Data inválida fornecida: " + data);
      }
      year = parseInt(match[1], 10);
      month = parseInt(match[2], 10);
      day = parseInt(match[3], 10);
      hour = parseInt(match[4], 10);
      minute = parseInt(match[5], 10);
      second = parseInt(match[6] || '0', 10);
    }

    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
      throw new Error("Data inválida fornecida.");
    }

    // Wall time desejado como UTC timestamp (só para comparação)
    const desiredWallUTC = Date.UTC(year, month - 1, day, hour, minute, second);

    // Começa assumindo que wall time = UTC, depois ajusta pela diferença da timezone
    let utcGuess = desiredWallUTC;

    // Itera para convergir (necessário por causa de DST)
    for (let i = 0; i < 10; i++) {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        hourCycle: 'h23'
      });

      const parts = formatter.formatToParts(new Date(utcGuess));
      const map: Record<string, string> = {};
      for (const p of parts) {
        map[p.type] = p.value;
      }

      const tzWallUTC = Date.UTC(
        Number(map.year),
        Number(map.month) - 1,
        Number(map.day),
        Number(map.hour),
        Number(map.minute),
        Number(map.second)
      );

      const diff = desiredWallUTC - tzWallUTC;
      if (diff === 0) break;
      utcGuess += diff;
    }

    const result = new Date(utcGuess);
    if (isNaN(result.getTime())) throw new Error("Data inválida fornecida.");
    return result;
  }

  /**
   * Converte para ISO string UTC 0 para salvar no banco
   */
  static paraUTC0(data: Date | string | number, timezone: string): string {
    try {
      const utcDate = this.convertData(data, timezone);
      const iso = utcDate.toISOString();
      console.log(`[DateUtil] ${data} (${timezone}) => UTC 0: ${iso}`);
      return iso;
    } catch (e: any) {
      console.error('[DateUtil] Erro:', e.message);
      throw e;
    }
  }

  static utcParaLocal(utc: Date | string | number): Date {
    const d = new Date(utc as any);
    if (isNaN(d.getTime())) throw new Error("Data UTC inválida");
    return d;
  }

  static isUTCString(s: string): boolean {
    if (!s) return false;
    return /Z$/i.test(s.trim()) || /[+-]\d{2}:?\d{2}$/.test(s.trim());
  }
}

export default DateUtil;
