// Copia intencional da logica da API, sem depender da API.
// Mesma regra: Nominatim, 1 req/segundo, timeout 6s. Retorna motivo, nunca null silencioso.
export async function geocodificar(end: { logradouro?: string; numero?: string | number; bairro?: string; cidade?: string; estado?: string; cep?: string; }): Promise<{ coords: { latitude: number; longitude: number } | null; motivo: string }> {
  const partes = [[end.logradouro, end.numero].filter(x => x !== undefined && x !== null && String(x).trim() !== '').join(' '), end.bairro, [end.cidade, end.estado].filter(x => x && String(x).trim() !== '').join(' - '), end.cep].filter(x => x && String(x).trim() !== '');
  if (partes.length < 2) return { coords: null, motivo: 'ENDERECO_INCOMPLETO' };
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(`${partes.join(', ')}, Brasil`)}`;
  try {
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'UaiFrila/1.0 (geocodificacao-worker)' }, signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return { coords: null, motivo: `NOMINATIM_HTTP_${res.status}` };
    const lista = (await res.json()) as any[]; const prim = lista?.[0];
    if (!prim) return { coords: null, motivo: 'SEM_RESULTADO' };
    const lat = Number(prim.lat); const lon = Number(prim.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { coords: null, motivo: 'COORDENADA_INVALIDA' };
    return { coords: { latitude: lat, longitude: lon }, motivo: 'OK' };
  } catch { return { coords: null, motivo: 'FALHA_REDE_TIMEOUT' }; }
}
