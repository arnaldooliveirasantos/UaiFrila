const API_BASE = import.meta.env.VITE_API_URL;

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = localStorage.getItem('@UaiFrila:token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    try {
        const resposta = await fetch(url, { ...options, headers });
        if (!resposta.ok) {
            const dadosErro = await resposta.json().catch(() => ({}));
            throw new Error(dadosErro.erro || `Falha na requisição: ${resposta.status}`);
        }
        return await resposta.json();
    } catch (erro: any) {
        throw erro;
    }
}