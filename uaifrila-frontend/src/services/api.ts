// api.ts sem axios - usa fetch nativo - COM TIMEZONE LOG
const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000/api';

function getToken(): string | null {
  return localStorage.getItem('uaifrila_token') || localStorage.getItem('@UaiFrila:token') || null;
}

async function handleResponse(res: Response) {
  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = data?.erro || data?.message || data?.error || `Erro ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  get: async (url: string) => {
    const token = getToken();
    const res = await fetch(`${API_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return handleResponse(res);
  },
  post: async (url: string, data: any) => {
    const token = getToken();
    console.log(`[API POST ${url}] Payload:`, JSON.stringify(data, null, 2));
    console.log(`[API POST] data_inicio=${data.data_inicio} timezone=${data.timezone} local=${data.data_inicio_local}`);
    if (!data.timezone) console.warn('[API] ⚠️ Frontend não está enviando timezone!');
    const res = await fetch(`${API_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });
    const result = await handleResponse(res);
    console.log(`[API POST ${url}] Resposta:`, result);
    return result;
  },
  put: async (url: string, data: any) => {
    const token = getToken();
    console.log(`[API PUT ${url}] Payload:`, JSON.stringify(data, null, 2));
    console.log(`[API PUT] data_inicio=${data.data_inicio} timezone=${data.timezone} local=${data.data_inicio_local}`);
    if (!data.timezone) console.warn('[API] ⚠️ Frontend não está enviando timezone!');
    const res = await fetch(`${API_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    });
    const result = await handleResponse(res);
    console.log(`[API PUT ${url}] Resposta:`, result);
    return result;
  },
  delete: async (url: string) => {
    const token = getToken();
    const res = await fetch(`${API_URL}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return handleResponse(res);
  }
};
