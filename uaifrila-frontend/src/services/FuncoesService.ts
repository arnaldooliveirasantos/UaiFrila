import { apiFetch } from '../utils/Api';
export const FAIXAS = [
  { label: 'Menos de 1 ano', meses: 6 }, { label: '1 a 2 anos', meses: 18 },
  { label: '3 a 5 anos', meses: 48 }, { label: 'Mais de 5 anos', meses: 72 },
];
export async function listarCategoriasComFuncoes() {
  const d = await apiFetch('/api/categorias-funcao/com-funcoes');
  return d.data || d || [];
}
export async function listarMinhasFuncoes() {
  const d = await apiFetch('/api/minhas-funcoes');
  return d.data || [];
}
export async function salvarMinhaFuncao(payload: any) {
  const d = await apiFetch('/api/minhas-funcoes', { method: 'POST', body: JSON.stringify(payload) });
  return d.data || d;
}
export async function removerMinhaFuncao(funcaoId: number) {
  await apiFetch(`/api/minhas-funcoes/${funcaoId}`, { method: 'DELETE' });
}
export async function salvarFoto(usuarioId: number, foto: string | null) {
  const d = await apiFetch(`/api/usuarios/${usuarioId}`, { method: 'PUT', body: JSON.stringify({ foto }) });
  return d.data || d;
}
