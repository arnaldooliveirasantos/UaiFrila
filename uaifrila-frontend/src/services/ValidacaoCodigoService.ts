import { apiGetPublic } from '../utils/Api';
// Extraido de ValidacaoCodigo.tsx, que usava fetch direto + IP hardcoded. ValidacaoCodigo.tsx passa a importar daqui.
export const ValidacaoCodigoService = {
  validar: (body: any) => apiGetPublic('/api/auth/validar-codigo', { method: 'POST', body: JSON.stringify(body) }),
  reenviar: (body: any) => apiGetPublic('/api/auth/reenviar-codigo', { method: 'POST', body: JSON.stringify(body) }),
  cancelar: (body: any) => apiGetPublic('/api/auth/cancelar-cadastro', { method: 'POST', body: JSON.stringify(body) }),
};
