// Geocodificacao via Nominatim (OpenStreetMap) — gratuita, sem chave de API.
// Usada ANTES de armazenar um endereco: busca latitude/longitude pelo endereco completo.
// Limite do Nominatim: ~1 req/segundo — salvamento de endereco e esporadico, ok.
// NUNCA quebra o salvamento: sem internet, timeout, sem resultado ou resposta
// invalida -> devolve null e o endereco e salvo sem coordenadas (como era antes).
export async function geocodificarEndereco(end: {
  logradouro?: string; numero?: string | number; bairro?: string;
  cidade?: string; estado?: string; cep?: string;
}): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof fetch !== 'function') return null;
  const partes = [
    [end.logradouro, end.numero].filter((x) => x !== undefined && x !== null && String(x).trim() !== '').join(' '),
    end.bairro,
    [end.cidade, end.estado].filter((x) => x && String(x).trim() !== '').join(' - '),
    end.cep,
  ].filter((x) => x && String(x).trim() !== '');
  if (partes.length < 2) return null;
  const q = encodeURIComponent(`${partes.join(', ')}, Brasil`);
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${q}`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'UaiFrila/1.0' }, signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const lista = (await res.json()) as any[];
    const prim = lista?.[0];
    if (!prim) return null;
    const lat = Number(prim.lat);
    const lon = Number(prim.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { latitude: lat, longitude: lon };
  } catch { return null; }
}
