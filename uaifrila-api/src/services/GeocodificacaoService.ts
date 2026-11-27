// Geocodificacao via Nominatim (OpenStreetMap) - gratuita, sem chave.
// Usada ANTES de armazenar um endereco. Limite do Nominatim: ~1 req/segundo.
// REGRA: NUNCA quebra o salvamento. Se falhar, retorna null COM LOG do motivo
// e o endereco e salvo sem coordenadas - o worker de geocodificacao (pasta
// uaifrila-geocodificacao-worker) tenta de novo depois, com backoff.
// Retornar null aqui NAO e fallback silencioso: e o contrato documentado,
// e todo null gera log + fica rastreavel em enderecos.geocodificacao_tentativas.
import { registrarErro } from '../utils/registrarErro';
export interface ResultadoGeocodificacao { coords: { latitude: number; longitude: number } | null; motivo: string; }
function montarQuery(end: { logradouro?: string; numero?: string | number; bairro?: string; cidade?: string; estado?: string; cep?: string; }): string | null {
  const partes = [
    [end.logradouro, end.numero].filter((x) => x !== undefined && x !== null && String(x).trim() !== '').join(' '),
    end.bairro,
    [end.cidade, end.estado].filter((x) => x && String(x).trim() !== '').join(' - '),
    end.cep,
  ].filter((x) => x && String(x).trim() !== '');
  if (partes.length < 2) return null;
  return `${partes.join(', ')}, Brasil`;
}
export async function geocodificarEnderecoComMotivo(end: { logradouro?: string; numero?: string | number; bairro?: string; cidade?: string; estado?: string; cep?: string; }): Promise<ResultadoGeocodificacao> {
  const q = montarQuery(end);
  if (!q) { registrarErro('GeocodificacaoService.enderecoIncompleto', new Error('Endereco incompleto para geocodificar'), { cep: end.cep }); return { coords: null, motivo: 'ENDERECO_INCOMPLETO' }; }
  if (typeof fetch !== 'function') { registrarErro('GeocodificacaoService.semFetch', new Error('fetch indisponivel')); return { coords: null, motivo: 'FETCH_INDISPONIVEL' }; }
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`;
  try {
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'UaiFrila/1.0' }, signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) { registrarErro('GeocodificacaoService.nominatimHttp', new Error(`Nominatim HTTP ${res.status}`), { cep: end.cep }); return { coords: null, motivo: `NOMINATIM_HTTP_${res.status}` }; }
    const lista = (await res.json()) as any[]; const prim = lista?.[0];
    if (!prim) { registrarErro('GeocodificacaoService.semResultado', new Error('Nominatim sem resultado'), { cep: end.cep, logradouro: end.logradouro }); return { coords: null, motivo: 'SEM_RESULTADO' }; }
    const lat = Number(prim.lat); const lon = Number(prim.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) { registrarErro('GeocodificacaoService.coordenadaInvalida', new Error('Coordenada invalida do Nominatim'), { cep: end.cep }); return { coords: null, motivo: 'COORDENADA_INVALIDA' }; }
    return { coords: { latitude: lat, longitude: lon }, motivo: 'OK' };
  } catch (e: any) { registrarErro('GeocodificacaoService.falha', e, { cep: end.cep }); return { coords: null, motivo: 'FALHA_REDE_TIMEOUT' }; }
}
// Compat: quem chamava antes continua funcionando, mas agora o null vem logado.
export async function geocodificarEndereco(end: { logradouro?: string; numero?: string | number; bairro?: string; cidade?: string; estado?: string; cep?: string; }): Promise<{ latitude: number; longitude: number } | null> {
  const r = await geocodificarEnderecoComMotivo(end); return r.coords;
}
