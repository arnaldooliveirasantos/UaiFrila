import { apiFetch } from '../utils/Api';

function validateRequired(dados: any, campos: string[]) {
  for (const campo of campos) {
    if (dados?.[campo] === undefined || dados?.[campo] === null || dados?.[campo] === '') {
      throw new Error(`Campo obrigatorio: ${campo}`);
    }
  }
}

export class EnderecoService {
  async listarPorUsuario(usuarioId: number) {
    try {
      const d: any = await apiFetch(`/api/enderecos?usuario_id=${usuarioId}`);
      return d?.data || d || [];
    } catch (e: any) {
      console.warn('[EnderecoService.listarPorUsuario] erro:', e.message);
      return [];
    }
  }
  async buscarAtivoPorUsuario(usuarioId: number) {
    try {
      const d: any = await apiFetch(`/api/enderecos/ativo?usuario_id=${usuarioId}`);
      return d?.data || d || null;
    } catch (e: any) {
      console.warn('[EnderecoService.buscarAtivoPorUsuario] erro:', e.message);
      return null;
    }
  }
  async buscarPorId(id: number) {
    const d: any = await apiFetch(`/api/enderecos/${id}`);
    return d?.data || d || null;
  }
  async criar(dados: any) {
    validateRequired(dados, ['cidadeId', 'logradouro', 'bairro']);
    const d: any = await apiFetch('/api/enderecos', { method: 'POST', body: JSON.stringify(dados) });
    return d?.data || d;
  }
  async atualizar(id: number, dados: any) {
    const d: any = await apiFetch(`/api/enderecos/${id}`, { method: 'PUT', body: JSON.stringify(dados) });
    return d?.data || d;
  }
  async deletar(id: number) {
    const d: any = await apiFetch(`/api/enderecos/${id}`, { method: 'DELETE' });
    return d?.data || d;
  }
  async definirAtivo(id: number, _usuarioId: number) {
    const d: any = await apiFetch(`/api/enderecos/${id}/ativar`, { method: 'POST' });
    return d?.data || d;
  }
}
