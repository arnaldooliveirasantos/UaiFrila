// Distancia em linha reta (Haversine) entre dois pontos.
// Calculada NO FRONT: entre o endereco ativo do usuario e o endereco da vaga.
// Sem coordenada valida dos dois lados, devolve null — e o Mural nao exibe
// distancia (sem fallback, sem valor inventado).
export function calcularDistanciaKm(lat1: number, lng1: number, lat2: number, lng2: number): number | null {
  const v = [lat1, lng1, lat2, lng2].map(Number);
  if (v.some((x) => !Number.isFinite(x) || x === 0)) return null;
  const R = 6371;
  const dLat = (v[2] - v[0]) * Math.PI / 180;
  const dLng = (v[3] - v[1]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(v[0] * Math.PI / 180) * Math.cos(v[2] * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatarDistancia(km: number | null): string | null {
  if (km == null) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
