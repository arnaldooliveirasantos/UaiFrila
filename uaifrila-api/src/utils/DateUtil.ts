export class DateUtil {
  // Converte data local (wall time) + timezone para UTC0 ISO
  public static paraUTC0(dataLocal: string, timezone: string): string {
    if (!dataLocal) throw new Error('Data local obrigatória');
    if (dataLocal.endsWith('Z')) return dataLocal;
    
    // Se vier como "2026-10-29T18:00" sem timezone, interpreta como wall time no timezone informado
    try {
      const [datePart, timePart] = dataLocal.split('T');
      if (!datePart || !timePart) throw new Error('Formato inválido');
      const [y, m, d] = datePart.split('-').map(Number);
      const [h, min] = timePart.split(':').map(v => parseInt(v) || 0);
      const sec = 0;

      // Cria UTC guess = wall time como se fosse UTC
      const desiredWallUTC = Date.UTC(y, m - 1, d, h, min, sec);

      // Itera para achar o UTC real que, quando convertido para timezone, dá o wall time desejado
      let utcGuess = desiredWallUTC;
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
        const map: any = {};
        for (const p of parts) map[p.type] = p.value;
        const tzWallUTC = Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), Number(map.hour), Number(map.minute), Number(map.second));
        const diff = desiredWallUTC - tzWallUTC;
        if (diff === 0) break;
        utcGuess += diff;
      }

      return new Date(utcGuess).toISOString();
    } catch (e: any) {
      // Fallback: tenta Date direto
      const d = new Date(dataLocal);
      if (isNaN(d.getTime())) throw new Error(`Data inválida: ${dataLocal}`);
      return d.toISOString();
    }
  }

  public static utcParaLocal(utc: string, timezone: string): Date {
    return new Date(utc);
  }

  public static calcularHoras(inicioUTC0: string, fimUTC0: string): number {
    const d1 = new Date(inicioUTC0);
    const d2 = new Date(fimUTC0);
    const diff = d2.getTime() - d1.getTime();
    if (diff <= 0) return 0;
    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
  }
}
